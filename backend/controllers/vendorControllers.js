const { User } = require("../models/userSchemas");
const Property = require("../models/propertySchemas");

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


module.exports = {
  createProperty,
};