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



// Utility function to sanitize and validate input
const sanitizeAndValidate = (value, type) => {
  if (type === 'string') {
    return value ? value.trim() : '';
  }
  if (type === 'number') {
    const parsedValue = parseFloat(value);
    return isNaN(parsedValue) ? null : parsedValue;
  }
  if (type === 'date') {
    const parsedDate = moment(value, 'YYYY-MM-DD', true);
    return parsedDate.isValid() ? parsedDate.toDate() : null;
  }
  return value;
};

// Controller function for searching properties
const getProperties = async (req, res) => {
  try {
    const {
      type,
      location,
      price,
      maxGuests,
      checkIn,
      checkOut,
      averageRating,
    } = req.query;

    // Ensure only allowed search parameters are used
    const allowedFields = ['type', 'location', 'price', 'maxGuests', 'checkIn', 'checkOut', 'averageRating'];

    // Build the query object for MongoDB
    let query = {};

    // Sanitize and validate inputs
    if (type && allowedFields.includes('type')) query.type = sanitizeAndValidate(type, 'string');
    if (location && allowedFields.includes('location')) query.location = { $regex: sanitizeAndValidate(location, 'string'), $options: 'i' }; // Case-insensitive search for location
    if (price && allowedFields.includes('price')) query.price = { $lte: sanitizeAndValidate(price, 'number') }; // Filter properties with price less than or equal to 'price'
    if (maxGuests && allowedFields.includes('maxGuests')) query.maxGuests = { $gte: sanitizeAndValidate(maxGuests, 'number') }; // Filter properties with maxGuests greater than or equal to 'maxGuests'
    if (averageRating && allowedFields.includes('averageRating')) query.averageRating = { $gte: sanitizeAndValidate(averageRating, 'number') }; // Filter properties with averageRating greater than or equal to 'averageRating'

    // Check if check-in and check-out dates are provided
    if (checkIn && checkOut && allowedFields.includes('checkIn') && allowedFields.includes('checkOut')) {
      const checkInDate = sanitizeAndValidate(checkIn, 'date');
      const checkOutDate = sanitizeAndValidate(checkOut, 'date');

      if (checkInDate && checkOutDate) {
        // Filter properties based on the availability and booked dates
        query.$or = [
          {
            'availability.startDate': { $gte: checkOutDate },
            'availability.endDate': { $lte: checkInDate },
          },
          {
            'bookedDates': {
              $not: {
                $elemMatch: {
                  checkIn: { $gte: checkInDate },
                  checkOut: { $lte: checkOutDate },
                },
              },
            },
          },
        ];
      }
    }

    // Query the database
    const properties = await Property.find(query).exec();

    // Send response with the found properties
    res.json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching properties.',
    });
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
