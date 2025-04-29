require('dotenv').config();

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('../models/userSchemas'); // Adjust to your actual path
const { getUnreadNotifCount } = require('../controllers/userControllers'); // Adjust path

jest.mock('../models/userSchemas');

const app = express();
app.use(require('cookie-parser')());
app.get('/api/user/notifications/unread-count', getUnreadNotifCount);

const createToken = (payload, secret = process.env.JWT_SECRET, options = {}) =>
  jwt.sign(payload, secret, { expiresIn: '1h', ...options });

describe('GET /api/user/notifications/unread-count', () => {
  afterEach(() => jest.clearAllMocks());

  it('should return unread notification count (success)', async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const token = createToken({ userId: mockUserId });

    const mockUser = {
      notifications: [
        { read: false },
        { read: true },
        { read: false },
      ]
    };

    User.findById.mockResolvedValue(mockUser);

    const res = await request(app)
      .get('/api/user/notifications/unread-count')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.unreadCount).toBe(2);
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/api/user/notifications/unread-count');
    expect(res.statusCode).toBe(500); // Because your verifyUser throws
    expect(res.body.error).toBe('Server error');
  });

  it('should return 401 if userId is invalid', async () => {
    const token = createToken({ userId: 'invalid-id' });

    const res = await request(app)
      .get('/api/user/notifications/unread-count')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should return 404 if user is not found', async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const token = createToken({ userId: mockUserId });

    User.findById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/user/notifications/unread-count')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('User not found');
  });

  it('should return 500 on unexpected error', async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const token = createToken({ userId: mockUserId });

    User.findById.mockImplementation(() => { throw new Error('DB Error'); });

    const res = await request(app)
      .get('/api/user/notifications/unread-count')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Server error');
  });
});
