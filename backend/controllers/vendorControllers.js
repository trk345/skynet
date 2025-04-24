const { User } = require("../models/userSchemas");
const { Property } = require("../models/propertySchemas");
const path = require("path");
const fs = require("fs");

const createProperty = async (req, res) => {
  try {
    // req.body has the property fields (except images)
    // req.files contain the uploaded images
    const imagePaths = req.files.map(file => file.path); // Get uploaded images' paths

    // Parse amenities and availability from JSON string to object
    const amenities = JSON.parse(req.body.amenities);
    const availability = JSON.parse(req.body.availability);

    // Create new property
    const newProperty = new Property({
      userID: req.user.userId,
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      location: req.body.location,
      address: req.body.address,
      price: req.body.price,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      squareFeet: req.body.squareFeet,
      maxGuests: req.body.maxGuests,
      amenities: amenities,
      availability: availability,
      mobile: req.body.mobile,
      email: req.body.email,
      images: imagePaths, // Save image paths in MongoDB
    });

    // Save the property data and image paths to the database
    const property = await newProperty.save();

    await User.findByIdAndUpdate(req.user.userId, 
      { $push: { properties: property._id } },
      { new: true } // Return updated user document
    );

    res.status(201).json({ message: "Property Created" /*, property: newProperty*/ });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  };

}

const getProperties = async (req, res) => {
  try {
    const properties = await Property.find({ userID: req.user.userId });
    if (properties) {
      res.status(200).json({ success: true, data: properties });
    }
  } catch (error) {
    console.log("Error fetching properties:", error);
    res.status(500).json({ success: false, error: "Could not fetch vendor's properties in server"});
  }
}

const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (property) {
      res.status(200).json({ success: true, data: property });
    }
  } catch (error) {
    console.log("Error fetching property:", error);
    res.status(500).json({ success: false, error: "Could not fetch vendor's property in server"});
  }
}


const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const sanitizeAndParse = (field, parser = v => v.trim()) => {
  return field !== undefined ? parser(field) : undefined;
};

const validateJSON = (jsonStr) => {
  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {}
  return null;
};

const validateInputFormats = (email, mobile) => {
  const emailValid = !email || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  const mobileValid = !mobile || /^\+?[0-9]{10,15}$/.test(mobile);
  return { emailValid, mobileValid };
};

const handleImageDeletion = (existingImages, removedImages) => {
  if (!removedImages) return existingImages;
  if (!Array.isArray(removedImages)) removedImages = [removedImages];

  removedImages.forEach(imagePath => {
    const filename = path.basename(imagePath);
    const fullPath = path.join(UPLOADS_DIR, filename);
    if (fullPath.startsWith(UPLOADS_DIR) && fs.existsSync(fullPath)) {
      fs.unlink(fullPath, err => {
        if (err) console.error("Error deleting %s:", fullPath, err);
      });
    }
  });

  return existingImages.filter(img => !removedImages.includes(img));
};

function buildUpdatedData(body, existing) {
  const data = {
    name: sanitizeAndParse(body.updatedName),
    type: sanitizeAndParse(body.updatedType),
    description: sanitizeAndParse(body.updatedDescription),
    location: sanitizeAndParse(body.updatedLocation),
    address: sanitizeAndParse(body.updatedAddress),
    squareFeet: sanitizeAndParse(body.updatedSquareFeet),
    price: parseIfValidNumber(body.updatedPrice),
    bedrooms: parseIfValidNumber(body.updatedBedrooms),
    bathrooms: parseIfValidNumber(body.updatedBathrooms),
    maxGuests: parseIfValidNumber(body.updatedMaxGuests),
  };

  const amenities = validateJSON(body.updatedAmenities);
  const availability = validateJSON(body.updatedAvailability);

  if (body.updatedAmenities && !amenities) return null;
  if (body.updatedAvailability && !availability) return null;

  if (amenities) data.amenities = filterValidAmenities(amenities);
  if (availability && isValidAvailability(availability)) {
    data.availability = {
      startDate: availability.startDate,
      endDate: availability.endDate
    };
  } else if (availability) return null;

  const { emailValid, mobileValid } = validateInputFormats(body.updatedEmail, body.updatedMobile);
  if (!emailValid || !mobileValid) return null;

  data.email = body.updatedEmail ? sanitizeAndParse(body.updatedEmail) : existing.email;
  data.mobile = body.updatedMobile ? sanitizeAndParse(body.updatedMobile) : existing.mobile;

  return data;
}

function parseIfValidNumber(value) {
  return value && !isNaN(value) ? Number(value) : undefined;
}

function filterValidAmenities(amenities) {
  const allowed = ['wifi', 'parking', 'breakfast', 'airConditioning', 'heating', 'tv', 'kitchen', 'workspace'];
  return Object.fromEntries(
    Object.entries(amenities).filter(([key, val]) => allowed.includes(key) && typeof val === 'boolean')
  );
}

function isValidAvailability({ startDate, endDate }) {
  return isValidDate(startDate) && isValidDate(endDate);
}

function isValidDate(date) {
  return typeof date === 'string' && (date === '' || !isNaN(Date.parse(date)));
}

function mergeImages(existingImages, removedImages, newFiles) {
  const remainingImages = handleImageDeletion(existingImages, removedImages);
  const newImagePaths = (newFiles || []).map(file => file.path);
  return [...remainingImages, ...newImagePaths];
}

const updateProperty = async (req, res) => {
  try {
    const propertyID = req.params.id;
    const existingProperty = await Property.findById(propertyID);
    if (!existingProperty) return res.status(404).json({ message: "Property not found" });

    const updatedData = buildUpdatedData(req.body, existingProperty);
    if (!updatedData) return res.status(400).json({ message: "Invalid input format" });

    updatedData.images = mergeImages(existingProperty.images, req.body.removedImages, req.files);

    await Property.findByIdAndUpdate(propertyID, updatedData, { new: true });
    res.status(200).json({ message: "Property Updated" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};


const deleteProperty = async (req, res) => {
  try {
    const propertyID = req.params.id;
    const property = await Property.findById(propertyID);

    if (!property) {
      res.status(404).json({ message: "Property not found" });
    }
    
    // Delete images from the server
    property.images.forEach(imagePath => {
      const filename = path.basename(imagePath); // Extract just the file name to prevent traversal
      const fullPath = path.join(UPLOADS_DIR, filename); // Construct full path safely within uploads directory

      // Check if the file is within the uploads directory
      if (fullPath.startsWith(UPLOADS_DIR) && fs.existsSync(fullPath)) {
        fs.unlink(fullPath, err => {
          if (err) {
            console.error(`Error deleting ${fullPath}:`, err);
          }
        });
      }
    });

    // Delete property from DB
    await Property.findByIdAndDelete(propertyID);
    await User.findByIdAndUpdate(req.user.userId, 
      { $pull: { properties: propertyID } },
      { new: true } // Return updated user document
    );
    res.status(200).json({ success: true, message:"Property deleted" });
  } catch (error) {
    console.log("Error deleting property:", error);
    res.status(500).json({ success: false, message: "Server error occurred while deleting the property"})
  }
}


module.exports = {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
};