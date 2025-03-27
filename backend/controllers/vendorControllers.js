const { User } = require("../models/userSchemas");
const Property = require("../models/propertySchemas");
const path = require("path");
const fs = require("fs");

const createProperty = async (req, res) => {
  try {
    // console.log(req.body); // Body has the property fields (except images)
    // console.log(req.files); // Files contain the uploaded images
    // console.log(req.user)
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
    res.status(500).json({ success: false, error: "Could not fetch vendor's property in server"});
  }
}

const updateProperty = async (req, res) => {
  try {
    const propertyID = req.params.id
  
    // Find existing property
    const existingProperty = await Property.findById(propertyID);
    if (!existingProperty) {
      res.status(404).json({ message: "Property not found" });
    }

    const newImagePaths = req.files.map(file => file.path); // Get uploaded images' paths
    
    // Handle removed images
    let updatedImagePaths = existingProperty.images;
    if (req.body.removedImages) {
      const removedImages = req.body.removedImages; 
      updatedImagePaths = updatedImagePaths.filter(image => !removedImages.includes(image)); // Remove images that should be deleted

      // Delete removed images from the server
      removedImages.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath); // Ensure correct path
        console.log("fullpath:", fullPath);
        if (fs.existsSync(fullPath)) {
          fs.unlink(fullPath, err => {
            if (err) console.error(`Error deleting ${fullPath}:`, err);
          });
        }
      });
    }

    // Append new image paths (if any) to existing ones 
    if (newImagePaths) {
      updatedImagePaths = [...updatedImagePaths, ...newImagePaths];
    }
    
    // Parse amenities and availability from JSON string to object
    const amenities = JSON.parse(req.body.amenities);
    const availability = JSON.parse(req.body.availability);

    // Update property
    const updatedProperty = await Property.findByIdAndUpdate(
      propertyID,
      {
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
        images: updatedImagePaths, // Save updated image paths in MongoDB
    }, 
    {new: true},
  );

    res.status(200).json({ message: "Property Updated" /*, property: updatedProperty*/ });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  };
}

const deleteProperty = async (req, res) => {
  try {
    const propertyID = req.params.id;
    const property = await Property.findById(propertyID);

    if (!property) {
      res.status(404).json({ message: "Property not found" });
    }

    // Delete images from the server
    property.images.forEach(imagePath => {
      const fullPath = path.join(__dirname, '..', imagePath); // Ensure correct path
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, err => {
          if (err) console.error(`Error deleting ${fullPath}:`, err);
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
    res.status(500).json({ success: false, error: error})
  }
}


module.exports = {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
};