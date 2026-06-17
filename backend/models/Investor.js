import pool from '../config/database.js';

class Investor {
    // Create investor profile
    static async create(userId, data) {
        const { name, budget } = data;

        const result = await pool.query(
            `INSERT INTO investors (user_id, name, budget)
             VALUES ($1, $2, $3) RETURNING *`,
            [userId, name, budget]
        );

        return result.rows[0];
    }

    // Find by user
    static async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM investors WHERE user_id = $1',
            [userId]
        );
        return result.rows[0];
    }
}

export default Investor;