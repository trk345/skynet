const mongoose = require('mongoose');
const { VendorRequest } = require('../models/vendorRequestSchemas'); // Adjust path
require('dotenv').config();

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
  await VendorRequest.deleteMany({});
});

describe('VendorRequest Model Tests', () => {
  it('should save a valid vendor request', async () => {
    const validRequest = new VendorRequest({
      requesterID: new mongoose.Types.ObjectId(),
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      mobile: '+1234567890',
      message: 'I want to become a vendor'
    });

    const savedRequest = await validRequest.save();
    expect(savedRequest._id).toBeDefined();
    expect(savedRequest.status).toBe('pending'); // default status
  });

  it('should fail with invalid email', async () => {
    const invalidEmailRequest = new VendorRequest({
      requesterID: new mongoose.Types.ObjectId(),
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'notanemail',
      mobile: '+1234567890',
      message: 'Please approve me'
    });

    await expect(invalidEmailRequest.save()).rejects.toThrow('Invalid email format');
  });

  it('should fail with invalid mobile number', async () => {
    const invalidMobileRequest = new VendorRequest({
      requesterID: new mongoose.Types.ObjectId(),
      firstName: 'Alice',
      lastName: 'Brown',
      email: 'alice@example.com',
      mobile: '12345',
      message: 'Vendor request'
    });

    await expect(invalidMobileRequest.save()).rejects.toThrow('Invalid phone number format');
  });

  it('should fail if firstName is too short', async () => {
    const shortFirstNameRequest = new VendorRequest({
      requesterID: new mongoose.Types.ObjectId(),
      firstName: 'A',
      lastName: 'Brown',
      email: 'alice@example.com',
      mobile: '+1234567890',
      message: 'Vendor request'
    });

    await expect(shortFirstNameRequest.save()).rejects.toThrow('First name must be at least 2 characters');
  });

  it('should fail if lastName is too short', async () => {
    const shortLastNameRequest = new VendorRequest({
      requesterID: new mongoose.Types.ObjectId(),
      firstName: 'Alice',
      lastName: 'B',
      email: 'alice@example.com',
      mobile: '+1234567890',
      message: 'Vendor request'
    });

    await expect(shortLastNameRequest.save()).rejects.toThrow('Last name must be at least 2 characters');
  });

  it('should fail if message is empty', async () => {
    const emptyMessageRequest = new VendorRequest({
      requesterID: new mongoose.Types.ObjectId(),
      firstName: 'Alice',
      lastName: 'Brown',
      email: 'alice@example.com',
      mobile: '+1234567890',
      message: ''
    });

    await expect(emptyMessageRequest.save()).rejects.toThrow('Message cannot be empty');
  });

  it('should allow setting status to approved', async () => {
    const approvedRequest = new VendorRequest({
      requesterID: new mongoose.Types.ObjectId(),
      firstName: 'Bob',
      lastName: 'Builder',
      email: 'bob@example.com',
      mobile: '+1234567890',
      message: 'Vendor approval',
      status: 'approved'
    });

    const savedRequest = await approvedRequest.save();
    expect(savedRequest.status).toBe('approved');
  });

  it('should fail with invalid status', async () => {
    const invalidStatusRequest = new VendorRequest({
      requesterID: new mongoose.Types.ObjectId(),
      firstName: 'Charlie',
      lastName: 'Day',
      email: 'charlie@example.com',
      mobile: '+1234567890',
      message: 'Vendor application',
      status: 'unknown' // not in enum
    });

    await expect(invalidStatusRequest.save()).rejects.toThrow();
  });
});