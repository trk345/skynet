const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");  // Make sure to export your Express app
const { Property } = require("../models/propertySchemas");
const mongoose = require("mongoose");

// Mock the Property model to simulate database calls
jest.mock("../models/propertySchemas", () => ({
  Property: {
    find: jest.fn(),
  },
}));

describe("GET /api/vendor/getProperties", () => {
  let token;

  beforeAll(() => {
    // Simulate a valid JWT token (replace with actual token structure if needed)
    token = jwt.sign(
      { userId: "testUserId", username: "testUser", role: "vendor" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  it("should fetch properties for the logged-in vendor", async () => {
    // Mock the Property.find to return fake properties
    const mockProperties = [
      { _id: "propertyId1", name: "Test Property 1", location: "Test Location 1" },
      { _id: "propertyId2", name: "Test Property 2", location: "Test Location 2" },
    ];

    Property.find.mockResolvedValue(mockProperties);

    const response = await request(app)
      .get("/api/vendor/getProperties")
      .set("Cookie", [`token=${token}`]); // Attach the JWT token in the cookie

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockProperties);
  });

  it("should return 401 if no token is provided", async () => {
    const response = await request(app).get("/api/vendor/getProperties");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized: No token provided");
  });

  it("should return 403 if the token is invalid or expired", async () => {
    const invalidToken = "invalidToken";

    const response = await request(app)
      .get("/api/vendor/getProperties")
      .set("Cookie", [`token=${invalidToken}`]);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Unauthorized: Invalid token");
  });

  it("should return 500 if an error occurs while fetching properties", async () => {
    // Simulate an error in the database query
    Property.find.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .get("/api/vendor/getProperties")
      .set("Cookie", [`token=${token}`]);

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Could not fetch vendor's properties in server");
  });
});
