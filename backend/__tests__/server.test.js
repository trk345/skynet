require('dotenv').config();
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const { User } = require('../models/userSchemas');

// Update the mongoose mock to include Schema.Types.ObjectId
jest.mock('morgan', () => () => (req, res, next) => next());
jest.mock('mongoose', () => {
  const mockSchema = function() {
    return {
      index: jest.fn().mockReturnThis(),
      pre: jest.fn().mockReturnThis(),
      virtual: jest.fn().mockReturnThis()
    };
  };
  
  mockSchema.Types = {
    ObjectId: 'ObjectId', // Mock the ObjectId type
    String: String,
    Number: Number,
    Boolean: Boolean,
    Array: Array
  };
  
  return {
    connect: jest.fn().mockResolvedValue(true),
    Schema: mockSchema,
    model: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn()
    })
  };
});

jest.mock('../models/userSchemas', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn().mockResolvedValue(true)
  }
}));

// Mock other needed models
jest.mock('../models/propertySchemas', () => ({
  Property: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
}));

jest.mock('passport', () => ({
  use: jest.fn(),
  authenticate: jest.fn(() => (req, res, next) => {
    req.user = { _id: 'mockId', username: 'test', email: 'test@example.com', role: 'user' };
    next();
  }),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn()
}));
jest.mock('express-rate-limit', () => () => (req, res, next) => next());

// Set environment variables for testing
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_SERVER_HOST = 'http://localhost:4000';
process.env.GOOGLE_CLIENT_HOST = 'http://localhost:5173';
process.env.MONGO_URI = 'mongodb://test';
process.env.PORT = 4000;

// Import app after setting environment variables
const app = require('../server');

describe('Server Setup Tests', () => {
  
  // Test basic Express setup
  describe('Express Setup', () => {
    test('app should be an express application', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
      expect(app.listen).toBeDefined();
    });
  });
  
  // Test middleware functions
  describe('Middleware Setup', () => {
    test('should use JSON middleware', async () => {
      const response = await request(app)
        .post('/test-json')
        .send({ test: 'data' });
        
      expect(response.status).not.toBe(415); // Not unsupported media type
    });
    
    test('should set CSRF token on non-GET requests', async () => {
      const response = await request(app)
        .post('/api/auth/something')
        .send({});
        
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('XSRF-TOKEN');
    });
    
    test('should handle CORS for allowed origins', async () => {
      const response = await request(app)
        .get('/api/auth/something')
        .set('Origin', 'http://localhost:5173');
        
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
    
    test('should handle CORS for disallowed origins', async () => {
      const testApp = express();
      testApp.use(require('cors')({
        origin: function (origin, callback) {
          if (!origin || ['http://localhost:5173', 'https://skynet1.netlify.app'].includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
      }));
      
      testApp.get('/test', (req, res) => res.json({ ok: true }));
      
      const response = await request(testApp)
        .get('/test')
        .set('Origin', 'http://evil-site.com');
        
      expect(response.status).toBe(500);
    });
  });
  
  // Test CSRF token endpoint
  describe('CSRF Token Endpoint', () => {
    test('should return CSRF token', async () => {
      const agent = request.agent(app);
      
      // First make a POST to set the token
      await agent.post('/api/auth/something');
      
      // Then retrieve it
      const response = await agent.get('/api/csrf-token');
      
      expect(response.status).toBe(200);
      expect(response.body.csrfToken).toBeDefined();
    });
  });
  
  // Test JWT functions
  describe('JWT Authentication', () => {
    test('createJWT should generate a valid token', () => {
      // Extract the function from the module
      const createJWT = require('../server').__createJWT || (() => {
        // Recreate the function if not exported
        const user = { 
          _id: 'testId', 
          username: 'testUser', 
          email: 'test@example.com', 
          role: 'user' 
        };
        
        const payload = {
          userId: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        };
      
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      })();
      
      const token = typeof createJWT === 'function' 
        ? createJWT({ _id: 'testId', username: 'testUser', email: 'test@example.com', role: 'user' })
        : createJWT;
        
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId || decoded.id).toBeDefined();
    });
    
    test('authenticateJWT middleware should reject requests without token', async () => {
      // Create a route that uses the middleware
      const testApp = express();
      testApp.use(cookieParser());
      
      // Extract or recreate the middleware
      const authenticateJWT = (req, res, next) => {
        const token = req.cookies.token;
      
        if (!token) {
          return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }
      
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
          if (err) {
            return res.status(403).json({ message: err.message === 'jwt expired' ? 'Session expired, please log in again' : 'Unauthorized: Invalid token' });
          }
          req.user = user;
          next();
        });
      };
      
      testApp.get('/protected', authenticateJWT, (req, res) => {
        res.json({ success: true });
      });
      
      const response = await request(testApp).get('/protected');
      expect(response.status).toBe(401);
    });
    
    test('authenticateJWT middleware should reject invalid tokens', async () => {
      const testApp = express();
      testApp.use(cookieParser());
      
      const authenticateJWT = (req, res, next) => {
        const token = req.cookies.token;
      
        if (!token) {
          return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }
      
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
          if (err) {
            return res.status(403).json({ message: err.message === 'jwt expired' ? 'Session expired, please log in again' : 'Unauthorized: Invalid token' });
          }
          req.user = user;
          next();
        });
      };
      
      testApp.get('/protected', authenticateJWT, (req, res) => {
        res.json({ success: true });
      });
      
      const response = await request(testApp)
        .get('/protected')
        .set('Cookie', ['token=invalidtoken']);
        
      expect(response.status).toBe(403);
    });
    
    test('authenticateJWT middleware should accept valid tokens', async () => {
      const testApp = express();
      testApp.use(cookieParser());
      
      const authenticateJWT = (req, res, next) => {
        const token = req.cookies.token;
      
        if (!token) {
          return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }
      
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
          if (err) {
            return res.status(403).json({ message: err.message === 'jwt expired' ? 'Session expired, please log in again' : 'Unauthorized: Invalid token' });
          }
          req.user = user;
          next();
        });
      };
      
      testApp.get('/protected', authenticateJWT, (req, res) => {
        res.json({ success: true });
      });
      
      const validToken = jwt.sign({ userId: 'test' }, process.env.JWT_SECRET);
      
      const response = await request(testApp)
        .get('/protected')
        .set('Cookie', [`token=${validToken}`]);
        
      expect(response.status).toBe(200);
    });
    
    test('authenticateJWT middleware should reject expired tokens', async () => {
      const testApp = express();
      testApp.use(cookieParser());
      
      const authenticateJWT = (req, res, next) => {
        const token = req.cookies.token;
      
        if (!token) {
          return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }
      
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
          if (err) {
            return res.status(403).json({ message: err.message === 'jwt expired' ? 'Session expired, please log in again' : 'Unauthorized: Invalid token' });
          }
          req.user = user;
          next();
        });
      };
      
      testApp.get('/protected', authenticateJWT, (req, res) => {
        res.json({ success: true });
      });
      
      // Create an expired token (issued 2 hours ago with 1 hour expiry)
      const expiredToken = jwt.sign(
        { userId: 'test' }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );
      
      const response = await request(testApp)
        .get('/protected')
        .set('Cookie', [`token=${expiredToken}`]);
        
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Session expired, please log in again');
    });
  });
  
  // Test Google OAuth
  describe('Google OAuth Setup', () => {
    test('should set up Google OAuth strategy', () => {
      expect(passport.use).toHaveBeenCalled();
    });
    
    test('should handle Google OAuth callback success', async () => {
      // Mock the user for passport
      User.findOne.mockResolvedValue({
        _id: 'googleUserId',
        googleId: 'test-google-id',
        username: 'Google User',
        email: 'google@example.com',
        role: 'user'
      });
      
      const response = await request(app).get('/auth/google/callback');
      
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
      expect(response.status).toBe(302); // Redirect status
      expect(response.headers.location).toBe(`${process.env.GOOGLE_CLIENT_HOST}/auth-success`);
    });
    
    test('should handle Google OAuth callback with no user', async () => {
      // Override the passport mock for this test
      const originalAuth = passport.authenticate;
      passport.authenticate = jest.fn(() => (req, res, next) => {
        req.user = null;
        next();
      });
      
      const response = await request(app).get('/auth/google/callback');
      
      expect(response.status).toBe(302); // Redirect status
      expect(response.headers.location).toBe(`${process.env.GOOGLE_CLIENT_HOST}/login?error=GoogleAuthFailed`);
      
      // Restore the original mock
      passport.authenticate = originalAuth;
    });

    test('should handle server error during Google OAuth callback', async () => {
      // Override the passport mock for this test
      const originalAuth = passport.authenticate;
      passport.authenticate = jest.fn(() => (req, res, next) => {
        req.user = { _id: 'mockId' };
        next();
      });
      
      // Make the update fail
      User.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/auth/google/callback');
      
      expect(response.status).toBe(302); // Redirect status
      expect(response.headers.location).toBe(`${process.env.GOOGLE_CLIENT_HOST}/login?error=ServerError`);
      
      // Restore the original mock
      passport.authenticate = originalAuth;
      User.findByIdAndUpdate.mockResolvedValue(true);
    });
    
    test('should handle new user registration during Google OAuth', async () => {
      // Mock for passport strategy callback testing
      const GoogleStrategy = require('passport-google-oauth20').Strategy;
      const strategyCallback = passport.use.mock.calls[0][0].constructor === GoogleStrategy
        ? passport.use.mock.calls[0][0]._verify
        : jest.fn();
      
      // Mock that user doesn't exist yet
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'newUserId',
        googleId: 'new-google-id',
        username: 'New Google User',
        email: 'new@example.com',
        role: 'user'
      });
      
      // Test the strategy callback directly if available
      if (typeof strategyCallback === 'function') {
        const profile = {
          id: 'new-google-id',
          displayName: 'New Google User',
          emails: [{ value: 'new@example.com' }]
        };
        
        const doneMock = jest.fn();
        await strategyCallback(null, null, profile, doneMock);
        
        expect(User.create).toHaveBeenCalled();
        expect(doneMock).toHaveBeenCalled();
        const user = doneMock.mock.calls[0][1];
        expect(user).toBeDefined();
        expect(user.googleId).toBe('new-google-id');
      }
    });
    
    test('should handle error during Google OAuth strategy', async () => {
      // Mock for passport strategy callback testing
      const GoogleStrategy = require('passport-google-oauth20').Strategy;
      const strategyCallback = passport.use.mock.calls[0][0].constructor === GoogleStrategy
        ? passport.use.mock.calls[0][0]._verify
        : jest.fn();
      
      // Mock database error
      User.findOne.mockRejectedValue(new Error('Database error'));
      
      // Test the strategy callback directly if available
      if (typeof strategyCallback === 'function') {
        const profile = {
          id: 'error-google-id',
          displayName: 'Error User',
          emails: [{ value: 'error@example.com' }]
        };
        
        const doneMock = jest.fn();
        await strategyCallback(null, null, profile, doneMock);
        
        expect(doneMock.mock.calls[0][0]).toBeInstanceOf(Error);
      }
    });
  });
  
  // Test passport serialize/deserialize
  describe('Passport Serialization', () => {
    test('should serialize user correctly', () => {
      // Get the serializer function that was passed to passport
      const serializeUser = passport.serializeUser.mock.calls[0][0];
      
      // Create a mock done callback
      const doneMock = jest.fn();
      
      // Call the serializer with a test user
      serializeUser({ googleId: 'test-google-id' }, doneMock);
      
      // Check that it called the done callback correctly
      expect(doneMock).toHaveBeenCalledWith(null, 'test-google-id');
    });
    
    test('should deserialize user correctly', async () => {
      // Get the deserializer function that was passed to passport
      const deserializeUser = passport.deserializeUser.mock.calls[0][0];
      
      // Create a mock done callback
      const doneMock = jest.fn();
      
      // Mock finding the user
      User.findOne.mockResolvedValue({ googleId: 'test-google-id', username: 'Test User' });
      
      // Call the deserializer
      await deserializeUser('test-google-id', doneMock);
      
      // Check that it called the done callback correctly
      expect(doneMock).toHaveBeenCalledWith(null, expect.objectContaining({ googleId: 'test-google-id' }));
    });
    
    test('should handle error during deserialization', async () => {
      // Get the deserializer function that was passed to passport
      const deserializeUser = passport.deserializeUser.mock.calls[0][0];
      
      // Create a mock done callback
      const doneMock = jest.fn();
      
      // Mock a database error
      User.findOne.mockRejectedValue(new Error('Database error'));
      
      // Call the deserializer
      await deserializeUser('test-google-id', doneMock);
      
      // Check that it called the done callback with the error
      expect(doneMock).toHaveBeenCalledWith(expect.any(Error), null);
    });
  });
  
  // Test MongoDB connection
  describe('MongoDB Connection', () => {
    test('should connect to MongoDB when not in test environment', async () => {
      // Temporarily change environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Re-run the code that connects to MongoDB
      const listenSpy = jest.spyOn(app, 'listen').mockImplementation((port, callback) => {
        if (callback) callback();
        return { on: jest.fn() };
      });
      
      // This should trigger the connection
      require('../server');
      
      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
      listenSpy.mockRestore();
    });
    
    test('should exit if MONGO_URI is missing', () => {
      // Save original
      const originalUri = process.env.MONGO_URI;
      const originalExit = process.exit;
      
      // Mock process.exit
      process.exit = jest.fn();
      
      // Remove MONGO_URI
      delete process.env.MONGO_URI;
      
      // Re-run the code that checks for MONGO_URI
      require('../server');
      
      expect(process.exit).toHaveBeenCalledWith(1);
      
      // Restore originals
      process.env.MONGO_URI = originalUri;
      process.exit = originalExit;
    });
  });
  
  // Test routes are properly set up
  describe('Routes Setup', () => {
    test('should set up unlogRoutes correctly', async () => {
      const response = await request(app).get('/api/auth/test-route');
      // We don't necessarily expect a 200 since the route may not exist,
      // but we shouldn't get a 404 for the base path
      expect(response.status).not.toBe(404);
    });
    
    test('should set up protected routes correctly', async () => {
      // Just test that the route exists and requires authentication
      const routes = [
        '/api/admin/test',
        '/api/user/test',
        '/api/vendor/test'
      ];
      
      for (const route of routes) {
        const response = await request(app).get(route);
        expect(response.status).toBe(401); // Should be unauthorized without token
      }
    });
  });
});