const express = require('express');
const router = express.Router();
const upload = require('../configs/multerConfig'); // Import the multer configuration file
const {
    createProperty,
    getProperties,
    getProperty,
    updateProperty,
    deleteProperty,
} = require('../controllers/vendorControllers');
const rateLimit = require("express-rate-limit");

// Define rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });

// Fetch all vendor properties
router.get("/getProperties", limiter, getProperties);

// Fetch a single property
router.get("/getProperty/:id", limiter, getProperty);

// Route for creating a property with images
// Handles multiple image uploads and passes them to createProperty controller
// Field name 'images' must match the form field name in the frontend
router.post('/create-property', limiter, upload.array('images'), createProperty);

// Update a property
router.put('/update-property/:id', limiter, upload.array('newImages'), updateProperty);

// Delete a property
router.delete('/deleteProperty/:id', limiter, deleteProperty);



module.exports = router;
