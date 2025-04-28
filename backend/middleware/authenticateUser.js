const jwt = require('jsonwebtoken');

// Middleware to check authentication
const authenticateUser = (req, res, next) => {
    let token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Session expired. Please log in again." });
        }
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
      }
      req.user = decoded; // Attach user data to request
      next();
    });
  };


module.exports = authenticateUser;
