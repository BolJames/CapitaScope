import express from 'express';
import {
    createCheckoutSession,
    processPayment,
    getPaymentHistory,
    getPaymentStats,
    validateCoupon,
    createCoupon,
    getAllCoupons,
    deactivateCoupon,
    getUserInvoices,
    getInvoice,
    getAllInvoices
} from '../controllers/paymentController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

/**
 * ============================================
 * PAYMENT ENDPOINTS
 * ============================================
 */

// 💳 Create checkout session
router.post('/checkout', authenticateToken, createCheckoutSession);

// 💳 Process payment through gateway
router.post('/process', authenticateToken, processPayment);

// 📊 Get payment history
router.get('/history', authenticateToken, getPaymentHistory);

// 📊 Get payment statistics (Admin)
router.get('/stats', authenticateToken, authorizeRoles('admin'), getPaymentStats);

/**
 * ============================================
 * COUPON ENDPOINTS
 * ============================================
 */

// ✅ Validate coupon code
router.post('/coupons/validate', validateCoupon);

// ✅ Create coupon (Admin)
router.post('/coupons', authenticateToken, authorizeRoles('admin'), createCoupon);

// ✅ Get all coupons (Admin)
router.get('/coupons', authenticateToken, authorizeRoles('admin'), getAllCoupons);

// ✅ Deactivate coupon (Admin)
router.delete('/coupons/:code', authenticateToken, authorizeRoles('admin'), deactivateCoupon);

/**
 * ============================================
 * INVOICE ENDPOINTS
 * ============================================
 */

// 📄 Get user invoices
router.get('/invoices', authenticateToken, getUserInvoices);

// 📄 Get single invoice
router.get('/invoices/:id', authenticateToken, getInvoice);

// 📄 Get all invoices (Admin)
router.get('/invoices/admin/all', authenticateToken, authorizeRoles('admin'), getAllInvoices);

export default router;