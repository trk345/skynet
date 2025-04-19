const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models/userSchemas');
const { Property } = require('../models/propertySchemas');
const mongoose = require('mongoose');
const validator = require("validator");

function createJWT(user) {
  const payload = {
    userId: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const getUserIdFromToken = (req) => {
  const token = req.cookies.token;
  if (!token) return null;

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.userId;
  } catch {
      return null;
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || !validator.isEmail(email.trim())) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const sanitizedEmail = email.trim();
    const user = await User.findOne({ email: sanitizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Update lastLogin timestamp
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = createJWT(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (typeof email !== "string" || !validator.isEmail(email.trim())) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    email = email.trim().toLowerCase(); // Trim and normalize email

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Invalid password format" });
    }

    const admin = await User.findOne({ email, role: "admin" }).select("+password");

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await User.findByIdAndUpdate(admin._id, { lastLogin: new Date() });

    const token = createJWT(admin);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({ message: "Admin login successful" });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// User Signup Controller
const signup = async (req, res) => {
  try {
    let { username, email, password } = req.body;

    // Trim inputs to remove accidental spaces
    username = username?.trim();
    email = email?.trim().toLowerCase(); // Convert email to lowercase for consistency

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Password regex: Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long, include 1 uppercase, 1 lowercase, 1 number, and 1 special character' 
      });
    }

    // Check for existing user (case-insensitive)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user WITHOUT manual hashing
    const newUser = new User({
      username,
      email,
      password, // ✅ Directly assign plain password (pre-save hook will hash it)
      role: 'user',
      lastLogin: new Date(),
    });

    await newUser.save();

    const token = createJWT(newUser);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 3600000, // 1 hour
    });

    res.status(201).json({ message: 'Signup successful, please log in' });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Protected route to fetch user info
const authMe = async (req, res) => {
  try {
    // `req.user` is already set by `authenticateUser` middleware
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error in authMe:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: "Lax" });
  return res.status(200).json({ message: "Logout successful" });
};



const getProperties = async (req, res) => {
  const userId = getUserIdFromToken(req);

  try {
    const { type, location, price, maxGuests, checkIn, checkOut, averageRating } = req.query;

    // Step 1: Validate & sanitize query inputs (user-controlled)
    const validTypes = ['standard-room', 'luxury-room', 'business-suite', 'apartment', 'villa'];
    const safeFilters = {};

    // Validate 'type' and sanitize (ensure it's one of the valid types)
    if (type) {
      if (!validTypes.includes(type)) {
        return res.status(400).json({ success: false, error: "Invalid type" });
      }
      safeFilters.type = type;  // Safely assign as it is pre-validated
    }

    // Validate and sanitize location (ensure it's a string and clean the input)
    if (location) {
      if (typeof location !== 'string' || location.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Invalid location format" });
      }
      // Sanitize location to prevent any malicious characters
      safeFilters.location = location.trim();
    }

    // Validate and sanitize price (ensure it's a valid number)
    if (price) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ success: false, error: "Invalid price format" });
      }
      safeFilters.price = { $lte: parsedPrice };
    }

    // Validate and sanitize maxGuests (ensure it's an integer and valid)
    if (maxGuests) {
      const parsedGuests = parseInt(maxGuests);
      if (isNaN(parsedGuests)) {
        return res.status(400).json({ success: false, error: "Invalid guests format" });
      }
      safeFilters.maxGuests = { $lte: parsedGuests };
    }

    // Validate and sanitize check-in/check-out dates (ensure they're valid dates)
    if (checkIn && checkOut) {
      const parsedCheckIn = Date.parse(checkIn);
      const parsedCheckOut = Date.parse(checkOut);
      if (isNaN(parsedCheckIn) || isNaN(parsedCheckOut)) {
        return res.status(400).json({ success: false, error: "Invalid date format" });
      }
      safeFilters.bookedDates = {
        $not: {
          $elemMatch: {
            checkIn: { $lt: new Date(parsedCheckOut) },
            checkOut: { $gt: new Date(parsedCheckIn) }
          }
        }
      };
    }

    // Validate and sanitize averageRating
    if (averageRating) {
      const parsedRating = parseFloat(averageRating);
      if (isNaN(parsedRating)) {
        return res.status(400).json({ success: false, error: "Invalid average rating format" });
      }
      safeFilters.averageRating = { $gte: parsedRating };
    }

    // Exclude properties owned by the current user
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      safeFilters.userID = { $ne: new mongoose.Types.ObjectId(userId) };
    }

    // Step 2: Execute query with pre-validated filters
    const properties = await Property.find(safeFilters);

    // Step 3: Return properties or handle case where no properties match
    if (properties.length === 0) {
      return res.status(404).json({ success: false, error: "No properties found" });
    }

    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ success: false, error: "Could not fetch properties" });
  }
};



// Fetch a single Property
const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    res.status(200).json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, error: "Could not fetch the property in server" })
  }
}

module.exports = { login, signup, adminLogin, authMe, logout, getProperties, getProperty };
