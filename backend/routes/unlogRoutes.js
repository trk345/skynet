const express = require('express');
const rateLimit = require('express-rate-limit');
const authenticateUser = require('../middleware/authenticateUser');
const {
    login,
    signup,
    adminLogin,
    authMe,
    logout,
    // resetPassword,
    getProperties,
    getProperty,
} = require('../controllers/unlogControllers');
const router = express.Router();

router.get('/me', authenticateUser, authMe);

// Get all properties
router.get("/getProperties", getProperties)
// Get a single property
router.get("/getProperty/:id", getProperty)

// Logout Route (Clears JWT Cookie)
router.post('/logout', logout);
// Apply rate limit only to login routes
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/signup', signup);


module.exports = router;