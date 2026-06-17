import pool from '../config/database.js';

/**
 * PAYMENT MODEL
 * Handles payment transactions and gateway integration
 */

class PaymentModel {
    /**
     * Create a payment record
     */
    static async create(subscriptionId, userId, amount, currency, paymentMethod, paymentGateway, status = 'pending', metadata = {}) {
        try {
            const result = await pool.query(
                `INSERT INTO payments (subscription_id, user_id, amount, currency, payment_method, payment_gateway, status, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [subscriptionId, userId, amount, currency, paymentMethod, paymentGateway, status, JSON.stringify(metadata)]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error creating payment:', err);
            throw err;
        }
    }

    /**
     * Get payment by ID
     */
    static async getById(paymentId) {
        try {
            const result = await pool.query(
                `SELECT * FROM payments WHERE id = $1`,
                [paymentId]
            );
            const payment = result.rows[0];
            if (payment && typeof payment.metadata === 'string') {
                payment.metadata = JSON.parse(payment.metadata);
            }
            return payment || null;
        } catch (err) {
            console.error('Error fetching payment:', err);
            throw err;
        }
    }

    /**
     * Get all payments for user
     */
    static async getByUserId(userId) {
        try {
            const result = await pool.query(
                `SELECT * FROM payments 
                 WHERE user_id = $1 
                 ORDER BY created_at DESC`,
                [userId]
            );
            return result.rows.map(p => ({
                ...p,
                metadata: typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata
            }));
        } catch (err) {
            console.error('Error fetching payments:', err);
            throw err;
        }
    }

    /**
     * Update payment status
     */
    static async updateStatus(paymentId, status, metadata = {}) {
        try {
            const result = await pool.query(
                `UPDATE payments 
                 SET status = $1, 
                     metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3
                 RETURNING *`,
                [status, JSON.stringify(metadata), paymentId]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error updating payment:', err);
            throw err;
        }
    }

    /**
     * Get payment statistics
     */
    static async getStats() {
        try {
            const result = await pool.query(
                `SELECT 
                    COUNT(*) as total_transactions,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_payments,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
                    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
                    AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_transaction_value
                 FROM payments`
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error fetching payment stats:', err);
            throw err;
        }
    }

    /**
     * Find payment by transaction ID (from gateway)
     */
    static async getByTransactionId(transactionId) {
        try {
            const result = await pool.query(
                `SELECT * FROM payments 
                 WHERE metadata->>'transaction_id' = $1`,
                [transactionId]
            );
            return result.rows[0] || null;
        } catch (err) {
            console.error('Error fetching payment by transaction ID:', err);
            throw err;
        }
    }

    /**
     * Get failed payments (for retry logic)
     */
    static async getFailedPayments() {
        try {
            const result = await pool.query(
                `SELECT * FROM payments 
                 WHERE status = 'failed' 
                 AND created_at > NOW() - INTERVAL '7 days'
                 ORDER BY created_at DESC`
            );
            return result.rows;
        } catch (err) {
            console.error('Error fetching failed payments:', err);
            throw err;
        }
    }
}

export default PaymentModel;
