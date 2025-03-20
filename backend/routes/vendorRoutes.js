const express = require('express');
const router = express.Router();
const upload = require('../configs/multerConfig'); // Import the multer configuration file
const {
    createProperty
} = require('../controllers/vendorControllers');
const rateLimit = require("express-rate-limit");

// Define rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });

// Route for creating a property with images
router.post('/create-property', upload.array('images'), createProperty);



module.exports = router;
