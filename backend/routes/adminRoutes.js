const express = require('express');
const {
    getUsers,
    // postVendorRequest,
    getVendorRequests,
    updateVendorRequest,
} = require('../controllers/adminControllers');
const router = express.Router();
const rateLimit = require("express-rate-limit");

// Define rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });


router.get('/getUsers', getUsers);
router.get("/getVendorRequests", getVendorRequests);

// router.post("/postVendorRequest", limiter, postVendorRequest);

router.put("/updateVendorRequest", updateVendorRequest);

module.exports = router;