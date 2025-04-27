require('dotenv').config();
const request = require('supertest');
const app = require('../server'); // Ensure this imports your Express app
const { User } = require('../models/userSchemas');
const jwt = require('jsonwebtoken');

jest.mock('../models/userSchemas'); // Mock the User model

describe('GET /api/admin/getUsers', () => {
    let mockToken;
  
    beforeAll(() => {
      // Create a mock JWT token
      mockToken = jwt.sign({ userId: 'testUserId', username: 'adminUser', email: 'admin@example.com', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });
  
    it('should return all users with default pagination and no role filter', async () => {
      // Mocking the User model's find method with chained methods
      const mockUserFind = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(), // Mock select method to return `this`
        sort: jest.fn().mockReturnThis(),   // Mock sort method to return `this`
        skip: jest.fn().mockReturnThis(),   // Mock skip method to return `this`
        limit: jest.fn().mockReturnThis(),  // Mock limit method to return `this`
        lean: jest.fn().mockResolvedValue([  // Mock lean to resolve with user data
          { username: 'user1', email: 'user1@example.com', role: 'user', lastLogin: new Date('2025-04-25T00:00:00Z') },
          { username: 'user2', email: 'user2@example.com', role: 'admin', lastLogin: new Date('2025-04-24T00:00:00Z') },
        ]),
      });
  
      User.find = mockUserFind; // Override the User.find method with the mock
  
      const response = await request(app)
        .get('/api/admin/getUsers')
        .set('Cookie', `token=${mockToken}`); // Set the mock token in the cookie
  
  
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].username).toBe('user1');
      expect(response.body.data[1].username).toBe('user2');
    });
  
    it('should return users filtered by role', async () => {
      // Mocking the User model's find method with role filter
      const mockUserFind = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { username: 'user2', email: 'user2@example.com', role: 'admin', lastLogin: new Date('2025-04-24T00:00:00Z') },
        ]),
      });
  
      User.find = mockUserFind;
  
      const response = await request(app)
        .get('/api/admin/getUsers')
        .set('Cookie', `token=${mockToken}`)
        .query({ role: 'admin' }); // Applying role filter

  
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].role).toBe('admin');
      expect(response.body.data[0].username).toBe('user2');
    });
  
    it('should handle invalid role filter gracefully', async () => {
      // Mocking the User model's find method with no users matching the invalid role
      const mockUserFind = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]), // No users
      });
  
      User.find = mockUserFind;
  
      const response = await request(app)
        .get('/api/admin/getUsers')
        .set('Cookie', `token=${mockToken}`)
        .query({ role: 'invalidRole' }); // Applying invalid role filter
  
      expect(response.status).toBe(200); // It should still return a 200 status
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0); // No users found
    });
  });