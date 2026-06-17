// Admin controller handles platform-wide operations

import pool from '../config/database.js';

// Get all users
export const getUsers = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, role, created_at, is_active FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching users' });
    }
};

// Activate/Deactivate user
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        await pool.query(
            'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [is_active, id]
        );

        res.json({ message: 'User status updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating user' });
    }
};

// Get all startups
export const getStartups = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM startups ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching startups' });
    }
};

// Get all investors
export const getInvestors = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM investors ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching investors' });
    }
};

// Get all meetings
export const getMeetings = async (req, res) => {
    try {
        const Meeting = (await import('../models/Meeting.js')).default;
        const meetings = await Meeting.findAll();
        res.json(meetings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching meetings' });
    }
};

// Create match (meeting)
export const createMatch = async (req, res) => {
    const { investor_id, startup_id, scheduled_at } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO meetings (investor_id, startup_id, scheduled_at)
             VALUES ($1, $2, $3) RETURNING *`,
            [investor_id, startup_id, scheduled_at]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating match' });
    }
};

// Analytics
export const getAnalytics = async (req, res) => {
    try {
        const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
        const startupsResult = await pool.query('SELECT COUNT(*) as total FROM startups');
        const investorsResult = await pool.query('SELECT COUNT(*) as total FROM investors');
        const meetingsResult = await pool.query('SELECT COUNT(*) as total FROM meetings');

        const totalUsers = parseInt(usersResult.rows[0].total);
        const totalStartups = parseInt(startupsResult.rows[0].total);
        const totalInvestors = parseInt(investorsResult.rows[0].total);
        const totalMeetings = parseInt(meetingsResult.rows[0].total);

        res.json({
            totalUsers,
            totalStartups,
            totalInvestors,
            totalMeetings
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching analytics' });
    }
};