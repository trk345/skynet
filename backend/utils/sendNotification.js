const { User } = require('../models/userSchemas');

const sendNotification = async (ownerId, message, type = 'info') => {
    try {
      if (!message || message.trim().length === 0) {
        throw new Error('Notification message cannot be empty.');
      }
  
      const trimmedMessage = message.trim().slice(0, 500); // Match schema max length
  
      const updatedUser = await User.findByIdAndUpdate(
        ownerId,
        {
          $push: {
            notifications: {
              message: trimmedMessage,
              type
              // no need for createdAt — handled by schema timestamps
            }
          }
        },
        { new: true } // optional: returns the updated doc if needed
      );
  
      if (!updatedUser) {
        console.warn(`User ${ownerId} not found.`);
      }
    } catch (err) {
      console.error(`Failed to send notification to user ${ownerId}:`, err.message);
    }
  };
  

module.exports = sendNotification;
