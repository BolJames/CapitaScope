import express from 'express';
import Meeting from '../models/Meeting.js';
import Investor from '../models/Investor.js';
import Startup from '../models/Startup.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get meetings for investor (only scheduled/approved meetings)
router.get('/investor', authenticateToken, authorizeRoles('investor'), async (req, res) => {
    try {
        const user = req.user;
        let investor = await Investor.findByUserId(user.id);

        // If profile doesn't exist, create one
        if (!investor) {
            investor = await Investor.create(user.id, {
                name: user.email.split('@')[0],
                budget: 0
            });
        }

        const meetings = await Meeting.findByInvestor(investor.id);
        res.json(meetings);
    } catch (error) {
        console.error('Error fetching investor meetings:', error);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
});

// Get meetings for startup (only scheduled/approved meetings)
router.get('/startup', authenticateToken, authorizeRoles('startup'), async (req, res) => {
    try {
        const user = req.user;
        let startup = await Startup.findByUserId(user.id);

        // If profile doesn't exist, create one
        if (!startup) {
            startup = await Startup.create(user.id, {
                name: user.email.split('@')[0]
            });
        }

        const meetings = await Meeting.findByStartup(startup.id);
        res.json(meetings);
    } catch (error) {
        console.error('Error fetching startup meetings:', error);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
});

// Get all meetings (admin) - only scheduled meetings
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const meetings = await Meeting.findAll();
        res.json(meetings);
    } catch (error) {
        console.error('Error fetching all meetings:', error);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
});

// Update meeting status (admin)
router.put('/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, meeting_link } = req.body;

        const meeting = await Meeting.update(id, { status, notes, meeting_link });

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        res.json(meeting);
    } catch (error) {
        console.error('Error updating meeting status:', error);
        res.status(500).json({ error: 'Failed to update meeting' });
    }
});
router.put('/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const meeting = await Meeting.update(id, { status, notes });

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        res.json(meeting);
    } catch (error) {
        console.error('Error updating meeting status:', error);
        res.status(500).json({ error: 'Failed to update meeting' });
    }
});

export default router;
