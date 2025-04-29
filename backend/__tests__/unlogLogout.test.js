const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

// Import the logout controller
const { logout } = require('../controllers/unlogControllers');

// Create an isolated Express app instance
const app = express();
app.use(cookieParser());
app.post('/api/auth/logout', logout);

describe('POST /api/auth/logout', () => {
  it('should clear the token cookie and return success message', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['token=sampletoken']); // Simulate existing token cookie

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Logout successful' });

    const clearCookieHeader = res.headers['set-cookie']?.[0];
    expect(clearCookieHeader).toMatch(/token=;/); // Ensure token is cleared
    expect(clearCookieHeader).toMatch(/HttpOnly/); // Should be HttpOnly
  });
});
