const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // References the User model
      required: true,
      index: true  // Add index for faster lookups
    },
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  address: { type: String, required: true },
  price: { type: Number, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  squareFeet: { type: String },
  maxGuests: { type: Number, required: true },
  amenities: {
    wifi: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    breakfast: { type: Boolean, default: false },
    airConditioning: { type: Boolean, default: false },
    heating: { type: Boolean, default: false },
    tv: { type: Boolean, default: false },
    kitchen: { type: Boolean, default: false },
    workspace: { type: Boolean, default: false },
  },
  availability: {
    startDate: { type: Date },
    endDate: { type: Date },
  },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  images: [{ type: String }], // Array of image file paths
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  status: { type: String, enum: ['available', 'booked', 'unavailable'], default: 'available' }, 

}, { timestamps: true });

PropertySchema.pre('save', function (next) {
  if (this.reviews.length > 0) {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.averageRating = total / this.reviews.length;
    this.reviewCount = this.reviews.length;
  } else {
    this.averageRating = 0;
    this.reviewCount = 0;
  }
  next();
})

module.exports = mongoose.model('Property', PropertySchema);
