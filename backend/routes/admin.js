import express from 'express';
import {
    getUsers,
    updateUserStatus,
    getStartups,
    getInvestors,
    getMeetings,
    createMatch,
    getAnalytics
} from '../controllers/adminController.js';

import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Apply admin protection globally
router.use(authenticateToken, authorizeRoles('admin'));

router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/startups', getStartups);
router.get('/investors', getInvestors);
router.get('/meetings', getMeetings);
router.post('/matches', createMatch);
router.get('/analytics', getAnalytics);

export default router;