const jwt = require('jsonwebtoken');
const { User } = require('../models/userSchemas');

// Import the actual signup function from your controller file
// Adjust the path to match your project structure
const { signup } = require('../controllers/unlogControllers');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../models/userSchemas');

describe('Signup Controller', () => {
  let req;
  let res;
  let mockSavedUser;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock request and response objects
    req = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234!'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };

    // Mock process.env
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    
    // Mock User model methods
    User.findOne = jest.fn().mockResolvedValue(null);
    
    // Create a mock saved user that will be returned from save()
    mockSavedUser = {
      _id: 'user-id-123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    };
    
    // Set up the User constructor mock
    User.mockImplementation(function(data) {
      return {
        ...data,
        _id: 'user-id-123',  // Explicitly set _id
        save: jest.fn().mockResolvedValue(mockSavedUser)
      };
    });
    
    // Mock JWT sign
    jwt.sign = jest.fn().mockReturnValue('mock-token');
  });

  it('should create a new user successfully', async () => {
    await signup(req, res);
    
    // Verify User.findOne was called correctly
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    
    // Verify new User was created with correct data
    expect(User).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!',
      role: 'user',
      lastLogin: expect.any(Date)
    });

    // Verify JWT payload - using exact match since we know what it should be
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        userId: 'user-id-123',  // This should match mockSavedUser._id
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      },
      'test-secret',
      { expiresIn: '1h' }
    );
    
    // Verify response
    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      'mock-token',
      {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        maxAge: 3600000
      }
    );
    
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Signup successful, please log in' });
  });

  it('should trim and lowercase email', async () => {
    req.body.email = '  Test@Example.com  ';
    
    await signup(req, res);
    
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  it('should return 400 if any required field is missing', async () => {
    // Test each missing field
    const testCases = [
      { username: undefined, email: 'test@example.com', password: 'Test1234!' },
      { username: 'testuser', email: undefined, password: 'Test1234!' },
      { username: 'testuser', email: 'test@example.com', password: undefined }
    ];
    
    for (const testCase of testCases) {
      req.body = testCase;
      await signup(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
      
      // Reset mock calls
      res.status.mockClear();
      res.json.mockClear();
    }
  });

  it('should validate password complexity', async () => {
    const invalidPasswords = [
      'short',          // Too short
      'nouppercase1!',  // No uppercase
      'NOLOWERCASE1!',  // No lowercase
      'NoNumbers!',     // No number
      'NoSpecial123'    // No special character
    ];
    
    for (const password of invalidPasswords) {
      req.body.password = password;
      await signup(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Password must be at least 8 characters long, include 1 uppercase, 1 lowercase, 1 number, and 1 special character' 
      });
      
      // Reset mock calls
      res.status.mockClear();
      res.json.mockClear();
    }
  });

  it('should prevent duplicate registrations', async () => {
    // Mock existing user
    User.findOne.mockResolvedValueOnce({ 
      _id: 'existing-id',
      email: 'test@example.com' 
    });
    
    await signup(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
  });

  it('should handle database errors', async () => {
    // Spy on console.error to prevent actual logging during test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock a database error during save
    const mockUserWithError = {
      save: jest.fn().mockRejectedValue(new Error('Database error'))
    };
    
    // Override the User constructor for this test only
    User.mockImplementationOnce(() => mockUserWithError);
    
    await signup(req, res);
    
    // Verify error handling
    expect(console.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    
    // Restore console.error
    console.error.mockRestore();
  });
});