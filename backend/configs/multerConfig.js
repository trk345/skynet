const multer = require('multer');
const path = require('path');

// Set storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder where images will be stored
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname; // Get original file name
    const extension = path.extname(originalName); // Get file extension
    // Create unique filenames for uploaded images (timestamp + original name + extension)
    cb(null, Date.now() + path.basename(originalName, extension) + path.extname(file.originalname));
  }
});

// Set multer instance with file size limits and validation
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max file size is 5MB
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
