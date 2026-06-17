import pool from '../config/database.js';

class Meeting {
    // Create meeting (admin schedules after approval)
    static async create(investorId, startupId, scheduledAt, notes = null, meetingLink = null) {
        // Validate scheduled_at is provided
        if (!scheduledAt) {
            throw new Error('Meeting date and time (scheduled_at) is required');
        }

        // Convert string to ISO format if needed
        let timestamp = scheduledAt;
        if (typeof scheduledAt === 'string') {
            // Try to parse the input format (YYYY-MM-DD HH:MM or similar)
            const parsed = new Date(scheduledAt);
            if (isNaN(parsed.getTime())) {
                throw new Error('Invalid date format. Use YYYY-MM-DD HH:MM or ISO format');
            }
            timestamp = parsed.toISOString();
        }

        const result = await pool.query(
            `INSERT INTO meetings (investor_id, startup_id, scheduled_at, status, notes, meeting_link)
             VALUES ($1, $2, $3, 'scheduled', $4, $5) RETURNING *`,
            [investorId, startupId, timestamp, notes, meetingLink]
        );
        return result.rows[0];
    }

    // Get all meetings (for admin)
    static async findAll() {
        const result = await pool.query(`
            SELECT m.*, i.name as investor_name, s.name as startup_name, u.email as investor_email
            FROM meetings m
            JOIN investors i ON m.investor_id = i.id
            JOIN startups s ON m.startup_id = s.id
            JOIN users u ON i.user_id = u.id
            ORDER BY m.created_at DESC
        `);

        return result.rows;
    }

    // Get meetings by investor
    static async findByInvestor(id) {
        const result = await pool.query(`
            SELECT m.*, s.name as startup_name
            FROM meetings m
            JOIN startups s ON m.startup_id = s.id
            WHERE m.investor_id = $1
            ORDER BY m.created_at DESC
        `, [id]);

        return result.rows;
    }

    // Get meetings by startup
    static async findByStartup(id) {
        const result = await pool.query(`
            SELECT m.*, i.name as investor_name
            FROM meetings m
            JOIN investors i ON m.investor_id = i.id
            WHERE m.startup_id = $1
            ORDER BY m.created_at DESC
        `, [id]);

        return result.rows;
    }

    // Update meeting status and details
    static async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (updates.scheduled_at !== undefined) {
            fields.push(`scheduled_at = $${paramCount++}`);
            values.push(updates.scheduled_at);
        }
        if (updates.status !== undefined) {
            fields.push(`status = $${paramCount++}`);
            values.push(updates.status);
        }
        if (updates.notes !== undefined) {
            fields.push(`notes = $${paramCount++}`);
            values.push(updates.notes);
        }
        if (updates.meeting_link !== undefined) {
            fields.push(`meeting_link = $${paramCount++}`);
            values.push(updates.meeting_link);
        }

        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE meetings SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Find by ID
    static async findById(id) {
        const result = await pool.query('SELECT * FROM meetings WHERE id = $1', [id]);
        return result.rows[0];
    }
}

export default Meeting;