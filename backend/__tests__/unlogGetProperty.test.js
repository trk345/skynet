const express = require('express');
const request = require('supertest');
const { getProperty } = require('../controllers/unlogControllers');
const { Property } = require('../models/propertySchemas');

// Mock Property model
jest.mock('../models/propertySchemas');

const app = express();
app.get('/api/auth/getProperty/:id', getProperty);

describe('GET /api/auth/getProperty/:id', () => {
    beforeAll(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });
  
    afterAll(() => {
      console.error.mockRestore();
    });
  
    afterEach(() => jest.clearAllMocks());
  
    it('should return property data when found', async () => {
      const mockProperty = {
        _id: 'property-id-123',
        name: 'Cozy Cottage',
        location: 'Countryside',
        price: 120,
      };
  
      Property.findById.mockResolvedValue(mockProperty);
  
      const res = await request(app).get('/api/auth/getProperty/property-id-123');
  
      expect(Property.findById).toHaveBeenCalledWith('property-id-123');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: mockProperty });
    });
  
    it('should return 500 on server error', async () => {
      Property.findById.mockRejectedValue(new Error('Database error'));
  
      const res = await request(app).get('/api/auth/getProperty/property-id-123');
  
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        success: false,
        error: 'Could not fetch the property in server',
      });
    });
  });
  