const { User } = require('../models/userSchemas');
const { VendorRequest } = require("../models/vendorRequestSchemas");
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");


const getUsers = async (req, res) => {
  try {
    const page = Number.isInteger(Number(req.query.page)) ? Number(req.query.page) : 1;
    const limit = Number.isInteger(Number(req.query.limit)) ? Number(req.query.limit) : 10;
    const skip = Math.max(0, (page - 1) * limit); // Ensure skip is non-negative

    const allowedRoles = ["admin", "vendor", "user"];
    let filter = {};

    if (req.query.role && allowedRoles.includes(req.query.role.toString())) {
      filter.role = req.query.role.toString(); // Ensure role is a string
    }

    const users = await User.find(filter)
      .select("username email role lastLogin")
      .sort({ lastLogin: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() to return plain JavaScript objects (better performance)

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};



const getVendorRequests = async (req, res) => {
  try {
    const requests = await VendorRequest.find().populate("requesterID", "username email role"); // Find all vendor requests and populate the requesterID field with corr. requester details
    
    res.status(200).json({ success: true, data: requests }); // ✅ Standardized Response
  } catch (error) {
    console.error("Error fetching vendor requests:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" }); // ✅ Consistent Error Format
  }
};

// const getVendorRequests = async (req, res) => {
//   try {
//     const requests = await User.find({ requests: { $exists: true, $ne: [] } })
//       .select("requests")
//       .populate("requests.requesterID", "username email role"); // Populate requester details

//     res.status(200).json(requests);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch requests", details: error.message });
//   }
// };


// // Secure route: Post Vendor Requests
// const postVendorRequest = async (req, res) => {
//   const session = await mongoose.startSession(); // Start transaction session
//   session.startTransaction();
  
//   try {
//       const requesterID = req.user.userId; // Extract user ID from authenticated token
//       const { firstName, lastName, email, mobile, message } = req.body;

//       if (!firstName || !lastName || !email || !mobile || !message) {
//           return res.status(400).json({ error: "Message is required" });
//       }

//       // Update user's pending status
//       await User.findByIdAndUpdate(requesterID, { pendingStatus: "pending" }, { session });

//       // Save vendor request
//       const newRequest = new VendorRequest({ 
//         requesterID, 
//         firstName, 
//         lastName, 
//         email, 
//         mobile, 
//         message 
//       });
//       await newRequest.save({ session }); // Ensure transaction consistency

//       await session.commitTransaction();
//       res.status(201).json({ message: "Message saved successfully!", data: newRequest });

//   } catch (error) {
//       await session.abortTransaction(); // Rollback on error
//       console.error("Error saving request", error);
//       res.status(500).json({ error: "Internal Server Error" });
//   } finally {
//       session.endSession(); // Clean up session
//   }
// };



const updateVendorRequest = async (req, res) => {
  const { requestId, action } = req.body;
  const adminUser = req.user; // Get logged-in user from JWT middleware
  let session;

  // 🛑 Validate request ID
  if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }

  // 🛑 Ensure the user is an admin
  if (!adminUser || adminUser.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized: Admin access required" });
  }

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    // 🔍 Find vendor request
    const request = await VendorRequest.findById(requestId).session(session).exec();
    if (!request) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Request not found" });
    }

    const userId = request.requesterID;
    let updateFields = { pendingStatus: "not_pending" };

    if (action === "approve") {
      updateFields.role = "Vendor";
      updateFields.$push = { notifications: { message: "Your vendor request has been approved! 🎉", read: false } };
    } else if (action === "reject") {
      updateFields.$push = { notifications: { message: "Your vendor request has been rejected. ❌", read: false } };
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid action" });
    }

    // 🏗️ Update user role & notifications
    const userUpdate = await User.findByIdAndUpdate(userId, updateFields, { session, new: true }).exec();
    if (!userUpdate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    // 🗑️ Delete vendor request after processing
    await VendorRequest.findByIdAndDelete(requestId).session(session).exec();
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "Request processed, user updated, and notification saved" });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("❌ Error updating request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getUsers,
  // postVendorRequest,
  getVendorRequests,
  updateVendorRequest,
};