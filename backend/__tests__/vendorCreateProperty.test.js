require('dotenv').config();
const request = require('supertest');
const app = require('../server'); // Assuming your Express app is exported from app.js
const { User } = require('../models/userSchemas');
const { Property } = require('../models/propertySchemas');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const mime = require('mime-types');

// Mock the Mongoose models
jest.mock('../models/userSchemas', () => ({
  User: {
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('../models/propertySchemas', () => {
    const mockSave = jest.fn(); // Create a mock function for save
    return {
      Property: jest.fn().mockImplementation(() => ({
        save: mockSave, // Mock the save method on the instance
      })),
    };
  });


describe('POST /create-property', () => {
  let token;

  beforeAll(() => {
    // Simulate a valid JWT token (replace with actual token structure if needed)
    token = jwt.sign(
      { userId: 'testUserId', username: 'adminUser', email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  it('should create a new property and return 201 status', async () => {
    const newPropertyData = {
      name: 'Test Property',
      type: 'House',
      description: 'A beautiful test property',
      location: 'Test Location',
      address: '123 Test St',
      price: 100,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1500,
      maxGuests: 6,
      amenities: JSON.stringify([{ amenity: 'Pool' }, { amenity: 'Gym' }]),
      availability: JSON.stringify([{ startDate: '2025-06-01', endDate: '2025-06-10' }]),
      mobile: '123-456-7890',
      email: 'testproperty@example.com',
    };

    // Mock the behavior of the save method and User.update
    const saveMock = jest.fn().mockResolvedValue({ ...newPropertyData, _id: 'newPropertyId' });
    Property.mockImplementationOnce(() => ({
      save: saveMock,
    }));

    User.findByIdAndUpdate.mockResolvedValue({ userId: 'testUserId' });

    // Simulate file upload in the request
    const mockFile = Buffer.from('mock image data'); // This is a mock image content
    const filePath = path.join(__dirname, 'testImage.jpg');

    const response = await request(app)
      .post('/api/vendor/create-property')
      .set('Cookie', [`token=${token}`]) // Correctly set the token cookie
      .field('name', newPropertyData.name)
      .field('type', newPropertyData.type)
      .field('description', newPropertyData.description)
      .field('location', newPropertyData.location)
      .field('address', newPropertyData.address)
      .field('price', newPropertyData.price)
      .field('bedrooms', newPropertyData.bedrooms)
      .field('bathrooms', newPropertyData.bathrooms)
      .field('squareFeet', newPropertyData.squareFeet)
      .field('maxGuests', newPropertyData.maxGuests)
      .field('amenities', newPropertyData.amenities)
      .field('availability', newPropertyData.availability)
      .field('mobile', newPropertyData.mobile)
      .field('email', newPropertyData.email)
      .attach('images', mockFile, filePath); // Mock file upload

    // Check if response status is 201
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Property Created');

    // Verify the mocked database calls
    expect(Property).toHaveBeenCalled();  // Property constructor should have been called
    expect(saveMock).toHaveBeenCalled();  // Save method should have been called
    expect(User.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('should return 401 if no token is provided', async () => {
    const newPropertyData = {
      name: 'Test Property',
      type: 'House',
      description: 'A beautiful test property',
      location: 'Test Location',
      address: '123 Test St',
      price: 100,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1500,
      maxGuests: 6,
      amenities: JSON.stringify([{ amenity: 'Pool' }, { amenity: 'Gym' }]),
      availability: JSON.stringify([{ startDate: '2025-06-01', endDate: '2025-06-10' }]),
      mobile: '123-456-7890',
      email: 'testproperty@example.com',
    };

    const response = await request(app)
      .post('/api/vendor/create-property')
      .field('name', newPropertyData.name)
      .field('type', newPropertyData.type)
      .field('description', newPropertyData.description)
      .field('location', newPropertyData.location)
      .field('address', newPropertyData.address)
      .field('price', newPropertyData.price)
      .field('bedrooms', newPropertyData.bedrooms)
      .field('bathrooms', newPropertyData.bathrooms)
      .field('squareFeet', newPropertyData.squareFeet)
      .field('maxGuests', newPropertyData.maxGuests)
      .field('amenities', newPropertyData.amenities)
      .field('availability', newPropertyData.availability)
      .field('mobile', newPropertyData.mobile)
      .field('email', newPropertyData.email)
      .attach('images', Buffer.from('mock image data'), 'testImage.jpg'); // Mock file upload

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized: No token provided');
  });
});