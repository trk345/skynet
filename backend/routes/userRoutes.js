const express = require('express');
const {
    // getProperties,
    getNotifs,
    putReadNotifs,
    getUnreadNotifCount,
    postVendorRequest,
    bookProperty,
    postReview,
    deleteBooking,
    getBookings,
} = require('../controllers/userControllers');
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { body } = require('express-validator');

// Define rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });


// Get all notifications (without authentication middleware)
router.get('/notifications', getNotifs);

// Get unread notification count (without authentication middleware)
router.get('/notifications/unread-count', getUnreadNotifCount);

// Post Vendor Request
router.post("/postVendorRequest", postVendorRequest);

// Get a user's bookings
router.get('/getBookings', getBookings);

// Middleware to sanitize req.body in booking
const bookValidationRules = [
  body('propertyId')
    .isMongoId().withMessage('Invalid property ID'),

  body('checkIn')
    .isISO8601().withMessage('Invalid check-in date'),

  body('checkOut')
    .isISO8601().withMessage('Invalid check-out date'),

  body('guests')
    .isInt({ min: 1 }).withMessage('Guests must be at least 1'),

  body('totalAmount')
    .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
];

// Book a property (without authentication middleware)
router.post('/book-property', bookValidationRules, bookProperty);

router.post("/properties/reviews/:id", postReview);


// Mark notifications as read (without authentication middleware)
router.put('/notifications/mark-as-read', putReadNotifs);

// DELETE /api/bookings/:id
router.delete("/properties/bookings/:id", deleteBooking);

module.exports = router;