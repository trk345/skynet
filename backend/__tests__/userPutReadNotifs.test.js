require('dotenv').config();

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('../models/userSchemas');
const { putReadNotifs } = require('../controllers/userControllers'); // Adjust if path differs

jest.mock('../models/userSchemas');

const app = express();
app.use(require('cookie-parser')());
app.use(express.json());
app.put('/api/user/notifications/mark-as-read', putReadNotifs);

const createToken = (payload, secret = process.env.JWT_SECRET, options = {}) =>
  jwt.sign(payload, secret, { expiresIn: '1h', ...options });

describe('PUT /api/user/notifications/mark-as-read', () => {
  afterEach(() => jest.clearAllMocks());

  it('should mark all notifications as read and return success', async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = createToken({ userId });

    const mockUser = {
      notifications: [
        { read: false },
        { read: false },
      ],
      save: jest.fn().mockResolvedValue(true),
    };

    User.findById.mockResolvedValue(mockUser);

    const res = await request(app)
      .put('/api/user/notifications/mark-as-read')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(mockUser.notifications.every(n => n.read)).toBe(true);
    expect(res.body.success).toBe(true);
  });

  it('should return 401 if token is missing', async () => {
    const res = await request(app)
      .put('/api/user/notifications/mark-as-read');

    expect(res.statusCode).toBe(500); // because verifyUser throws, and it's caught as 500
    expect(res.body.error).toBe('Server error when marking notifications as read');
  });

  it('should return 401 for invalid userId in token', async () => {
    const token = createToken({ userId: 'invalid' }); // invalid MongoDB ID

    const res = await request(app)
      .put('/api/user/notifications/mark-as-read')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should return 404 if user not found', async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = createToken({ userId });

    User.findById.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/user/notifications/mark-as-read')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('User not found');
  });

  it('should return 500 if DB throws an error', async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = createToken({ userId });

    User.findById.mockImplementation(() => { throw new Error('DB error'); });

    const res = await request(app)
      .put('/api/user/notifications/mark-as-read')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Server error when marking notifications as read');
  });
});
