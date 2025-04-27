require('dotenv').config();
const request = require('supertest');
const app = require('../server'); // Ensure this imports your Express app
const { VendorRequest } = require('../models/vendorRequestSchemas'); // Adjust the path based on where your VendorRequest model is located
const jwt = require('jsonwebtoken');

jest.mock('../models/vendorRequestSchemas'); // Mock the VendorRequest model
jest.mock('../models/userSchemas'); // Mock the User model

describe('GET /api/admin/getVendorRequests', () => {
  let mockToken;

  beforeAll(() => {
    // Create a mock JWT token (this will be used to simulate authentication)
    mockToken = jwt.sign({ userId: 'testUserId', username: 'adminUser', email: 'admin@example.com', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    // Reset the VendorRequest.find mock before each test to ensure a clean slate
    VendorRequest.find.mockReset();
  });

  beforeAll(() => {
    console.error = jest.fn(); // Mock console.error
  });

  it('should return all vendor requests with populated requester details', async () => {
    // Mocking the VendorRequest model's find and populate method
    const mockVendorRequestFind = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue([
        { 
          requesterID: { username: 'user1', email: 'user1@example.com', role: 'user' }, 
          requestDetails: 'Request details 1' 
        },
        { 
          requesterID: { username: 'user2', email: 'user2@example.com', role: 'vendor' }, 
          requestDetails: 'Request details 2' 
        },
      ]), 
    });

    VendorRequest.find = mockVendorRequestFind;

    const response = await request(app)
      .get('/api/admin/getVendorRequests')
      .set('Cookie', `token=${mockToken}`); // Set the mock token in the cookie

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].requesterID.username).toBe('user1');
    expect(response.body.data[1].requesterID.username).toBe('user2');
  });

  it('should handle the case where there are no vendor requests', async () => {
    // Mocking the VendorRequest model with no requests
    const mockVendorRequestFind = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue([]), // No requests
    });

    VendorRequest.find = mockVendorRequestFind;

    const response = await request(app)
      .get('/api/admin/getVendorRequests')
      .set('Cookie', `token=${mockToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(0); // No requests found
  });

  it('should handle errors gracefully and return a 500 status', async () => {
    // Mocking the VendorRequest model's find method to simulate an error
    const mockVendorRequestFind = jest.fn().mockImplementation(() => {
      throw new Error('Database error');
    });

    VendorRequest.find = mockVendorRequestFind;

    const response = await request(app)
      .get('/api/admin/getVendorRequests')
      .set('Cookie', `token=${mockToken}`);

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Internal Server Error');
  });
});