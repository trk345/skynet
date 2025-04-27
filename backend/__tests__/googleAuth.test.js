// __tests__/auth.test.js
const request = require('supertest');
const app = require('../server');  // Import the app from server.js

describe('Google Authentication', () => {
  it('should respond with a redirect to Google OAuth', async () => {
    const res = await request(app).get('/auth/google');
    expect(res.status).toBe(302);  // Should redirect to Google login
    expect(res.header.location).toContain('accounts.google.com');  // Check that it redirects to Google OAuth
  });
});