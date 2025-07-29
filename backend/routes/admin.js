// routes/adminRoutes.js
import express from 'express';
import { getUserLogs } from '../controllers/adminController.js';

const router = express.Router();

// Route to get all user logs
router.get('/user-logs', getUserLogs);

// Add other admin routes here later (e.g., for managing movies, users, posts)

export default router;