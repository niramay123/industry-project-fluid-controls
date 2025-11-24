// notification.routes.js

import express from 'express';
import { getNotifications, markAllRead, clearAllNotifications } from '../controllers/notification.controllers.js';
import { isAuth } from '../middlewares/isAuth.middlewares.js'; // ❌ Removed isOperator

const router = express.Router();

// Protected route to fetch notifications
// ✅ Allow ANY authenticated user (Manager, Operator, Admin) to see their notifications
router.get('/', isAuth, getNotifications);

// Protected route to mark all notifications as read
router.put('/mark-all-read', isAuth, markAllRead);

// Protected route to delete all notifications
router.delete('/', isAuth, clearAllNotifications);

export default router;