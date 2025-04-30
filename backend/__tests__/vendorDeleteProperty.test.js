const { deleteProperty } = require('../controllers/vendorControllers');
const { User } = require('../models/userSchemas');
const { Property } = require('../models/propertySchemas');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../models/userSchemas');
jest.mock('../models/propertySchemas');
jest.mock('fs');
jest.mock('path');

describe('Delete Property Controller', () => {
  let req, res;
  const UPLOADS_DIR = '/path/to/uploads';
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock request and response objects
    req = {
      params: { id: 'mockPropertyId' },
      user: { userId: 'mockUserId' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Mock path functions
    path.basename.mockImplementation(filepath => 'mockImage.jpg');
    path.join.mockImplementation((dir, file) => `${dir}/${file}`);
    
    // Mock property with images
    Property.findById = jest.fn().mockResolvedValue({
      _id: 'mockPropertyId',
      images: ['/uploads/mockImage1.jpg', '/uploads/mockImage2.jpg']
    });
    
    // Mock successful deletion
    Property.findByIdAndDelete = jest.fn().mockResolvedValue(true);
    User.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'mockUserId' });
    
    // Mock file system functions
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.unlink = jest.fn((path, callback) => callback(null));
    
    // Set global UPLOADS_DIR
    global.UPLOADS_DIR = UPLOADS_DIR;
  });
  
  afterEach(() => {
    delete global.UPLOADS_DIR;
  });

  test('should successfully delete a property with all images', async () => {
    // Act
    await deleteProperty(req, res);
    
    // Assert
    expect(Property.findById).toHaveBeenCalledWith('mockPropertyId');
    expect(path.basename).toHaveBeenCalledTimes(2);
    expect(fs.existsSync).toHaveBeenCalledTimes(2);
    expect(fs.unlink).toHaveBeenCalledTimes(2);
    expect(Property.findByIdAndDelete).toHaveBeenCalledWith('mockPropertyId');
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'mockUserId',
      { $pull: { properties: 'mockPropertyId' } },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ 
      success: true, 
      message: 'Property deleted' 
    });
  });

  test('should return 404 if property not found', async () => {
    // Arrange
    Property.findById = jest.fn().mockResolvedValue(null);
    
    // Act
    await deleteProperty(req, res);
    
    // Assert
    expect(Property.findById).toHaveBeenCalledWith('mockPropertyId');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Property not found' 
    });
    expect(fs.unlink).not.toHaveBeenCalled();
    expect(Property.findByIdAndDelete).not.toHaveBeenCalled();
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('should handle file system errors when deleting images', async () => {
    // Arrange
    console.error = jest.fn(); // Mock console.error
    fs.unlink = jest.fn((path, callback) => callback(new Error('File system error')));
    
    // Act
    await deleteProperty(req, res);
    
    // Assert
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(Property.findByIdAndDelete).toHaveBeenCalledWith('mockPropertyId');
    expect(User.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('should skip deleting non-existent image files', async () => {
    // Arrange
    fs.existsSync = jest.fn().mockReturnValue(false);
    
    // Act
    await deleteProperty(req, res);
    
    // Assert
    expect(fs.existsSync).toHaveBeenCalledTimes(2);
    expect(fs.unlink).not.toHaveBeenCalled();
    expect(Property.findByIdAndDelete).toHaveBeenCalledWith('mockPropertyId');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('should handle path traversal attempts', async () => {
    // Arrange
    Property.findById = jest.fn().mockResolvedValue({
      _id: 'mockPropertyId',
      images: ['/uploads/../config/secret.env'] // Attempted path traversal
    });
    path.basename.mockImplementation(filepath => 'secret.env');
    path.join.mockReturnValue(`${UPLOADS_DIR}/secret.env`);
    
    // Mock startsWith to ensure safety check works
    const originalStartsWith = String.prototype.startsWith;
    String.prototype.startsWith = jest.fn(function(str) {
      if (this === `${UPLOADS_DIR}/secret.env` && str === UPLOADS_DIR) {
        return true; // Simulating that the path is within uploads dir
      }
      return originalStartsWith.call(this, str);
    });
    
    // Act
    await deleteProperty(req, res);
    
    // Assert
    expect(path.basename).toHaveBeenCalled();
    expect(path.join).toHaveBeenCalledWith(UPLOADS_DIR, 'secret.env');
    expect(fs.unlink).toHaveBeenCalledTimes(1);
    
    // Restore original startsWith method
    String.prototype.startsWith = originalStartsWith;
  });

  test('should handle database error when deleting property', async () => {
    // Arrange
    const dbError = new Error('Database error');
    Property.findByIdAndDelete = jest.fn().mockRejectedValue(dbError);
    console.log = jest.fn(); // Mock console.log
    
    // Act
    await deleteProperty(req, res);
    
    // Assert
    expect(console.log).toHaveBeenCalledWith('Error deleting property:', dbError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      message: 'Server error occurred while deleting the property' 
    });
  });

  test('should handle database error when updating user', async () => {
    // Arrange
    const dbError = new Error('User update error');
    User.findByIdAndUpdate = jest.fn().mockRejectedValue(dbError);
    console.log = jest.fn(); // Mock console.log
    
    // Act
    await deleteProperty(req, res);
    
    // Assert
    expect(Property.findByIdAndDelete).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Error deleting property:', dbError);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});