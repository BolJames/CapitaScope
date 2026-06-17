import pool from '../config/database.js';

class MeetingRequest {
    // Create a new meeting request
    static async create(investorId, startupId, message = null) {
        const result = await pool.query(
            `INSERT INTO meeting_requests (investor_id, startup_id, message)
             VALUES ($1, $2, $3) RETURNING *`,
            [investorId, startupId, message]
        );
        return result.rows[0];
    }

    // Get all pending requests for admin
    static async findAllPending() {
        const result = await pool.query(`
            SELECT mr.*, i.name as investor_name, s.name as startup_name, u.email as investor_email
            FROM meeting_requests mr
            JOIN investors i ON mr.investor_id = i.id
            JOIN startups s ON mr.startup_id = s.id
            JOIN users u ON i.user_id = u.id
            WHERE mr.status = 'pending'
            ORDER BY mr.created_at DESC
        `);
        return result.rows;
    }

    // Get all requests (for admin)
    static async findAll() {
        const result = await pool.query(`
            SELECT mr.*, i.name as investor_name, s.name as startup_name, u.email as investor_email
            FROM meeting_requests mr
            JOIN investors i ON mr.investor_id = i.id
            JOIN startups s ON mr.startup_id = s.id
            JOIN users u ON i.user_id = u.id
            ORDER BY mr.created_at DESC
        `);
        return result.rows;
    }

    // Find by ID
    static async findById(id) {
        const result = await pool.query('SELECT * FROM meeting_requests WHERE id = $1', [id]);
        return result.rows[0];
    }

    // Update status
    static async updateStatus(id, status) {
        const result = await pool.query(
            'UPDATE meeting_requests SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    }

    // Get requests by investor
    static async findByInvestor(investorId) {
        const result = await pool.query(`
            SELECT mr.*, s.name as startup_name
            FROM meeting_requests mr
            JOIN startups s ON mr.startup_id = s.id
            WHERE mr.investor_id = $1
            ORDER BY mr.created_at DESC
        `, [investorId]);
        return result.rows;
    }
}

export default MeetingRequest;