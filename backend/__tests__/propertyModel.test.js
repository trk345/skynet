const mongoose = require('mongoose');
const { Property } = require('../models/propertySchemas'); // Adjust path if different


beforeAll(async () => {
    const mongoURI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/testdb';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });
  
  afterEach(async () => {
    await Property.deleteMany({});
  });
  

describe('Property Model Tests', () => {

  it('should create and save a property successfully', async () => {
    const property = new Property({
      userID: new mongoose.Types.ObjectId(),
      name: 'Cozy Apartment',
      type: 'Apartment',
      description: 'A nice place to stay',
      location: 'New York',
      address: '123 Main St',
      price: 150,
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: '800',
      maxGuests: 4,
      mobile: '1234567890',
      email: 'owner@example.com',
      amenities: {
        wifi: true,
        parking: true,
      },
      availability: {
        startDate: new Date(),
        endDate: new Date(),
      },
      images: ['image1.jpg', 'image2.jpg']
    });

    const savedProperty = await property.save();

    expect(savedProperty._id).toBeDefined();
    expect(savedProperty.name).toBe('Cozy Apartment');
    expect(savedProperty.amenities.wifi).toBe(true);
    expect(savedProperty.averageRating).toBe(0);
    expect(savedProperty.reviewCount).toBe(0);
  });

  it('should not save a property without required fields', async () => {
    const property = new Property({});

    await expect(property.save()).rejects.toThrowError();
  });

  it('should calculate averageRating and reviewCount correctly', async () => {
    const property = new Property({
      userID: new mongoose.Types.ObjectId(),
      name: 'Luxury Villa',
      type: 'Villa',
      description: 'High-end living',
      location: 'Los Angeles',
      address: '456 Sunset Blvd',
      price: 500,
      bedrooms: 5,
      bathrooms: 4,
      maxGuests: 10,
      mobile: '0987654321',
      email: 'villa@example.com',
      reviews: [
        { userId: new mongoose.Types.ObjectId(), username: 'Alice', rating: 5, comment: 'Amazing stay!' },
        { userId: new mongoose.Types.ObjectId(), username: 'Bob', rating: 4, comment: 'Very nice' },
      ]
    });

    const savedProperty = await property.save();

    expect(savedProperty.averageRating).toBe(4.5);
    expect(savedProperty.reviewCount).toBe(2);
  });

  it('should not allow a review with rating outside 1-5', async () => {
    const property = new Property({
      userID: new mongoose.Types.ObjectId(),
      name: 'Cabin',
      type: 'Cabin',
      description: 'In the woods',
      location: 'Colorado',
      address: '789 Forest Rd',
      price: 120,
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      mobile: '1122334455',
      email: 'cabin@example.com',
      reviews: [
        { userId: new mongoose.Types.ObjectId(), username: 'Chris', rating: 6, comment: 'Way too good' }
      ]
    });

    await expect(property.save()).rejects.toThrowError('is more than maximum allowed value (5)');
  });

  it('should require userId in bookedDates', async () => {
    const property = new Property({
      userID: new mongoose.Types.ObjectId(),
      name: 'Beach House',
      type: 'House',
      description: 'On the beach',
      location: 'Miami',
      address: '101 Ocean Drive',
      price: 300,
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 6,
      mobile: '5566778899',
      email: 'beach@example.com',
      bookedDates: [
        { 
          checkIn: new Date('2025-06-01'), 
          checkOut: new Date('2025-06-07') 
        }
      ]
    });

    await expect(property.save()).rejects.toThrowError('userId');
  });

});
