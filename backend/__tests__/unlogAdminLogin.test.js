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

// Mock dependencies
jest.mock('../models/userSchemas');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('validator');

describe('POST /api/auth/admin/login', () => {
  beforeEach(() => {
    // Reset implementation for each test
    User.findOne = jest.fn();
    User.findByIdAndUpdate = jest.fn();
    validator.isEmail = jest.fn();
    bcrypt.compare = jest.fn();
  });

  it('should login admin successfully with valid credentials', async () => {
    // Mock admin data
    const mockAdmin = {
      _id: '60d5f5b21b8c2b3f0c8b8d9b',
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'hashedpassword456',
      role: 'admin'
    };

    // Setup mocks
    validator.isEmail.mockReturnValue(true);
    
    const mockSelect = jest.fn().mockReturnValue(mockAdmin);
    User.findOne.mockReturnValue({ select: mockSelect });
    
    bcrypt.compare.mockResolvedValue(true);

    // Send request
    const response = await request(app)
      .post('/api/auth/admin/login')
      .send({ email: 'admin@example.com', password: 'password456' });

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Admin login successful');
  });

  it('should return 400 if email format is invalid', async () => {
    validator.isEmail.mockReturnValue(false);

    const response = await request(app)
      .post('/api/auth/admin/login')
      .send({ email: 'invalid-email', password: 'password456' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid email format');
    
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('should return 401 if admin is not found', async () => {
    validator.isEmail.mockReturnValue(true);

    const mockSelect = jest.fn().mockReturnValue(null);
    User.findOne.mockReturnValue({ select: mockSelect });

    const response = await request(app)
      .post('/api/auth/admin/login')
      .send({ email: 'nonexistentadmin@example.com', password: 'password456' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
    
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('should return 401 if password is incorrect', async () => {
    const mockAdmin = {
      _id: '60d5f5b21b8c2b3f0c8b8d9b',
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'hashedpassword456',
      role: 'admin'
    };

    validator.isEmail.mockReturnValue(true);

    const mockSelect = jest.fn().mockReturnValue(mockAdmin);
    User.findOne.mockReturnValue({ select: mockSelect });

    bcrypt.compare.mockResolvedValue(false);

    const response = await request(app)
      .post('/api/auth/admin/login')
      .send({ email: 'admin@example.com', password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  it('should return 500 if there is a server error', async () => {
    validator.isEmail.mockReturnValue(true);

    User.findOne.mockImplementation(() => {
      throw new Error('Database error');
    });

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app)
      .post('/api/auth/admin/login')
      .send({ email: 'admin@example.com', password: 'password456' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Server error');
  });

  it('should handle email trimming correctly', async () => {
    const mockAdmin = {
      _id: '60d5f5b21b8c2b3f0c8b8d9b',
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'hashedpassword456',
      role: 'admin'
    };

    validator.isEmail.mockReturnValue(true);

    const mockSelect = jest.fn().mockReturnValue(mockAdmin);
    User.findOne.mockReturnValue({ select: mockSelect });

    bcrypt.compare.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/auth/admin/login')
      .send({ email: '  admin@example.com  ', password: 'password456' });

    expect(response.status).toBe(200);
    expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@example.com', role: 'admin' });
  });
});