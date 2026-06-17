import pool from '../config/database.js';

class User {
    // Find user by email
    static async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }

    // Find by ID
    static async findById(id) {
        const result = await pool.query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }
}

export default User;