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
router.get('/notifications', limiter, getNotifs);

// Get unread notification count (without authentication middleware)
router.get('/notifications/unread-count', limiter, getUnreadNotifCount);

// Post Vendor Request
router.post("/postVendorRequest", limiter, postVendorRequest);

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
router.post('/book-property', [limiter, bookValidationRules], bookProperty);

router.post("/properties/reviews/:id", limiter, postReview);


// Mark notifications as read (without authentication middleware)
router.put('/notifications/mark-as-read', limiter, putReadNotifs);

// http://localhost:4000/api/bookings/${bookingId}
// DELETE /api/bookings/:id
router.delete("/properties/bookings/:id", limiter, deleteBooking);

module.exports = router;