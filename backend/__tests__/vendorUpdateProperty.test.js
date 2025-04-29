const { updateProperty } = require('../controllers/vendorControllers'); // Adjust path as needed
const { Property } = require('../models/propertySchemas');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../models/propertySchemas');
jest.mock('fs');
jest.mock('path');

describe('updateProperty Controller', () => {
  let req, res, mockProperty;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Add these two console mocks
    console.error = jest.fn();
    console.log = jest.fn();

    // Mock response object with jest.fn() for tracking calls
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock property data
    mockProperty = {
      _id: 'property123',
      name: 'Beach House',
      type: 'Villa',
      description: 'Beautiful beach house',
      location: 'Miami',
      address: '123 Ocean Drive',
      squareFeet: 2000,
      price: 500,
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 6,
      email: 'owner@example.com',
      mobile: '+1234567890',
      images: ['/uploads/image1.jpg', '/uploads/image2.jpg'],
      amenities: { wifi: true, parking: true },
      availability: { startDate: '2025-05-01', endDate: '2025-10-01' }
    };

    // Mock the request object
    req = {
      params: { id: 'property123' },
      body: {
        updatedName: 'Updated Beach House',
        updatedType: 'Luxury Villa',
        updatedDescription: 'Newly renovated beach house',
        updatedLocation: 'Miami Beach',
        updatedAddress: '456 Ocean Drive',
        updatedSquareFeet: '2500',
        updatedPrice: '600',
        updatedBedrooms: '4',
        updatedBathrooms: '3',
        updatedMaxGuests: '8',
        updatedEmail: 'newowner@example.com',
        updatedMobile: '+9876543210',
        updatedAmenities: JSON.stringify({ wifi: true, parking: true, breakfast: true }),
        updatedAvailability: JSON.stringify({ startDate: '2025-06-01', endDate: '2025-11-01' }),
        removedImages: []
      },
      files: [],
      user: { id: 'user123' } // Add user information since route is protected
    };

    // Mock path implementations for UPLOADS_DIR and other paths
    path.join.mockImplementation((...parts) => {
      // This handles the UPLOADS_DIR constant in the controller
      if (parts[0] === '__dirname' && parts[1] === '..' && parts[2] === 'uploads') {
        return '/uploads';
      }
      return parts.join('/');
    });
    
    path.basename.mockImplementation((filePath) => filePath.split('/').pop());

    // Mock fs methods
    fs.existsSync.mockReturnValue(true);
    fs.unlink.mockImplementation((path, callback) => callback(null));

    // Mock path.join and path.basename implementations
    path.join.mockImplementation((...args) => args.join('/'));
    path.basename.mockImplementation((filePath) => filePath.split('/').pop());

    // Mock Property.findById and findByIdAndUpdate
    Property.findById = jest.fn().mockResolvedValue(mockProperty);
    Property.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockProperty, ...req.body });

    // Mock fs.existsSync and fs.unlink
    fs.existsSync.mockReturnValue(true);
    fs.unlink.mockImplementation((path, callback) => callback(null));
  });

  test('should update property successfully with valid data', async () => {
    await updateProperty(req, res);

    expect(Property.findById).toHaveBeenCalledWith('property123');
    expect(Property.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Property Updated' });
  });

  test('should return 404 if property not found', async () => {
    // Mock property not found
    Property.findById.mockResolvedValue(null);

    await updateProperty(req, res);

    expect(Property.findById).toHaveBeenCalledWith('property123');
    expect(Property.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Property not found' });
  });

  test('should handle invalid email format', async () => {
    req.body.updatedEmail = 'invalid-email';

    await updateProperty(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input format' });
  });

  test('should handle invalid mobile format', async () => {
    req.body.updatedMobile = 'abc123';

    await updateProperty(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input format' });
  });

  test('should handle invalid JSON for amenities', async () => {
    req.body.updatedAmenities = '{invalid json}';

    await updateProperty(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input format' });
  });

  test('should handle invalid JSON for availability', async () => {
    req.body.updatedAvailability = '{invalid json}';

    await updateProperty(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input format' });
  });

  test('should handle invalid availability dates', async () => {
    req.body.updatedAvailability = JSON.stringify({ startDate: 'invalid-date', endDate: '2025-11-01' });

    await updateProperty(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input format' });
  });

  test('should handle image deletion', async () => {
    // Based on the controller code, we need to ensure we're using the correct UPLOADS_DIR value
    // and that our path.join mock works as expected in the handleImageDeletion function
    
    // First, explicitly define the path.join behavior needed for this test
    path.join.mockImplementation((...parts) => {
      if (parts[0] === '__dirname' && parts[1] === '..' && parts[2] === 'uploads') {
        return '/uploads'; // This simulates the UPLOADS_DIR constant
      }
      return parts.join('/'); // Otherwise join as normal
    });
    
    // Mock behavior for path.basename which is used in handleImageDeletion
    path.basename.mockImplementation((filePath) => filePath.split('/').pop());
    
    // Mock fs.existsSync and fs.unlink specifically for the image path
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('image1.jpg')) return true;
      return false;
    });
    
    // Set removedImages to trigger handleImageDeletion
    req.body.removedImages = '/uploads/image1.jpg'; // Use string not array to test single image case
    
    await updateProperty(req, res);
    
    // Verify the operations were performed
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalled();
    
    // Check property update excluded the removed image
    const updatedPropertyData = Property.findByIdAndUpdate.mock.calls[0][1];
    expect(updatedPropertyData.images).not.toContain('/uploads/image1.jpg');
    expect(updatedPropertyData.images).toContain('/uploads/image2.jpg');
  });

  test('should handle adding new images', async () => {
    const mockNewFiles = [
      { path: '/uploads/newimage1.jpg' },
      { path: '/uploads/newimage2.jpg' }
    ];
    req.files = mockNewFiles;

    await updateProperty(req, res);

    // The updated property should include new images
    const updateCall = Property.findByIdAndUpdate.mock.calls[0];
    expect(updateCall[0]).toBe('property123');
    
    // Check that the images array contains both old and new images
    const updatedImages = updateCall[1].images;
    expect(updatedImages).toContain('/uploads/image1.jpg');
    expect(updatedImages).toContain('/uploads/image2.jpg');
    expect(updatedImages).toContain('/uploads/newimage1.jpg');
    expect(updatedImages).toContain('/uploads/newimage2.jpg');
    expect(updatedImages.length).toBe(4);
  });

  test('should handle server error', async () => {
    // Simulate a server error
    Property.findById.mockRejectedValue(new Error('Database connection failed'));

    await updateProperty(req, res);

    // Check that error was logged
    expect(console.error).toHaveBeenCalled();
    
    // Verify correct response was sent
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Server Error' });
  });

  test('should handle empty property updates', async () => {
    // Empty update, keeping existing values
    req.body = { removedImages: [] };

    await updateProperty(req, res);

    expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(
      'property123',
      expect.objectContaining({
        images: expect.arrayContaining(['/uploads/image1.jpg', '/uploads/image2.jpg'])
      }),
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('should filter invalid amenities', async () => {
    req.body.updatedAmenities = JSON.stringify({
      wifi: true,
      parking: true,
      invalidAmenity: true, // This should be filtered out
      breakfast: false
    });

    await updateProperty(req, res);

    // Check that only valid amenities are included
    expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(
      'property123',
      expect.objectContaining({
        amenities: expect.objectContaining({
          wifi: true,
          parking: true,
          breakfast: false
        })
      }),
      { new: true }
    );
    expect(Property.findByIdAndUpdate.mock.calls[0][1].amenities).not.toHaveProperty('invalidAmenity');
  });
});