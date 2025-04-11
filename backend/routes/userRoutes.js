const express = require('express');
const {
    // getProperties,
    getNotifs,
    putReadNotifs,
    getUnreadNotifCount,
    postVendorRequest,
    bookProperty,
    postReview,
} = require('../controllers/userControllers');
const router = express.Router();
const rateLimit = require("express-rate-limit");

// Define rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });

// // Get all properties
// router.get("/getProperties", limiter, getProperties)


// Get all notifications (without authentication middleware)
router.get('/notifications', limiter, getNotifs);

// Get unread notification count (without authentication middleware)
router.get('/notifications/unread-count', limiter, getUnreadNotifCount);

// Post Vendor Request
router.post("/postVendorRequest", limiter, postVendorRequest);

// Book a property (without authentication middleware)
router.post('/book-property', limiter, bookProperty);

// Mark notifications as read (without authentication middleware)
router.put('/notifications/mark-as-read', limiter, putReadNotifs);

router.post("/properties/reviews/:id", limiter, postReview);

module.exports = router;