import pool from '../config/database.js';

/**
 * INVOICE MODEL
 * Handles subscription invoice generation and history
 */

class Invoice {
    /**
     * Create a new invoice
     */
    static async create(subscriptionId, userId, amount, currency, status = 'paid', description = '') {
        try {
            const invoiceNumber = `INV-${Date.now()}`;
            const result = await pool.query(
                `INSERT INTO invoices (subscription_id, user_id, invoice_number, amount, currency, status, description)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [subscriptionId, userId, invoiceNumber, amount, currency, status, description]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error creating invoice:', err);
            throw err;
        }
    }

    /**
     * Get invoice by ID
     */
    static async getById(invoiceId) {
        try {
            const result = await pool.query(
                `SELECT * FROM invoices WHERE id = $1`,
                [invoiceId]
            );
            return result.rows[0] || null;
        } catch (err) {
            console.error('Error fetching invoice:', err);
            throw err;
        }
    }

    /**
     * Get all invoices for user
     */
    static async getByUserId(userId) {
        try {
            const result = await pool.query(
                `SELECT * FROM invoices 
                 WHERE user_id = $1 
                 ORDER BY created_at DESC`,
                [userId]
            );
            return result.rows;
        } catch (err) {
            console.error('Error fetching invoices:', err);
            throw err;
        }
    }

    /**
     * Get all invoices (admin)
     */
    static async getAll() {
        try {
            const result = await pool.query(
                `SELECT i.*, u.email, s.plan 
                 FROM invoices i
                 JOIN users u ON i.user_id = u.id
                 LEFT JOIN subscriptions s ON i.subscription_id = s.id
                 ORDER BY i.created_at DESC`
            );
            return result.rows;
        } catch (err) {
            console.error('Error fetching invoices:', err);
            throw err;
        }
    }

    /**
     * Update invoice status
     */
    static async updateStatus(invoiceId, status) {
        try {
            const result = await pool.query(
                `UPDATE invoices 
                 SET status = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2
                 RETURNING *`,
                [status, invoiceId]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error updating invoice status:', err);
            throw err;
        }
    }

    /**
     * Get invoice statistics
     */
    static async getStats() {
        try {
            const result = await pool.query(
                `SELECT 
                    COUNT(*) as total_invoices,
                    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_invoices,
                    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue,
                    AVG(CASE WHEN status = 'paid' THEN amount ELSE NULL END) as avg_invoice_value
                 FROM invoices`
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error fetching invoice stats:', err);
            throw err;
        }
    }

    /**
     * Send invoice to user email (requires email service)
     */
    static async sendToEmail(invoiceId, userEmail) {
        try {
            // This will be called by email service
            const invoice = await this.getById(invoiceId);
            if (!invoice) throw new Error('Invoice not found');
            return { invoiceId, userEmail, status: 'scheduled' };
        } catch (err) {
            console.error('Error sending invoice:', err);
            throw err;
        }
    }
}

export default Invoice;
