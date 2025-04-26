// // middleware/csrf.js
// const crypto = require("crypto");

// const csrfMiddleware = (req, res, next) => {
//   if (req.method === "GET") return next();

//   const csrfToken = crypto.randomBytes(32).toString("hex");

//   res.cookie("XSRF-TOKEN", csrfToken, {
//     httpOnly: false,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "Strict",
//   });

//   req.csrfToken = csrfToken;
//   next();
// };

// module.exports = csrfMiddleware;