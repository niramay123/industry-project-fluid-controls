// controllers/notification.controllers.js
import { Notification } from "../models/notification.models.js";
import { getUserSockets } from "../utils/socketManager.js"; // ✔ IMPORTED
import mongoose from "mongoose";

/**
 * Internal helper to create a notification and emit socket event
 * NOT a route handler (no req, res)
 */
export const createNotification = async (userId, message, taskId = null) => {
  try {
    // ✔ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error(`❌ Invalid UserId passed to notification: ${userId}`);
      return;
    }

    const notification = await Notification.create({
      userId,
      message,
      taskId
    });

    // ✔ Emit to all connected sockets of that user
    // Convert userId to string for Map lookup if necessary, though strict typing usually prefers matching types
    const userSockets = getUserSockets(userId.toString());

    if (global.io && userSockets.length > 0) {
      userSockets.forEach((socketId) => {
        global.io.to(socketId).emit("notification", notification);
      });
    }

    return notification;

  } catch (error) {
    console.error("❌ Error creating notification:", error);
  }
};

// Fetch all notifications for logged-in user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ timestamp: -1 });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Mark all notifications for the logged-in user as read
export const markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false }, // Mongoose auto-casts req.user.id if valid
      { $set: { read: true } }
    );

    res.status(200).json({ message: "All notifications marked as read.", count: result.modifiedCount });
  } catch (err) {
    console.error("❌ Error marking all read:", err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
};

// Clear all notifications for the logged-in user
export const clearAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user.id
    });

    res.status(200).json({ message: "All notifications cleared.", count: result.deletedCount });
  } catch (err) {
    console.error("❌ Error clearing all notifications:", err);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
};