const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // <-- Add this
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true, min: [1, 'At least one guest required'] },
    totalAmount: { type: Number, required: true, min: [0, 'Total amount cannot be negative'] },
    status: { type: String, default: 'confirmed' },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = { Booking };