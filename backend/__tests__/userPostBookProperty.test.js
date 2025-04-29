const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { User } = require('../models/userSchemas');
const { Property } = require('../models/propertySchemas');
const { Booking } = require('../models/bookingSchemas');
const sendNotification = require('../utils/sendNotification');
const { validationResult } = require('express-validator');

// Mocking the modules
jest.mock('jsonwebtoken');
jest.mock('../models/userSchemas');
jest.mock('../models/propertySchemas');
jest.mock('../models/bookingSchemas');
jest.mock('../utils/sendNotification');
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

// Mocking mongoose Types.ObjectId
jest.mock('mongoose', () => {
  const original = jest.requireActual('mongoose');
  return {
    ...original,
    Types: {
      ObjectId: {
        isValid: jest.fn()
      }
    }
  };
});

// Import the controller after mocking dependencies
// This is important to ensure mocks are set up before module import
const { bookProperty } = require('../controllers/userControllers');

describe('Book Property Controller', () => {
  let req, res;
  
  // Test IDs
  const userId = 'user-id-123';
  const ownerId = 'owner-id-456';
  const propertyId = 'property-id-789';
  const bookingId = 'booking-id-012';
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock mongoose ObjectId.isValid to return true by default
    mongoose.Types.ObjectId.isValid.mockImplementation(() => true);
    
    // Mock JWT verify to work normally (not throw)
    jwt.verify.mockImplementation(() => ({ userId }));
    
    // Mock validationResult to return no errors by default
    validationResult.mockImplementation(() => ({
      isEmpty: () => true,
      array: () => []
    }));
    
    // Mock request object
    req = {
      cookies: { token: 'valid-token' },
      body: {
        propertyId,
        checkIn: new Date(Date.now() + 86400000).toISOString(), // tomorrow
        checkOut: new Date(Date.now() + 172800000).toISOString(), // day after tomorrow
        guests: 2,
        totalAmount: 200
      }
    };
    
    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Setup mock property
    const mockProperty = {
      _id: propertyId,
      userID: { toString: () => ownerId }, // Owner different from user
      maxGuests: 4,
      availability: {
        startDate: new Date(Date.now() - 86400000), // yesterday
        endDate: new Date(Date.now() + 2592000000) // 30 days from now
      },
      bookedDates: [],
      save: jest.fn().mockResolvedValue(true)
    };
    
    // Setup mock user
    const mockUser = {
      _id: userId,
      username: 'testuser',
      bookings: [],
      save: jest.fn().mockResolvedValue(true)
    };
    
    // Setup mock booking
    const mockBookingSave = jest.fn().mockResolvedValue({ _id: bookingId });
    Booking.mockImplementation(() => ({
      _id: bookingId,
      save: mockBookingSave
    }));
    
    // Mock database methods
    Property.findById = jest.fn().mockResolvedValue(mockProperty);
    User.findById = jest.fn().mockResolvedValue(mockUser);
    
    // Mock sendNotification
    sendNotification.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Success cases', () => {
    it('should successfully book a property with valid input', async () => {
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.message).toBe('Booking successful!');
      
      // Verify booking was created
      expect(Booking).toHaveBeenCalled();
      
      // Verify property was updated
      expect(Property.findById).toHaveBeenCalledWith(propertyId);
      
      // Verify user was updated
      expect(User.findById).toHaveBeenCalledWith(userId);
      
      // Verify notification was sent
      expect(sendNotification).toHaveBeenCalled();
    });
  });

  describe('Validation and Authorization', () => {
    it('should reject if user is not authenticated', async () => {
      // Mock cookies to be empty
      req.cookies = {};
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Unauthorized'
      }));
    });
    
    it('should reject if token verification fails', async () => {
      // Simulate JWT verification failure
      jwt.verify.mockImplementation(() => {
        throw new Error('Token invalid');
      });
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Unauthorized'
      }));
    });
    
    it('should reject if input validation fails', async () => {
      // Simulate validation errors
      validationResult.mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid input' }]
      }));
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([{ msg: 'Invalid input' }])
      }));
    });
    
    it('should reject if propertyId is invalid', async () => {
      // Mock ObjectId.isValid to return false specifically for propertyId
      mongoose.Types.ObjectId.isValid.mockImplementation((id) => {
        if (id === propertyId) return false;
        return true;
      });
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid Property ID'
      }));
    });
    
    it('should reject if required fields are missing', async () => {
      req.body.checkIn = null;
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Please provide all the required details.'
      }));
    });
  });

  describe('Booking validation', () => {
    it('should reject if check-in date is in the past', async () => {
      req.body.checkIn = new Date(Date.now() - 86400000).toISOString(); // yesterday
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Check-in date cannot be in the past.'
      }));
    });
    
    it('should reject if check-out date is before check-in date', async () => {
      req.body.checkIn = new Date(Date.now() + 172800000).toISOString(); // day after tomorrow
      req.body.checkOut = new Date(Date.now() + 86400000).toISOString(); // tomorrow
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Check-out date must be after check-in date.'
      }));
    });
    
    it('should reject if property is not found', async () => {
      Property.findById.mockResolvedValue(null);
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Property not found.'
      }));
    });
    
    it('should reject if user tries to book their own property', async () => {
      // Set property owner to be the same as the user
      Property.findById.mockResolvedValue({
        _id: propertyId,
        userID: { toString: () => userId }, // Same user ID
        maxGuests: 4,
        availability: {
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 2592000000)
        },
        bookedDates: [],
        save: jest.fn().mockResolvedValue(true)
      });
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'You cannot book your own property.'
      }));
    });
    
    it('should reject if guest count exceeds property limit', async () => {
      req.body.guests = 10; // More than the max of 4
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('maximum of 4 guests')
      }));
    });
    
    it('should reject if booking is outside availability range', async () => {
      // Mock property with availability in the future
      Property.findById.mockResolvedValue({
        _id: propertyId,
        userID: { toString: () => ownerId },
        maxGuests: 4,
        availability: {
          startDate: new Date(Date.now() + 604800000), // 7 days from now
          endDate: new Date(Date.now() + 1209600000)   // 14 days from now
        },
        bookedDates: [],
        save: jest.fn().mockResolvedValue(true)
      });
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Booking is outside the property\'s availability range.'
      }));
    });
    
    it('should reject if dates overlap with existing booking', async () => {
      // Property with existing booking
      Property.findById.mockResolvedValue({
        _id: propertyId,
        userID: { toString: () => ownerId },
        maxGuests: 4,
        availability: {
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 2592000000)
        },
        bookedDates: [{
          checkIn: new Date(Date.now() + 86400000), // tomorrow
          checkOut: new Date(Date.now() + 259200000) // 3 days from now
        }],
        save: jest.fn().mockResolvedValue(true)
      });
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'This property is already booked for the selected dates.(Overlap)'
      }));
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock Booking.save to throw an error
      Booking.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      }));
      
      // Execute the controller
      await bookProperty(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'An error occurred while processing the booking.'
      }));
    });
  });
});