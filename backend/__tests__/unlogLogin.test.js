const request = require('supertest');
const app = require('../server');
const { User } = require('../models/userSchemas');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

// Clear and reset all mocks
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

// Mock the createJWT function
jest.mock('../utils/jwt', () => ({
  createJWT: jest.fn().mockReturnValue('mock-jwt-token')
}), { virtual: true });

// Mock dependencies with a different approach
jest.mock('../models/userSchemas');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('validator');

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    // Reset implementation for each test
    User.findOne = jest.fn();
    User.findByIdAndUpdate = jest.fn();
    validator.isEmail = jest.fn();
    bcrypt.compare = jest.fn();
  });

  it('should login successfully with valid credentials', async () => {
    // Mock user data
    const mockUser = {
      _id: '60d5f5b21b8c2b3f0c8b8d9a',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: 'user'
    };

    // Setup mocks
    validator.isEmail.mockReturnValue(true);
    
    // Set up User.findOne chain to return the user
    const mockSelect = jest.fn().mockReturnValue(mockUser);
    User.findOne.mockReturnValue({ select: mockSelect });
    
    // Mock bcrypt.compare to return true
    bcrypt.compare.mockResolvedValue(true);
    
    // Mock User.findByIdAndUpdate to resolve
    User.findByIdAndUpdate.mockResolvedValue(mockUser);

    // Send request
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful');
  });

  it('should return 400 if email format is invalid', async () => {
    // Setup validator mock to return false for invalid email
    validator.isEmail.mockReturnValue(false);

    // Send request with invalid email
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid-email', password: 'password123' });

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid email format');
    
    // Verify User.findOne was not called
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not found', async () => {
    // Setup validator mock to return true for valid email
    validator.isEmail.mockReturnValue(true);
    
    // Set up User.findOne chain to return null
    const mockSelect = jest.fn().mockReturnValue(null);
    User.findOne.mockReturnValue({ select: mockSelect });

    // Send request
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password123' });

    // Assertions
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
    
    // Verify bcrypt.compare was not called
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('should return 401 if password is incorrect', async () => {
    // Mock data
    const mockUser = {
      _id: '60d5f5b21b8c2b3f0c8b8d9a',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: 'user'
    };

    // Setup mocks
    validator.isEmail.mockReturnValue(true);
    
    // Set up User.findOne chain to return the user
    const mockSelect = jest.fn().mockReturnValue(mockUser);
    User.findOne.mockReturnValue({ select: mockSelect });
    
    // Mock bcrypt.compare to return false (password incorrect)
    bcrypt.compare.mockResolvedValue(false);

    // Send request
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    // Assertions
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
    
    // Verify findByIdAndUpdate was not called (lastLogin not updated)
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('should return 500 if there is a server error', async () => {
    // Setup validator mock to return true for valid email
    validator.isEmail.mockReturnValue(true);
    
    // Make User.findOne throw an error
    User.findOne.mockImplementation(() => {
      throw new Error('Database error');
    });

    // Suppress console.error for this test
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Send request
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    // Assertions
    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Server error during user login');
  });

  it('should handle email trimming correctly', async () => {
    // Mock data
    const mockUser = {
      _id: '60d5f5b21b8c2b3f0c8b8d9a',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: 'user'
    };

    // Setup mocks
    validator.isEmail.mockReturnValue(true);
    
    // Set up User.findOne chain to return the user
    const mockSelect = jest.fn().mockReturnValue(mockUser);
    User.findOne.mockReturnValue({ select: mockSelect });
    
    // Mock bcrypt.compare to return true
    bcrypt.compare.mockResolvedValue(true);
    
    // Mock User.findByIdAndUpdate to resolve
    User.findByIdAndUpdate.mockResolvedValue(mockUser);

    // Send request with email containing whitespace
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: '  test@example.com  ', password: 'password123' });

    // Assertions
    expect(response.status).toBe(200);
    
    // Verify User.findOne was called with the trimmed email
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
});