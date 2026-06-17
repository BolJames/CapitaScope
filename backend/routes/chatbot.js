import express from 'express';
import { chat } from '../controllers/chatbotController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Protect chatbot (costly API)
router.use(authenticateToken);

// Chat endpoint
router.post('/', chat);

export default router;