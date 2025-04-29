const jwt = require('jsonwebtoken');
const { User } = require('../models/userSchemas');
const { authMe } = require('../controllers/unlogControllers');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../models/userSchemas');

describe('AuthMe Controller', () => {
  let req;
  let res;
  let mockUser;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock user data (this would be set by the middleware)
    req = {
      user: {
        userId: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      }
    };
    
    // Setup mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Setup mock user from database
    mockUser = {
      _id: 'user-id-123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Mock User.findById().select() chain
    User.findById = jest.fn().mockReturnThis();
    User.select = jest.fn().mockResolvedValue(mockUser);
  });

  it('should return user data when valid token is provided', async () => {
    // Mock the select method directly
    User.findById.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(mockUser)
    }));
    
    await authMe(req, res);
    
    // Verify that User.findById was called with the correct ID
    expect(User.findById).toHaveBeenCalledWith('user-id-123');
    
    // Verify response
    expect(res.json).toHaveBeenCalledWith({ user: mockUser });
  });

  it('should return 404 if user is not found', async () => {
    // Mock a scenario where user is not found
    User.findById.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(null)
    }));
    
    await authMe(req, res);
    
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('should handle database errors', async () => {
    // Spy on console.error to prevent actual logging during test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock a database error
    User.findById.mockImplementation(() => ({
      select: jest.fn().mockRejectedValue(new Error('Database error'))
    }));
    
    await authMe(req, res);
    
    // Verify error handling
    expect(console.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    
    // Restore console.error
    console.error.mockRestore();
  });

  // Optional test for the middleware
  it('should handle missing userId in token payload', async () => {
    // Set req.user without a userId
    req.user = {
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
      // userId is missing
    };
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    await authMe(req, res);
    
    // This should cause an error since findById would be called with undefined
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    
    console.error.mockRestore();
  });
});

// Bonus: Test for authenticateUser middleware
describe('AuthenticateUser Middleware', () => {
  const authenticateUser = require('../middleware/authenticateUser');
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock objects
    req = {
      cookies: {},
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Mock process.env
    process.env.JWT_SECRET = 'test-secret';
    
    // Mock jwt.verify
    jwt.verify = jest.fn().mockImplementation((token, secret, callback) => {
      if (token === 'valid-token') {
        callback(null, {
          userId: 'user-id-123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user'
        });
      } else if (token === 'expired-token') {
        callback({ name: 'TokenExpiredError' }, null);
      } else {
        callback({ name: 'JsonWebTokenError' }, null);
      }
    });
  });
  
  it('should extract token from cookies', () => {
    req.cookies.token = 'valid-token';
    
    authenticateUser(req, res, next);
    
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', expect.any(Function));
    expect(req.user).toEqual({
      userId: 'user-id-123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    });
    expect(next).toHaveBeenCalled();
  });
  
  it('should extract token from Authorization header', () => {
    req.headers.authorization = 'Bearer valid-token';
    
    authenticateUser(req, res, next);
    
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', expect.any(Function));
    expect(req.user).toEqual({
      userId: 'user-id-123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    });
    expect(next).toHaveBeenCalled();
  });
  
  it('should return 401 if no token is provided', () => {
    authenticateUser(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized - No token provided' });
    expect(next).not.toHaveBeenCalled();
  });
  
  it('should return 401 if token is expired', () => {
    req.cookies.token = 'expired-token';
    
    authenticateUser(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Session expired. Please log in again.' });
    expect(next).not.toHaveBeenCalled();
  });
  
  it('should return 401 if token is invalid', () => {
    req.cookies.token = 'invalid-token';
    
    authenticateUser(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized - Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});