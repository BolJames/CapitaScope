import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

// ✅ Register user
export const register = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validate input
        if (!email || !password || !role) {
            return res.status(400).json({ error: 'All fields required' });
        }

        // Check if user exists
        const existing = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, role)
             VALUES ($1, $2, $3)
             RETURNING id, email, role`,
            [email, hashedPassword, role]
        );

        const user = result.rows[0];

        // Auto-create investor/startup profile
        if (role === 'investor') {
            await pool.query(
                `INSERT INTO investors (user_id, name)
                 VALUES ($1, $2)`,
                [user.id, email.split('@')[0]] // Use part of email as default name
            );
        } else if (role === 'startup') {
            await pool.query(
                `INSERT INTO startups (user_id, name)
                 VALUES ($1, $2)`,
                [user.id, email.split('@')[0]] // Use part of email as default name
            );
        }

        // Generate JWT
        const token = jwt.sign(user, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });

        res.status(201).json({ user, token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ Get profile
export const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [req.user.id]
        );

        res.json(result.rows[0]);

    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};