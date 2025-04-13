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

const updateProperty = async (req, res) => {
  try {
    const propertyID = req.params.id;
    const existingProperty = await Property.findById(propertyID);
    if (!existingProperty) return res.status(404).json({ message: "Property not found" });

    const updatedData = {
      name: sanitizeAndParse(req.body.updatedName),
      type: sanitizeAndParse(req.body.updatedType),
      description: sanitizeAndParse(req.body.updatedDescription),
      location: sanitizeAndParse(req.body.updatedLocation),
      address: sanitizeAndParse(req.body.updatedAddress),
      squareFeet: sanitizeAndParse(req.body.updatedSquareFeet),
      price: req.body.updatedPrice && !isNaN(req.body.updatedPrice) ? Number(req.body.updatedPrice) : undefined,
      bedrooms: req.body.updatedBedrooms && !isNaN(req.body.updatedBedrooms) ? Number(req.body.updatedBedrooms) : undefined,
      bathrooms: req.body.updatedBathrooms && !isNaN(req.body.updatedBathrooms) ? Number(req.body.updatedBathrooms) : undefined,
      maxGuests: req.body.updatedMaxGuests && !isNaN(req.body.updatedMaxGuests) ? Number(req.body.updatedMaxGuests) : undefined,
    };

    const amenities = validateJSON(req.body.updatedAmenities);
    const availability = validateJSON(req.body.updatedAvailability);
    if (req.body.updatedAmenities && !amenities) return res.status(400).json({ message: "Invalid format for amenities" });
    if (req.body.updatedAvailability && !availability) return res.status(400).json({ message: "Invalid format for availability" });
    if (amenities) {
      const allowedAmenities = ['wifi', 'parking', 'breakfast', 'airConditioning', 'heating', 'tv', 'kitchen', 'workspace'];
      updatedData.amenities = Object.fromEntries(
        Object.entries(amenities).filter(([key, value]) =>
          allowedAmenities.includes(key) && typeof value === 'boolean'
        )
      );
    }
    if (availability) {
      const { startDate, endDate } = availability;
      const isValidDate = date => typeof date === 'string' && !isNaN(Date.parse(date));
    
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return res.status(400).json({ message: "Invalid date format in availability" });
      }
    
      updatedData.availability = { startDate, endDate };
    }
    

    const { emailValid, mobileValid } = validateInputFormats(req.body.updatedEmail, req.body.updatedMobile);
    if (!emailValid) return res.status(400).json({ message: "Invalid email format" });
    if (!mobileValid) return res.status(400).json({ message: "Invalid mobile number format" });

    updatedData.email = emailValid && req.body.updatedEmail
      ? sanitizeAndParse(req.body.updatedEmail)
      : existingProperty.email;

    updatedData.mobile = mobileValid && req.body.updatedMobile
      ? sanitizeAndParse(req.body.updatedMobile)
      : existingProperty.mobile;

    let updatedImagePaths = handleImageDeletion(existingProperty.images, req.body.removedImages);
    const newImagePaths = req.files.map(file => file.path);
    updatedImagePaths = [...updatedImagePaths, ...newImagePaths];
    updatedData.images = updatedImagePaths;

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