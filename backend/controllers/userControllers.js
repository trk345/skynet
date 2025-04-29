const { User } = require('../models/userSchemas');
const { VendorRequest } = require('../models/vendorRequestSchemas');
const { Booking } = require('../models/bookingSchemas');
const { Property } = require('../models/propertySchemas'); 
const sendNotification = require('../utils/sendNotification'); 
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Middleware to verify JWT and extract userId
function verifyUser(req, res) {
    try {
        const token = req.cookies.token;
        if (!token) throw new Error("Unauthorized");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.userId;
    } catch (error) {
        console.error("JWT verification error:", error);
        throw new Error("Unauthorized");
    }
}

// Secure route: Post Vendor Requests
const postVendorRequest = async (req, res) => {
    const session = await mongoose.startSession(); // Start transaction session
    session.startTransaction();
    
    try {
        const userId = verifyUser(req, res);
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error("Unauthorized");
        }
        const requesterID = userId;
        const { firstName, lastName, email, mobile, message } = req.body;
  
        if (!firstName || !lastName || !email || !mobile || !message) {
            return res.status(400).json({ error: "All fields (firstName, lastName, email, mobile, message) are required" });
        }
  
        // Update user's pending status
        await User.findByIdAndUpdate(requesterID, { pendingStatus: "pending" }, { session });
  
        // Save vendor request
        const newRequest = new VendorRequest({ 
          requesterID, 
          firstName, 
          lastName, 
          email, 
          mobile, 
          message 
        });
        await newRequest.save({ session }); // Ensure transaction consistency
  
        await session.commitTransaction();
        res.status(201).json({ message: "Message saved successfully!", data: newRequest });
  
    } catch (error) {
        await session.abortTransaction(); // Rollback on error
        console.error("Error saving request", error);
        if (error.message === "Unauthorized") {
            return res.status(401).json({ error: "Unauthorized" });
        }

        return res.status(500).json({ error: "Internal Server Error" });
    } finally {
        session.endSession(); // Clean up session
    }
  };

  
const getUnreadNotifCount = async (req, res) => {
    try {
        const userId = verifyUser(req, res);
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const unreadCount = user.notifications.filter(n => !n.read).length;
        res.json({ unreadCount });
    } catch (error) {
        console.error(error);  // Log the error to help with debugging
        res.status(500).json({ error: 'Server error' });
    }
};


// Get all notifications
const getNotifs = async (req, res) => {
    try {
      const userId = verifyUser(req, res);
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      // Sort notifications by createdAt in descending order to show newest first
      const sortedNotifications = user.notifications.sort((a, b) => b.createdAt - a.createdAt);
  
      res.json(sortedNotifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);  
        res.status(500).json({ error: 'Server error when fetching notifications' });
    }
  };
  

// Mark notifications as read
const putReadNotifs = async (req, res) => {
    try {
        const userId = verifyUser(req, res);
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.notifications.forEach(n => (n.read = true));
        await user.save();

        res.json({ success: true });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).json({ error: 'Server error when marking notifications as read' });
    }
};

// Route to handle booking
const bookProperty = async (req, res) => {
    const userId = verifyUser(req, res);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { propertyId, checkIn, checkOut, guests, totalAmount } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        return res.status(400).json({ message: 'Invalid Property ID' });
      }

    try {
        // 1. Validate required fields
        if (!checkIn || !checkOut || !guests) {
            return res.status(400).json({ message: "Please provide all the required details." });
        }

        // 2. Convert to Date objects
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // normalize to start of day

        // 3. Prevent past bookings
        if (checkInDate < today) {
            return res.status(400).json({ message: "Check-in date cannot be in the past." });
        }

        // 4. Validate date order
        if (checkInDate >= checkOutDate) {
            return res.status(400).json({ message: "Check-out date must be after check-in date." });
        }

        // 5. Fetch the property
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: "Property not found." });
        }

        // ❌ Prevent owner from booking their own property
        if (property.userID.toString() === userId) {
            return res.status(403).json({ message: "You cannot book your own property." });
        }

        // 6. Validate guest limit
        if (guests > property.maxGuests) {
            return res.status(400).json({ message: `This property can accommodate a maximum of ${property.maxGuests} guests.` });
        }

        // 7. Availability window check
        if (
            (property.availability?.startDate && checkInDate < new Date(property.availability.startDate).setHours(0, 0, 0, 0)) || //normalize to midnight to match with DatePicker time
            (property.availability?.endDate && checkOutDate > new Date(property.availability.endDate).setHours(0, 0, 0, 0))
        ) {
            return res.status(400).json({ message: "Booking is outside the property's availability range." });
        }

        // 8. Check for date overlap
        const overlaps = property.bookedDates?.some(({ checkIn, checkOut }) => {
            const existingCheckIn = new Date(checkIn);
            const existingCheckOut = new Date(checkOut);
            return checkInDate < existingCheckOut && checkOutDate > existingCheckIn;
        });

        if (overlaps) {
            return res.status(400).json({ message: "This property is already booked for the selected dates.(Overlap)" });
        }

        // 9. Create the booking (Include userId here)
        const newBooking = new Booking({
            userId,  // Add userId to the booking
            propertyId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests,
            totalAmount,
        });

        await newBooking.save();

        // 10. Push booking range to property.bookedDates
        property.bookedDates.push({
            checkIn: checkInDate,
            checkOut: checkOutDate,
            userId: userId,
            _id: newBooking._id  // 🔥 This is the key link
        });
        // OPTIONAL: If you use status per booking, keep this line. Otherwise, skip it.
        // property.status = 'booked'; 

        await property.save();

        // Update user's booking history
        const user = await User.findById(userId);
        if (user) {
            user.bookings.push({
                property: property._id,
                startdate: checkInDate,
                enddate: checkOutDate,
                _id: newBooking._id  // 🔥 Store it here too
            });
            await user.save();
        }

        // 🔔 Send notification to property owner with username included
        await sendNotification(
            property.userID,
            `${user.username} has booked your property from ${checkInDate.toDateString()} to ${checkOutDate.toDateString()}.`,
            'booking'
        );

        // 11. Success response
        return res.status(201).json({
            success: true,
            message: "Booking successful!",
            totalAmount,
        });

    } catch (error) {
        console.error("Booking error:", error);
        return res.status(500).json({ message: "An error occurred while processing the booking." });
    }
};


const postReview = async (req, res) => {
    const userId = verifyUser(req, res);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
  
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
  
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
  
    const alreadyReviewed = property.reviews.some(
      (review) => review.userId.toString() === userId
    );
    if (alreadyReviewed) {
      return res.status(400).json({ error: 'You have already reviewed this property' });
    }
  
    const { rating, comment } = req.body;
  
    property.reviews.push({
      userId,
      username: user.username,
      rating,
      comment,
    });
  
    await property.save(); // The hook will handle rating calculations
    // ie rating calculation handled in propertySchemas.js

    // Update user's review history
    user.reviewsGiven.push({
        property: property._id,
        rating,
        comment,
    });

    await user.save();

    // Send notification to the property owner
    await sendNotification(
        property.userID,
        `${user.username} has reviewed your property with a rating of ${rating} and commented: "${comment}"`,
        'review'
      );
    
    res.status(200).json({ message: 'Review added' });
  };

const deleteBooking = async (req, res) => {
    const userId = verifyUser(req, res);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const bookingId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ message: 'Invalid booking ID' });
    }

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const property = await Property.findById(booking.propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Check if this user actually booked it
        const wasBookedByUser = property.bookedDates.some(
            (date) => date._id.toString() === bookingId && date.userId.toString() === userId
        );

        if (!wasBookedByUser) {
            return res.status(403).json({ message: "You can only cancel your own bookings." });
        }

        // 1. Delete from Booking collection
        await Booking.findByIdAndDelete(bookingId);

        // 2. Remove from property's bookedDates
        property.bookedDates = property.bookedDates.filter(
            (date) => date._id.toString() !== bookingId
        );
        await property.save();

        // 3. Remove from user's booking history
        const user = await User.findById(userId);
        user.bookings = user.bookings.filter(
            (b) => b._id.toString() !== bookingId
        );
        await user.save();

        // Send notification to property owner about the canceled booking
        await sendNotification(
            property.userID,
            `${user.username} has canceled their booking for your property from ${booking.checkIn.toDateString()} to ${booking.checkOut.toDateString()}.`,
            'cancellation'
        );

        return res.status(200).json({ success: true, message: 'Booking canceled successfully.' });

    } catch (err) {
        console.error("Delete Booking Error:", err);
        return res.status(500).json({ message: 'Server error while canceling booking.' });
    }
};

const getBookings = async (req, res) => {
    try {
        const userId = verifyUser(req, res);
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const bookings = await Booking.find({ userId: userId }).populate("propertyId");
        if (!bookings) return res.status(404).json({ message: "No bookings found" });
        res.status(200).json({ success: true, data: bookings});
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ success: false, message: "Could not fetch bookings in server" });
    }
}

module.exports = {
    putReadNotifs,
    getNotifs,
    getUnreadNotifCount, 
    postVendorRequest,
    bookProperty,
    postReview,
    deleteBooking,
    getBookings,
};