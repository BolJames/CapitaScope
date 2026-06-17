import express from 'express';
import { createStartup, getStartup, updateStartup, getAllStartups, getMeetings } from '../controllers/startupController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRoles('startup'), createStartup);
router.get('/profile', authenticateToken, authorizeRoles('startup'), getStartup);
router.put('/profile', authenticateToken, authorizeRoles('startup'), updateStartup);
router.get('/', authenticateToken, getAllStartups); // Investors and admins can view
router.get('/meetings', authenticateToken, authorizeRoles('startup'), getMeetings);

export default router;