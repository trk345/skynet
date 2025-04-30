const multer = require('multer');
const upload = require('../configs/multerConfig');
const storage = require('../configs/multerConfig')._storage;

describe('Multer Configuration', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  it('should use memoryStorage when NODE_ENV is test', () => {
    // Memory storage does not have a `getFilename` or `destination` property, unlike diskStorage
    expect(typeof storage._handleFile).toBe('function');
    expect(typeof storage._removeFile).toBe('function');
    expect(Object.keys(storage)).not.toContain('getFilename');
  });

  it('should accept valid image file types', done => {
    const req = {};
    const file = { mimetype: 'image/jpeg' };

    upload.fileFilter(req, file, (err, accepted) => {
      expect(err).toBeNull();
      expect(accepted).toBe(true);
      done();
    });
  });

  it('should reject invalid file types', done => {
    const req = {};
    const file = { mimetype: 'application/pdf' };

    upload.fileFilter(req, file, (err, accepted) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Invalid file type, only JPG, PNG, WEBP are allowed');
      expect(accepted).toBe(false);
      done();
    });
  });
});
