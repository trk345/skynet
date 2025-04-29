const request = require("supertest");
const app = require("../server");
const { Property } = require("../models/propertySchemas");
const jwt = require("jsonwebtoken");

jest.mock("../models/propertySchemas");
jest.mock("jsonwebtoken");

describe("GET /api/auth/getProperties", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return filtered properties", async () => {
    const mockProperties = [
      { name: "Villa A", location: "Beach", price: 200 },
      { name: "Luxury Room B", location: "City", price: 300 },
    ];

    Property.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProperties),
    });

    const res = await request(app).get("/api/auth/getProperties").query({
      location: "City",
      price: 400,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(Property.find).toHaveBeenCalled();
  });

  it("should exclude properties owned by the logged-in user", async () => {
    const userId = "user123";
    const mockProperties = [{ name: "Other User's Villa" }];

    jwt.verify.mockReturnValue({ userId });
    Property.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProperties),
    });

    const res = await request(app)
      .get("/api/auth/getProperties")
      .set("Cookie", [`token=dummy.jwt.token`]);

    expect(jwt.verify).toHaveBeenCalled();
    expect(Property.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userID: { $ne: userId },
      })
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockProperties);
  });

  it("should return 500 on server error", async () => {
    Property.find.mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error("Database Error")),
    });

    const res = await request(app).get("/api/auth/getProperties");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Server Error");
  });
});
