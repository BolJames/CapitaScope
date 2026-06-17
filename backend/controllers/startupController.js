import pool from '../config/database.js';

// ✅ Create startup
export const createStartup = async (req, res) => {
    const { name, description, industry, funding_needed, location, website } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO startups (user_id, name, description, industry, funding_needed, location, website)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [req.user.id, name, description, industry, funding_needed, location, website]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ Get user's startup
export const getStartup = async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM startups WHERE user_id = $1',
        [req.user.id]
    );

    res.json(result.rows[0]);
};

// ✅ Update startup
export const updateStartup = async (req, res) => {
    const { name, description, industry, funding_needed, location, website } = req.body;

    try {
        const result = await pool.query(
            `UPDATE startups SET name=$1, description=$2, industry=$3, funding_needed=$4, location=$5, website=$6, updated_at=CURRENT_TIMESTAMP
             WHERE user_id=$7 RETURNING *`,
            [name, description, industry, funding_needed, location, website, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Startup not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ 🔥 ADD THIS (Missing function)
export const getAllStartups = async (req, res) => {
    const result = await pool.query('SELECT * FROM startups');
    res.json(result.rows);
};

// ✅ 🔥 ADD THIS (Missing function)
export const getMeetings = async (req, res) => {
    try {
        const Startup = (await import('../models/Startup.js')).default;
        const startup = await Startup.findByUserId(req.user.id);

        if (!startup) {
            return res.status(404).json({ error: 'Startup profile not found' });
        }

        const Meeting = (await import('../models/Meeting.js')).default;
        const meetings = await Meeting.findByStartup(startup.id);
        res.json(meetings);
    } catch (error) {
        console.error('Error fetching startup meetings:', error);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
};