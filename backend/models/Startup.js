import pool from '../config/database.js';

class Startup {
    // Create startup
    static async create(userId, data) {
        const { name, industry } = data;

        const result = await pool.query(
            `INSERT INTO startups (user_id, name, industry)
             VALUES ($1, $2, $3) RETURNING *`,
            [userId, name, industry]
        );

        return result.rows[0];
    }

    // Find by user
    static async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM startups WHERE user_id = $1',
            [userId]
        );

        return result.rows[0];
    }
}

export default Startup;