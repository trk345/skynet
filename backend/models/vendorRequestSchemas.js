const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');

const requestSchema = new Schema({
  requesterID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // References the User model
    required: true,
    index: true  // Add index for faster lookups
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name too long'],
    match: [/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes']
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name too long'],
   match: [/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes']
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true, // Ensure no duplicate emails
    validate: {
      validator: validator.isEmail,  // Use validator.js
      message: 'Invalid email format'
    }
  },
  mobile: {
    type: String,
    required: true,
    // unique: true,
    trim: true,
    validate: {
      validator: function (value) {
        return validator.isMobilePhone(value, 'any', { strictMode: true });
      },
      message: 'Invalid phone number format'
    }
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Message cannot be empty'],
    maxlength: [100, 'Message too long']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],  // Track request status
    default: 'pending',
    index: true  // Add index for status-based queries
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true  // Add index for time-based queries
  }
});

const VendorRequest = mongoose.model('VendorRequest', requestSchema);
module.exports = { VendorRequest };
