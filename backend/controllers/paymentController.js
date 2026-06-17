import PaymentModel from '../models/PaymentModel.js';
import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';
import Coupon from '../models/Coupon.js';
import { getPricing } from './subscriptionController.js';

/**
 * PAYMENT CONTROLLER - STRIPE & PAYPAL INTEGRATION
 * Handles payment processing and subscription transactions
 */

// ============================================
// PAYMENT PROCESSING
// ============================================

/**
 * POST /api/payments/checkout
 * Create a checkout session for payment
 */
export const createCheckoutSession = async (req, res) => {
    try {
        const { plan, currency, paymentMethod, couponCode } = req.body;
        const userId = req.user.id;

        // Validate inputs
        if (!['monthly', 'yearly'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        if (!['card', 'paypal', 'mpesa', 'bank'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        // Get plan pricing
        const basePrice = getPricing(plan, currency);
        if (!basePrice && plan !== 'free') {
            return res.status(400).json({ error: 'Invalid plan or currency' });
        }

        // Apply coupon if provided
        let finalPrice = basePrice;
        let discount = 0;
        let couponData = null;

        if (couponCode) {
            const { valid, coupon, error } = await Coupon.validate(couponCode);
            if (!valid) {
                return res.status(400).json({ error });
            }
            couponData = coupon;
            const { discount: discountAmount, finalPrice: discountedPrice } = Coupon.calculateDiscount(basePrice, coupon);
            discount = discountAmount;
            finalPrice = discountedPrice;
        }

        // Create payment record
        const payment = await PaymentModel.create(
            null, // subscription_id (will be set after payment)
            userId,
            finalPrice,
            currency,
            paymentMethod,
            'pending', // gateway will be set based on method
            'pending',
            {
                plan,
                basePrice,
                discount,
                couponCode,
                sessionCreatedAt: new Date().toISOString()
            }
        );

        // Build checkout data based on payment method
        let checkoutData = {
            paymentId: payment.id,
            amount: finalPrice,
            currency,
            plan,
            coupon: couponData ? {
                code: couponData.code,
                discountType: couponData.discount_type,
                discountValue: couponData.discount_value,
                savingsAmount: discount
            } : null,
            paymentMethod
        };

        // Add gateway-specific data
        if (paymentMethod === 'card') {
            checkoutData.gateway = 'stripe';
            checkoutData.publicKey = process.env.STRIPE_PUBLIC_KEY;
        } else if (paymentMethod === 'paypal') {
            checkoutData.gateway = 'paypal';
            checkoutData.clientId = process.env.PAYPAL_CLIENT_ID;
        }

        res.json({
            message: 'Checkout session created',
            checkout: checkoutData
        });
    } catch (err) {
        console.error('Error creating checkout session:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * POST /api/payments/process
 * Process payment through gateway
 */
export const processPayment = async (req, res) => {
    try {
        const { paymentId, paymentMethodId, paymentGateway } = req.body;
        const userId = req.user.id;

        // Get payment record
        const payment = await PaymentModel.getById(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Process through gateway (simplified for demo)
        let gatewayResponse;
        if (paymentGateway === 'stripe') {
            gatewayResponse = await processStripePayment(payment, paymentMethodId);
        } else if (paymentGateway === 'paypal') {
            gatewayResponse = await processPayPalPayment(payment, paymentMethodId);
        } else {
            return res.status(400).json({ error: 'Invalid payment gateway' });
        }

        if (!gatewayResponse.success) {
            // Update payment status to failed
            await PaymentModel.updateStatus(paymentId, 'failed', {
                error: gatewayResponse.error,
                gatewayResponse: gatewayResponse.details
            });

            return res.status(400).json({
                error: 'Payment failed',
                details: gatewayResponse.error
            });
        }

        // Update payment status to completed
        const updatedPayment = await PaymentModel.updateStatus(paymentId, 'completed', {
            transaction_id: gatewayResponse.transactionId,
            gateway: paymentGateway,
            processedAt: new Date().toISOString()
        });

        // Create subscription
        const subscriptionPlan = payment.metadata.plan;
        const subscription = await Subscription.create(
            userId,
            subscriptionPlan,
            payment.amount,
            payment.currency
        );

        // Apply coupon to subscription if used
        if (payment.metadata.couponCode) {
            await Coupon.apply(payment.metadata.couponCode);
        }

        // Create invoice
        const invoice = await Invoice.create(
            subscription.id,
            userId,
            payment.amount,
            payment.currency,
            'paid',
            `Subscription payment for ${subscriptionPlan} plan`
        );

        res.json({
            message: 'Payment processed successfully',
            payment: updatedPayment,
            subscription,
            invoice
        });
    } catch (err) {
        console.error('Error processing payment:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Stripe payment processing (simplified)
 */
async function processStripePayment(payment, paymentMethodId) {
    try {
        // In production, use Stripe SDK
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        // Simulated response
        return {
            success: Math.random() > 0.05, // 95% success rate for demo
            transactionId: `pi_${Date.now()}`,
            details: {
                amount: payment.amount,
                currency: payment.currency,
                status: 'succeeded'
            }
        };
    } catch (err) {
        return {
            success: false,
            error: 'Stripe processing failed',
            details: err.message
        };
    }
}

/**
 * PayPal payment processing (simplified)
 */
async function processPayPalPayment(payment, paymentMethodId) {
    try {
        // In production, use PayPal SDK
        // Simulated response
        return {
            success: Math.random() > 0.05, // 95% success rate for demo
            transactionId: `pp_${Date.now()}`,
            details: {
                amount: payment.amount,
                currency: payment.currency,
                status: 'completed'
            }
        };
    } catch (err) {
        return {
            success: false,
            error: 'PayPal processing failed',
            details: err.message
        };
    }
}

/**
 * GET /api/payments/history
 * Get user's payment history
 */
export const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const payments = await PaymentModel.getByUserId(userId);
        res.json(payments);
    } catch (err) {
        console.error('Error fetching payment history:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * GET /api/payments/stats (Admin)
 * Get payment statistics
 */
export const getPaymentStats = async (req, res) => {
    try {
        const stats = await PaymentModel.getStats();
        res.json(stats);
    } catch (err) {
        console.error('Error fetching payment stats:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================
// COUPON MANAGEMENT
// ============================================

/**
 * POST /api/coupons/validate
 * Validate a coupon code
 */
export const validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Coupon code required' });
        }

        const { valid, coupon, error } = await Coupon.validate(code);

        if (!valid) {
            return res.status(400).json({ error });
        }

        res.json({
            message: 'Coupon is valid',
            coupon: {
                code: coupon.code,
                discountType: coupon.discount_type,
                discountValue: coupon.discount_value,
                description: coupon.description
            }
        });
    } catch (err) {
        console.error('Error validating coupon:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * POST /api/coupons (Admin)
 * Create a new coupon
 */
export const createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, maxUses, validUntil, description } = req.body;

        if (!code || !discountType || !discountValue || !validUntil) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const coupon = await Coupon.create(code, discountType, discountValue, maxUses, validUntil, description);

        res.status(201).json({
            message: 'Coupon created successfully',
            coupon
        });
    } catch (err) {
        console.error('Error creating coupon:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * GET /api/coupons (Admin)
 * Get all coupons
 */
export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.getAll();
        res.json(coupons);
    } catch (err) {
        console.error('Error fetching coupons:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * DELETE /api/coupons/:code (Admin)
 * Deactivate a coupon
 */
export const deactivateCoupon = async (req, res) => {
    try {
        const { code } = req.params;
        const coupon = await Coupon.deactivate(code);

        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        res.json({
            message: 'Coupon deactivated',
            coupon
        });
    } catch (err) {
        console.error('Error deactivating coupon:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================
// INVOICE MANAGEMENT
// ============================================

/**
 * GET /api/invoices
 * Get user's invoices
 */
export const getUserInvoices = async (req, res) => {
    try {
        const userId = req.user.id;
        const invoices = await Invoice.getByUserId(userId);
        res.json(invoices);
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * GET /api/invoices/:id
 * Get single invoice
 */
export const getInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.getById(id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Check ownership
        if (invoice.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json(invoice);
    } catch (err) {
        console.error('Error fetching invoice:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * GET /api/invoices/admin/all (Admin)
 * Get all invoices
 */
export const getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.getAll();
        res.json(invoices);
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 * Note: getPricing is imported from subscriptionController.js
 * to ensure consistent pricing across the platform
 */