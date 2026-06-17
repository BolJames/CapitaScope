import express from 'express';
import { createInvestor, getInvestor, updateInvestor, getAllInvestors, scheduleMeeting, getMeetings, getStartups } from '../controllers/investorController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRoles('investor'), createInvestor);
router.get('/profile', authenticateToken, authorizeRoles('investor'), getInvestor);
router.put('/profile', authenticateToken, authorizeRoles('investor'), updateInvestor);
router.get('/', authenticateToken, authorizeRoles('admin'), getAllInvestors);
router.post('/meetings', authenticateToken, authorizeRoles('investor'), scheduleMeeting);
router.get('/meetings', authenticateToken, authorizeRoles('investor'), getMeetings);
router.get('/startups', authenticateToken, authorizeRoles('investor'), getStartups);

export default router;