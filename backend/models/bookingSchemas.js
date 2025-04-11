// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'confirmed' }, // Status of the booking: confirmed, canceled, etc.
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = { Booking };