const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");  // Make sure to export your Express app
const { Property } = require("../models/propertySchemas");
const mongoose = require("mongoose");

// Mock the Property model to simulate database calls
jest.mock("../models/propertySchemas", () => ({
  Property: {
    findById: jest.fn(),
  },
}));

describe("GET /api/vendor/getProperty/:id", () => {
  let token;
  const propertyId = "propertyId123";

  beforeAll(() => {
    // Simulate a valid JWT token (replace with actual token structure if needed)
    token = jwt.sign(
      { userId: "testUserId", username: "testUser", role: "vendor" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  it("should fetch the property by ID for the logged-in vendor", async () => {
    // Mock the Property.findById to return a fake property
    const mockProperty = {
      _id: propertyId,
      name: "Test Property",
      location: "Test Location",
    };

    Property.findById.mockResolvedValue(mockProperty);

    const response = await request(app)
      .get(`/api/vendor/getProperty/${propertyId}`)
      .set("Cookie", [`token=${token}`]); // Attach the JWT token in the cookie

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockProperty);
  });

  it("should return 401 if no token is provided", async () => {
    const response = await request(app).get(`/api/vendor/getProperty/${propertyId}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized: No token provided");
  });

  it("should return 403 if the token is invalid or expired", async () => {
    const invalidToken = "invalidToken";

    const response = await request(app)
      .get(`/api/vendor/getProperty/${propertyId}`)
      .set("Cookie", [`token=${invalidToken}`]);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Unauthorized: Invalid token");
  });

  it("should return 500 if an error occurs while fetching the property", async () => {
    // Simulate an error in the database query
    Property.findById.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .get(`/api/vendor/getProperty/${propertyId}`)
      .set("Cookie", [`token=${token}`]);

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Could not fetch vendor's property in server");
  });

});
