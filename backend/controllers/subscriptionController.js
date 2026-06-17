import Subscription from '../models/Subscription.js';

/**
 * SUBSCRIPTION CONTROLLER
 */

// ============================================
// PRICING CONFIG (FIXED)
// ============================================

const SUBSCRIPTION_PRICES = {
    free: {
        monthly: { USD: 0 }
    },
    basic: {
        monthly: {
            USD: 29.99,
            INR: 2499
        },
        yearly: {
            USD: 299.99,
            INR: 24999
        }
    },
    premium: {
        monthly: {
            USD: 59.99,
            INR: 4999
        },
        yearly: {
            USD: 599.99,
            INR: 49999
        }
    }
};

// ============================================
// CURRENCY DETECTION (UNCHANGED)
// ============================================

const COUNTRY_CURRENCY_MAP = {
    'US': 'USD',
    'IN': 'INR',
};

export const detectCurrency = (country) => {
    if (!country) return 'USD';
    return COUNTRY_CURRENCY_MAP[country.toUpperCase()] || 'USD';
};

// ============================================
// FIXED PRICING FUNCTION
// ============================================

export const getPricing = (plan, billingCycle, currency) => {
    if (plan === 'free') return 0;

    return (
        SUBSCRIPTION_PRICES[plan]?.[billingCycle]?.[currency] ||
        SUBSCRIPTION_PRICES[plan]?.[billingCycle]?.['USD'] ||
        0
    );
};

// ============================================
// CREATE SUBSCRIPTION (FIXED)
// ============================================

export const createSubscription = async (req, res) => {
    try {
        const { plan, billingCycle, currency } = req.body;
        const userId = req.user.id;

        // ✅ VALIDATION (FIXED)
        if (!['free', 'basic', 'premium'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        if (!['monthly', 'yearly'].includes(billingCycle)) {
            return res.status(400).json({ error: 'Invalid billing cycle' });
        }

        if (!currency) {
            return res.status(400).json({ error: 'Currency is required' });
        }

        // Check existing subscription
        const existingSubscription = await Subscription.getActiveByUserId(userId);

        if (
            existingSubscription &&
            existingSubscription.plan === plan &&
            existingSubscription.billing_cycle === billingCycle
        ) {
            return res.status(400).json({
                error: `Already subscribed to ${plan} (${billingCycle})`
            });
        }

        const price = getPricing(plan, billingCycle, currency);

        let subscription;

        if (existingSubscription) {
            // UPDATE
            subscription = await Subscription.updatePlan(
                userId,
                plan,
                billingCycle,
                price,
                currency
            );
        } else {
            // CREATE
            subscription = await Subscription.create(
                userId,
                plan,
                billingCycle,
                price,
                currency
            );
        }

        res.status(201).json({
            message: `Subscribed to ${plan} (${billingCycle})`,
            subscription
        });

    } catch (err) {
        console.error('❌ Error creating subscription:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================
// UPGRADE SUBSCRIPTION (FIXED)
// ============================================

export const upgradeSubscription = async (req, res) => {
    try {
        const { newPlan, billingCycle, currency } = req.body;
        const userId = req.user.id;

        if (!['basic', 'premium'].includes(newPlan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        const current = await Subscription.getActiveByUserId(userId);

        if (!current) {
            const price = getPricing(newPlan, billingCycle, currency);

            const subscription = await Subscription.create(
                userId,
                newPlan,
                billingCycle,
                price,
                currency
            );

            return res.json({
                message: `Upgraded to ${newPlan}`,
                subscription
            });
        }

        const planHierarchy = { free: 0, basic: 1, premium: 2 };

        if (planHierarchy[newPlan] <= planHierarchy[current.plan]) {
            return res.status(400).json({
                error: 'Not a valid upgrade'
            });
        }

        const price = getPricing(newPlan, billingCycle, currency);

        const subscription = await Subscription.updatePlan(
            userId,
            newPlan,
            billingCycle,
            price,
            currency
        );

        res.json({
            message: `Upgraded to ${newPlan}`,
            subscription
        });

    } catch (err) {
        console.error('❌ Error upgrading subscription:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================
// GET USER SUBSCRIPTION
// ============================================

export const getUserSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const subscription = await Subscription.getActiveByUserId(userId);

        if (!subscription) {
            return res.json({
                message: 'No active subscription',
                subscription: null
            });
        }

        res.json({
            subscription
        });

    } catch (err) {
        console.error('❌ Error fetching user subscription:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================
// GET PLANS
// ============================================

export const getPlans = (req, res) => {
    try {
        const plans = [
            {
                name: 'free',
                features: ['Basic profile', 'Limited matches'],
                prices: SUBSCRIPTION_PRICES.free
            },
            {
                name: 'basic',
                features: ['Enhanced profile', 'Unlimited matches', 'Analytics'],
                prices: SUBSCRIPTION_PRICES.basic
            },
            {
                name: 'premium',
                features: ['Priority support', 'Advanced analytics', 'Direct messaging', 'Unlimited connections'],
                prices: SUBSCRIPTION_PRICES.premium
            }
        ];

        res.json({ plans });

    } catch (err) {
        console.error('❌ Error fetching plans:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================
// CANCEL SUBSCRIPTION
// ============================================

export const cancelSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const subscription = await Subscription.cancelByUserId(userId);

        if (!subscription) {
            return res.status(404).json({
                error: 'No active subscription to cancel'
            });
        }

        res.json({
            message: 'Subscription cancelled successfully',
            subscription
        });

    } catch (err) {
        console.error('❌ Error cancelling subscription:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================
// GET ALL SUBSCRIPTIONS (ADMIN)
// ============================================

export const getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.getAll();
        res.json({
            count: subscriptions.length,
            subscriptions
        });

    } catch (err) {
        console.error('❌ Error fetching all subscriptions:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================
// GET SUBSCRIPTION STATS (ADMIN)
// ============================================

export const getSubscriptionStats = async (req, res) => {
    try {
        const subscriptions = await Subscription.getAll();
        
        const stats = {
            totalSubscriptions: subscriptions.length,
            activeSubscriptions: subscriptions.filter(s => s.is_active).length,
            cancelledSubscriptions: subscriptions.filter(s => !s.is_active).length,
            byPlan: {
                free: subscriptions.filter(s => s.plan === 'free').length,
                basic: subscriptions.filter(s => s.plan === 'basic').length,
                premium: subscriptions.filter(s => s.plan === 'premium').length
            },
            revenue: {
                monthly: subscriptions
                    .filter(s => s.is_active && s.billing_cycle === 'monthly')
                    .reduce((sum, s) => sum + (s.price || 0), 0),
                yearly: subscriptions
                    .filter(s => s.is_active && s.billing_cycle === 'yearly')
                    .reduce((sum, s) => sum + (s.price || 0), 0)
            }
        };

        res.json({ stats });

    } catch (err) {
        console.error('❌ Error fetching subscription stats:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================
// FILTER SUBSCRIPTIONS (ADMIN)
// ============================================

export const filterSubscriptions = async (req, res) => {
    try {
        const { plan, billingCycle, isActive, currency } = req.query;
        let subscriptions = await Subscription.getAll();

        if (plan) {
            subscriptions = subscriptions.filter(s => s.plan === plan);
        }

        if (billingCycle) {
            subscriptions = subscriptions.filter(s => s.billing_cycle === billingCycle);
        }

        if (isActive !== undefined) {
            subscriptions = subscriptions.filter(s => s.is_active === (isActive === 'true'));
        }

        if (currency) {
            subscriptions = subscriptions.filter(s => s.currency === currency);
        }

        res.json({
            count: subscriptions.length,
            subscriptions
        });

    } catch (err) {
        console.error('❌ Error filtering subscriptions:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================
// GET EXPIRED SUBSCRIPTIONS (ADMIN)
// ============================================

export const getExpiredSubscriptions = async (req, res) => {
    try {
        const allSubscriptions = await Subscription.getAll();
        const today = new Date().toISOString().split('T')[0];
        
        const expiredSubscriptions = allSubscriptions.filter(s => {
            return s.end_date && s.end_date < today && s.is_active;
        });

        res.json({
            count: expiredSubscriptions.length,
            subscriptions: expiredSubscriptions
        });

    } catch (err) {
        console.error('❌ Error fetching expired subscriptions:', err);
        res.status(500).json({ error: 'Server error' });
    }
};