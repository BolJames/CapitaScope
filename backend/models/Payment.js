import pool from '../config/database.js';

class Payment {
    static async create(userId, subscriptionId, amount, currency, paymentMethod, transactionId, status = 'pending') {
        const query = `
            INSERT INTO payments (user_id, subscription_id, amount, currency, payment_method, transaction_id, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `;
        const values = [userId, subscriptionId, amount, currency, paymentMethod, transactionId, status];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findByUserId(userId) {
        const query = 'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC';
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    static async updateStatus(transactionId, status) {
        const query = 'UPDATE payments SET status = $1 WHERE transaction_id = $2';
        await pool.query(query, [status, transactionId]);
    }
}

export default Payment;