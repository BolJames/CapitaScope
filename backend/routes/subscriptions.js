import express from 'express';
import {
    getUserSubscription,
    getPlans,
    createSubscription,
    upgradeSubscription,
    cancelSubscription,
    getAllSubscriptions,
    getSubscriptionStats,
    filterSubscriptions,
    getExpiredSubscriptions
} from '../controllers/subscriptionController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

/**
 * ✅ USER ENDPOINTS (Requires authentication)
 */

// 📋 Get user's current subscription
router.get('/', authenticateToken, authorizeRoles('startup'), getUserSubscription);

// 📋 Get available plans with pricing
router.get('/plans', getPlans);

// ✅ Create or upgrade subscription
router.post('/', authenticateToken, authorizeRoles('startup'), createSubscription);

// 🔄 Upgrade to a better plan
router.put('/upgrade', authenticateToken, authorizeRoles('startup'), upgradeSubscription);

// ❌ Cancel subscription
router.delete('/', authenticateToken, authorizeRoles('startup'), cancelSubscription);

/**
 * 🔐 ADMIN ENDPOINTS (Requires admin role)
 */

// 📊 Get all subscriptions
router.get('/admin/all', authenticateToken, authorizeRoles('admin'), getAllSubscriptions);

// 📊 Get subscription statistics
router.get('/admin/stats', authenticateToken, authorizeRoles('admin'), getSubscriptionStats);

// 🔍 Filter subscriptions
router.get('/admin/filter', authenticateToken, authorizeRoles('admin'), filterSubscriptions);

// ⚠️ Get expired subscriptions
router.get('/admin/expired', authenticateToken, authorizeRoles('admin'), getExpiredSubscriptions);

export default router;
