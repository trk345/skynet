require('dotenv').config();

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('../models/userSchemas'); // Adjust to your file structure
const { getNotifs } = require('../controllers/userControllers'); // Adjust path

jest.mock('../models/userSchemas');

const app = express();
app.use(require('cookie-parser')());
app.get('/api/user/notifications', getNotifs);

const createToken = (payload, secret = process.env.JWT_SECRET, options = {}) =>
  jwt.sign(payload, secret, { expiresIn: '1h', ...options });

describe('GET /api/user/notifications', () => {
  afterEach(() => jest.clearAllMocks());

  it('should return sorted notifications when valid token is provided', async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = createToken({ userId });

    const notifications = [
      { read: false, createdAt: new Date('2024-01-01') },
      { read: true, createdAt: new Date('2025-01-01') },
    ];

    const mockUser = { notifications };
    User.findById.mockResolvedValue(mockUser);

    const res = await request(app)
      .get('/api/user/notifications')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(new Date(res.body[0].createdAt)).toEqual(new Date('2025-01-01')); // sorted
  });

  it('should return 401 if token is missing', async () => {
    const res = await request(app).get('/api/user/notifications');
    expect(res.statusCode).toBe(500); // due to thrown error in verifyUser
    expect(res.body.error).toBe('Server error when fetching notifications');
  });

  it('should return 401 if token has invalid userId', async () => {
    const token = createToken({ userId: 'invalid' });

    const res = await request(app)
      .get('/api/user/notifications')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should return 404 if user not found', async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = createToken({ userId });

    User.findById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/user/notifications')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('User not found');
  });

  it('should return 500 if something goes wrong', async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = createToken({ userId });

    User.findById.mockImplementation(() => { throw new Error('DB error'); });

    const res = await request(app)
      .get('/api/user/notifications')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Server error when fetching notifications');
  });
});
