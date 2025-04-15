// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // <-- Add this
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'confirmed' },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = { Booking };