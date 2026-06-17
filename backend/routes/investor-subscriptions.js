import express from 'express';
import {
    getInvestorSubscription,
    getInvestorPlans,
    subscribeInvestor,
    upgradeInvestorSubscription,
    cancelInvestorSubscription
} from '../controllers/investorController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

/**
 * ✅ INVESTOR SUBSCRIPTION ROUTES
 */

// 📋 Get investor's subscription
router.get('/', authenticateToken, authorizeRoles('investor'), getInvestorSubscription);

// 📋 Get investor plans
router.get('/plans', getInvestorPlans);

// ✅ Subscribe to plan
router.post('/subscribe', authenticateToken, authorizeRoles('investor'), subscribeInvestor);

// 🔄 Upgrade plan
router.put('/upgrade', authenticateToken, authorizeRoles('investor'), upgradeInvestorSubscription);

// ❌ Cancel subscription
router.delete('/', authenticateToken, authorizeRoles('investor'), cancelInvestorSubscription);

export default router;
