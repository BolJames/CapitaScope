import pool from '../config/database.js';

/**
 * Subscription Model (FIXED)
 */
class Subscription {

    /**
     * Create a new subscription
     */
    static async create(userId, plan, billingCycle, price, currency = 'USD') {

        const startDate = new Date().toISOString().split('T')[0];
        let endDate = null;

        // ✅ FIX: Use billingCycle instead of plan
        if (billingCycle === 'monthly') {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            endDate = date.toISOString().split('T')[0];
        } else if (billingCycle === 'yearly') {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            endDate = date.toISOString().split('T')[0];
        }

        const result = await pool.query(
            `INSERT INTO subscriptions 
            (user_id, plan, billing_cycle, price, currency, start_date, end_date, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
            RETURNING *`,
            [userId, plan, billingCycle, price, currency, startDate, endDate]
        );

        return result.rows[0];
    }

    /**
     * Get active subscription
     */
    static async getActiveByUserId(userId) {
        const result = await pool.query(
            `SELECT * FROM subscriptions 
             WHERE user_id = $1 AND is_active = TRUE
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        return result.rows[0] || null;
    }

    /**
     * Get all subscriptions for user
     */
    static async getAllByUserId(userId) {
        const result = await pool.query(
            `SELECT * FROM subscriptions 
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        return result.rows;
    }

    /**
     * Get all subscriptions (admin)
     */
    static async getAll() {
        const result = await pool.query(
            `SELECT s.*, u.email, u.role 
             FROM subscriptions s
             JOIN users u ON s.user_id = u.id
             ORDER BY s.created_at DESC`
        );

        return result.rows;
    }

    /**
     * Cancel subscription
     */
    static async cancelByUserId(userId) {
        const result = await pool.query(
            `UPDATE subscriptions 
             SET is_active = FALSE, end_date = CURRENT_DATE
             WHERE user_id = $1 AND is_active = TRUE
             RETURNING *`,
            [userId]
        );

        return result.rows[0] || null;
    }

    /**
     * Upgrade / Change plan (FIXED)
     */
    static async updatePlan(userId, newPlan, billingCycle, price, currency) {

        // Deactivate old
        await pool.query(
            `UPDATE subscriptions 
             SET is_active = FALSE 
             WHERE user_id = $1 AND is_active = TRUE`,
            [userId]
        );

        // Create new
        return this.create(userId, newPlan, billingCycle, price, currency);
    }

    /**
     * Statistics (FIXED)
     */
    static async getStatistics() {
        const result = await pool.query(
            `SELECT 
                COUNT(*) FILTER (WHERE is_active = TRUE) as active_subscriptions,
                COUNT(*) FILTER (WHERE plan = 'free') as free_subscribers,
                COUNT(*) FILTER (WHERE plan = 'basic') as basic_subscribers,
                COUNT(*) FILTER (WHERE plan = 'premium') as premium_subscribers,
                COALESCE(SUM(price) FILTER (WHERE is_active = TRUE AND plan != 'free'), 0) as total_mrr,
                COALESCE(AVG(price) FILTER (WHERE is_active = TRUE AND plan != 'free'), 0) as avg_price
             FROM subscriptions`
        );

        return result.rows[0];
    }

    /**
     * Expired subscriptions
     */
    static async getExpired() {
        const result = await pool.query(
            `SELECT s.*, u.email 
             FROM subscriptions s
             JOIN users u ON s.user_id = u.id
             WHERE is_active = TRUE AND end_date < CURRENT_DATE`
        );

        return result.rows;
    }

    /**
     * Filter subscriptions
     */
    static async filter(filters = {}) {
        let query = `SELECT s.*, u.email 
                     FROM subscriptions s
                     JOIN users u ON s.user_id = u.id
                     WHERE 1=1`;
        const params = [];

        if (filters.plan) {
            query += ` AND s.plan = $${params.length + 1}`;
            params.push(filters.plan);
        }

        if (filters.billingCycle) {
            query += ` AND s.billing_cycle = $${params.length + 1}`;
            params.push(filters.billingCycle);
        }

        if (filters.isActive !== undefined) {
            query += ` AND s.is_active = $${params.length + 1}`;
            params.push(filters.isActive);
        }

        if (filters.currency) {
            query += ` AND s.currency = $${params.length + 1}`;
            params.push(filters.currency);
        }

        query += ` ORDER BY s.created_at DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Backward compatibility
     */
    static async findByUserId(userId) {
        return this.getAllByUserId(userId);
    }

    static async deactivate(userId) {
        return this.cancelByUserId(userId);
    }
}

export default Subscription;