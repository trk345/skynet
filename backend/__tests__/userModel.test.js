const { User } = require('../models/userSchemas');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

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
    await User.deleteMany({});
  });
  

describe('User Model Tests', () => {

  it('should hash the password when a password is set', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123',
      role: 'user'
    });

    await user.save();

    const isPasswordHashed = bcrypt.compareSync('testpassword123', user.password);
    expect(isPasswordHashed).toBe(true);
  });

  it('should not store a password if googleId is provided', async () => {
    const user = new User({
      username: 'googleUser',
      email: 'google@example.com',
      googleId: 'google123',
      role: 'user'
    });

    await user.save();
    expect(user.password).toBeUndefined();
  });

  it('should validate that email is unique', async () => {
    const user1 = new User({
      username: 'user1',
      email: 'unique@example.com',
      password: 'password123',
      role: 'user'
    });

    await user1.save();

    const user2 = new User({
      username: 'user2',
      email: 'unique@example.com',
      password: 'password456',
      role: 'user'
    });

    await expect(user2.save()).rejects.toThrowError('E11000 duplicate key error');
  });

  it('should validate that notifications array length does not exceed 50', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      notifications: Array(51).fill({ message: 'Test notification' })
    });

    await expect(user.save()).rejects.toThrowError('notifications exceeds the limit of 50');
  });

  it('should validate that reviews have a rating between 1 and 5', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      reviewsGiven: [{
        property: new mongoose.Types.ObjectId(),
        rating: 6, // Invalid rating
        comment: 'Good place'
      }]
    });

    + await expect(user.save()).rejects.toThrowError('User validation failed: reviewsGiven.0.rating: Path `rating` (6) is more than maximum allowed value (5).');
  });

  it('should add bookings correctly', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      bookings: [{
        property: new mongoose.Types.ObjectId(),
        startdate: new Date('2025-05-01'),
        enddate: new Date('2025-05-10')
      }]
    });

    await user.save();

    expect(user.bookings.length).toBe(1);
    expect(user.bookings[0].startdate).toEqual(new Date('2025-05-01'));
    expect(user.bookings[0].enddate).toEqual(new Date('2025-05-10'));
  });

  it('should set averageRating to 0 if no reviewsGiven', async () => {
    const user = new User({
      username: 'noreviewsuser',
      email: 'noreviews@example.com',
      password: 'password123',
      reviewsGiven: []
    });
  
    await user.save();
  
    expect(user.averageRating).toBe(0);
    expect(user.reviewCount).toBe(0);
  });
});