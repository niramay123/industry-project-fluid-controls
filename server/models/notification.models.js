// models/notification.models.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

export const Notification = mongoose.model('Notification', notificationSchema);