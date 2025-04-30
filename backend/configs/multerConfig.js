const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isTestEnv = process.env.NODE_ENV === 'test';

let storage;

if (isTestEnv) {
  // Use memoryStorage during tests
  storage = multer.memoryStorage();
} else {
  // Use diskStorage in development and production
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Ensure the 'uploads/' directory exists
      if (!fs.existsSync('uploads/')) {
        fs.mkdirSync('uploads/', { recursive: true });
      }
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const originalName = file.originalname;
      const extension = path.extname(originalName);
      cb(null, Date.now() + path.basename(originalName, extension) + extension);
    }
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type, only JPG, PNG, WEBP are allowed"), false);
    }
  }
});

module.exports = upload;
