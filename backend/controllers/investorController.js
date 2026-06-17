import pool from '../config/database.js';

// ✅ Create investor profile
export const createInvestor = async (req, res) => {
    try {
        const { name, budget } = req.body;

        const result = await pool.query(
            `INSERT INTO investors (user_id, name, budget)
             VALUES ($1, $2, $3) RETURNING *`,
            [req.user.id, name, budget]
        );

        res.status(201).json(result.rows[0]);
    } catch {
        res.status(500).json({ error: 'Error creating investor' });
    }
};

// ✅ Get investor profile
export const getInvestor = async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM investors WHERE user_id = $1',
        [req.user.id]
    );

    res.json(result.rows[0]);
};

// ✅ Update investor
export const updateInvestor = async (req, res) => {
    const { name, budget } = req.body;

    const result = await pool.query(
        `UPDATE investors SET name=$1, budget=$2 
         WHERE user_id=$3 RETURNING *`,
        [name, budget, req.user.id]
    );

    res.json(result.rows[0]);
};

// ✅ 🔥 FIX: Add this (missing function)
export const getAllInvestors = async (req, res) => {
    const result = await pool.query('SELECT * FROM investors');
    res.json(result.rows);
};

// ✅ Schedule meeting
export const scheduleMeeting = async (req, res) => {
    const { startupId, scheduledAt } = req.body;

    // Get investor id
    const investor = await pool.query(
        'SELECT id FROM investors WHERE user_id = $1',
        [req.user.id]
    );

    const investorId = investor.rows[0]?.id;

    const result = await pool.query(
        `INSERT INTO meetings (investor_id, startup_id, scheduled_at)
         VALUES ($1, $2, $3) RETURNING *`,
        [investorId, startupId, scheduledAt]
    );

    res.status(201).json(result.rows[0]);
};

// ✅ Get meetings
export const getMeetings = async (req, res) => {
    const investor = await pool.query(
        'SELECT id FROM investors WHERE user_id = $1',
        [req.user.id]
    );

    const investorId = investor.rows[0]?.id;

    const result = await pool.query(
        'SELECT * FROM meetings WHERE investor_id = $1',
        [investorId]
    );

    res.json(result.rows);
};

// ✅ Get startups (for investors)
export const getStartups = async (req, res) => {
    const result = await pool.query('SELECT * FROM startups');
    res.json(result.rows);
};

// ============================================
// INVESTOR SUBSCRIPTIONS
// ============================================

/**
 * 📋 GET /api/investors/subscriptions
 * Get investor's subscription
 */
export const getInvestorSubscription = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT s.* FROM subscriptions s
             JOIN users u ON s.user_id = u.id
             WHERE s.user_id = $1 AND u.role = 'investor'
             AND s.is_active = true
             ORDER BY s.created_at DESC
             LIMIT 1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({
                plan: 'free',
                isActive: true,
                message: 'You are on the Free investor plan'
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching investor subscription:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * 📋 GET /api/investors/subscription-plans
 * Get investor subscription plans
 */
export const getInvestorPlans = async (req, res) => {
    try {
        const country = req.query.country || 'US';
        const currency = detectInvestorCurrency(country);

        const plans = {
            currency,
            country,
            plans: [
                {
                    id: 'free',
                    name: 'Free Investor Plan',
                    price: 0,
                    currency,
                    billingCycle: 'Forever',
                    description: 'Browse and connect with startups',
                    features: [
                        'Browse 50 startups/month',
                        'Basic startup profiles',
                        'Limited messaging',
                        'Email support',
                        'Standard analytics'
                    ],
                    badge: null,
                    recommended: false
                },
                {
                    id: 'monthly',
                    name: 'Pro Investor',
                    price: 49.99,
                    currency: currency === 'USD' ? 'USD' : currency,
                    billingCycle: '30 days',
                    description: 'Premium access and advanced tools',
                    features: [
                        'Unlimited startup browsing',
                        'Advanced filtering & search',
                        'Priority messaging',
                        'Deal alerts & notifications',
                        'Advanced analytics dashboard',
                        'Premium support (Phone & Chat)',
                        'Custom watchlists',
                        'Export functionality'
                    ],
                    badge: 'Most Popular',
                    recommended: true
                },
                {
                    id: 'yearly',
                    name: 'VIP Investor',
                    price: 499.99,
                    currency: currency === 'USD' ? 'USD' : currency,
                    billingCycle: '365 days',
                    description: 'White-glove service for serious investors',
                    features: [
                        'Everything in Pro +',
                        'Dedicated account manager',
                        'Personalized startup recommendations',
                        'Priority deal access',
                        '24/7 VIP support',
                        'API access',
                        'Custom integrations',
                        'Quarterly strategy sessions',
                        'Networking events access',
                        'Co-investment opportunities'
                    ],
                    badge: 'Save 17%',
                    recommended: false,
                    savings: 100
                }
            ]
        };

        res.json(plans);
    } catch (err) {
        console.error('Error fetching investor plans:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * POST /api/investors/subscribe
 * Subscribe investor to a plan
 */
export const subscribeInvestor = async (req, res) => {
    try {
        const { plan, currency } = req.body;
        const userId = req.user.id;

        if (!['free', 'monthly', 'yearly'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        // Check if already subscribed
        const existing = await pool.query(
            `SELECT * FROM subscriptions 
             WHERE user_id = $1 AND is_active = true`,
            [userId]
        );

        if (existing.rows.length > 0 && existing.rows[0].plan === plan) {
            return res.status(400).json({
                error: `Already subscribed to ${plan} plan`
            });
        }

        const price = getInvestorPrice(plan, currency);

        // Create subscription
        const result = await pool.query(
            `INSERT INTO subscriptions (user_id, plan, price, currency, start_date, end_date, is_active, auto_renew)
             VALUES ($1, $2, $3, $4, CURRENT_DATE, 
                     CURRENT_DATE + (CASE WHEN $2 = 'monthly' THEN INTERVAL '30 days' 
                                          WHEN $2 = 'yearly' THEN INTERVAL '365 days'
                                          ELSE NULL END),
                     true, true)
             RETURNING *`,
            [userId, plan, price, currency]
        );

        res.status(201).json({
            message: `Successfully subscribed to ${plan} plan`,
            subscription: result.rows[0]
        });
    } catch (err) {
        console.error('Error subscribing investor:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * PUT /api/investors/upgrade-subscription
 * Upgrade investor subscription
 */
export const upgradeInvestorSubscription = async (req, res) => {
    try {
        const { newPlan, currency } = req.body;
        const userId = req.user.id;

        if (!['monthly', 'yearly'].includes(newPlan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        const currentSub = await pool.query(
            `SELECT * FROM subscriptions 
             WHERE user_id = $1 AND is_active = true`,
            [userId]
        );

        if (currentSub.rows.length === 0) {
            return res.status(400).json({ error: 'No active subscription' });
        }

        const price = getInvestorPrice(newPlan, currency);

        const result = await pool.query(
            `UPDATE subscriptions 
             SET plan = $1, price = $2, currency = $3,
                 end_date = CURRENT_DATE + (CASE WHEN $1 = 'monthly' THEN INTERVAL '30 days'
                                                  WHEN $1 = 'yearly' THEN INTERVAL '365 days'
                                                  ELSE NULL END),
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $4 AND is_active = true
             RETURNING *`,
            [newPlan, price, currency, userId]
        );

        res.json({
            message: `Successfully upgraded to ${newPlan} plan`,
            subscription: result.rows[0]
        });
    } catch (err) {
        console.error('Error upgrading investor subscription:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * DELETE /api/investors/subscription
 * Cancel investor subscription
 */
export const cancelInvestorSubscription = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `UPDATE subscriptions 
             SET is_active = false, end_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND is_active = true
             RETURNING *`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'No active subscription to cancel' });
        }

        res.json({
            message: 'Subscription cancelled successfully',
            subscription: result.rows[0]
        });
    } catch (err) {
        console.error('Error cancelling investor subscription:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Helper function: Detect investor currency
 */
function detectInvestorCurrency(country) {
    const COUNTRY_CURRENCY_MAP = {
        'US': 'USD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR',
        'JP': 'JPY', 'IN': 'INR', 'AU': 'AUD', 'CA': 'CAD'
    };
    return COUNTRY_CURRENCY_MAP[country] || 'USD';
}

/**
 * Helper function: Get investor plan price
 */
function getInvestorPrice(plan, currency) {
    const INVESTOR_PRICES = {
        free: 0,
        monthly: { USD: 49.99, EUR: 44.99, GBP: 39.99, JPY: 5500, INR: 4199, AUD: 74.99, CAD: 64.99 },
        yearly: { USD: 499.99, EUR: 449.99, GBP: 399.99, JPY: 55000, INR: 41999, AUD: 749.99, CAD: 649.99 }
    };
    
    if (plan === 'free') return 0;
    return INVESTOR_PRICES[plan]?.[currency] || INVESTOR_PRICES[plan]?.['USD'] || 0;
}