const { User } = require('../models/userSchemas');
const { VendorRequest } = require('../models/vendorRequestSchemas');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT and extract userId
const verifyUser = (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.userId;
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

// Secure route: Post Vendor Requests
const postVendorRequest = async (req, res) => {
    const session = await mongoose.startSession(); // Start transaction session
    session.startTransaction();
    
    try {
        const userId = verifyUser(req, res);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const requesterID = userId;
        const { firstName, lastName, email, mobile, message } = req.body;
  
        if (!firstName || !lastName || !email || !mobile || !message) {
            return res.status(400).json({ error: "Message is required" });
        }
  
        // Update user's pending status
        await User.findByIdAndUpdate(requesterID, { pendingStatus: "pending" }, { session });
  
        // Save vendor request
        const newRequest = new VendorRequest({ 
          requesterID, 
          firstName, 
          lastName, 
          email, 
          mobile, 
          message 
        });
        await newRequest.save({ session }); // Ensure transaction consistency
  
        await session.commitTransaction();
        res.status(201).json({ message: "Message saved successfully!", data: newRequest });
  
    } catch (error) {
        await session.abortTransaction(); // Rollback on error
        console.error("Error saving request", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        session.endSession(); // Clean up session
    }
  };

// Get unread notification count
const getUnreadNotifCount = async (req, res) => {
    try {
        const userId = verifyUser(req, res);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const unreadCount = user.notifications.filter(n => !n.read).length;
        res.json({ unreadCount });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all notifications
const getNotifs = async (req, res) => {
    try {
        const userId = verifyUser(req, res);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user.notifications);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Mark notifications as read
const putReadNotifs = async (req, res) => {
    try {
        const userId = verifyUser(req, res);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.notifications.forEach(n => (n.read = true));
        await user.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports = {
    putReadNotifs,
    getNotifs,
    getUnreadNotifCount, 
    postVendorRequest,
};