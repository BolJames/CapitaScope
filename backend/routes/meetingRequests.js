import express from 'express';
import MeetingRequest from '../models/MeetingRequest.js';
import Meeting from '../models/Meeting.js';
import Investor from '../models/Investor.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Create meeting request (investor)
router.post('/', authenticateToken, authorizeRoles('investor'), async (req, res) => {
    try {
        const { startup_id, message } = req.body;
        const user = req.user;

        // Get investor ID from user
        let investor = await Investor.findByUserId(user.id);
        
        // If profile doesn't exist, create one
        if (!investor) {
            investor = await Investor.create(user.id, {
                name: user.email.split('@')[0],
                budget: 0
            });
        }

        const meetingRequest = await MeetingRequest.create(investor.id, startup_id, message);
        res.status(201).json(meetingRequest);
    } catch (error) {
        console.error('Error creating meeting request:', error);
        res.status(500).json({ error: 'Failed to create meeting request' });
    }
});

// Get all meeting requests (admin)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const requests = await MeetingRequest.findAll();
        res.json(requests);
    } catch (error) {
        console.error('Error fetching meeting requests:', error);
        res.status(500).json({ error: 'Failed to fetch meeting requests' });
    }
});

// Approve meeting request (admin)
router.put('/:id/approve', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduled_at, notes, meeting_link } = req.body;

        // Validate required field
        if (!scheduled_at) {
            return res.status(400).json({ error: 'Meeting date and time (scheduled_at) is required' });
        }

        // Update request status to approved
        const updatedRequest = await MeetingRequest.updateStatus(id, 'approved');
        if (!updatedRequest) {
            return res.status(404).json({ error: 'Meeting request not found' });
        }

        // Create the actual meeting
        try {
            const meeting = await Meeting.create(
                updatedRequest.investor_id,
                updatedRequest.startup_id,
                scheduled_at,
                notes,
                meeting_link
            );
            res.json({ request: updatedRequest, meeting });
        } catch (meetingError) {
            // If meeting creation fails, revert the status update
            await MeetingRequest.updateStatus(id, 'pending');
            console.error('Error creating meeting:', meetingError);
            throw meetingError;
        }
    } catch (error) {
        console.error('Error approving meeting request:', error);
        res.status(500).json({ 
            error: 'Failed to approve meeting request',
            details: error.message
        });
    }
});

// Reject meeting request (admin)
router.put('/:id/reject', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const updatedRequest = await MeetingRequest.updateStatus(id, 'rejected');
        if (!updatedRequest) {
            return res.status(404).json({ error: 'Meeting request not found' });
        }

        res.json(updatedRequest);
    } catch (error) {
        console.error('Error rejecting meeting request:', error);
        res.status(500).json({ error: 'Failed to reject meeting request' });
    }
});

// Get meeting requests by investor
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

        const requests = await MeetingRequest.findByInvestor(investor.id);
        res.json(requests);
    } catch (error) {
        console.error('Error fetching investor meeting requests:', error);
        res.status(500).json({ error: 'Failed to fetch meeting requests' });
    }
});

export default router;