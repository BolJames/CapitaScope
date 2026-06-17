import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import 'dotenv/config';

// Routes
import meetingRoutes from './routes/meetings.js';
import meetingRequestRoutes from './routes/meetingRequests.js';
import authRoutes from './routes/auth.js';
import startupRoutes from './routes/startups.js';
import investorRoutes from './routes/investors.js';
import investorSubscriptionsRoutes from './routes/investor-subscriptions.js';
import adminRoutes from './routes/admin.js';
import chatbotRoutes from './routes/chatbot.js';
import subscriptionRoutes from './routes/subscriptions.js';
import paymentRoutes from './routes/payments.js';

// Services
import SubscriptionRenewalService from './services/subscriptionRenewalService.js';

const app = express();

/* =========================
   🔐 SECURITY
========================= */

// Secure headers
app.use(helmet());

// Allowed frontend origins
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:5500'
];

// CORS config
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl requests, Postman)
        // Allow file:// protocol (for opening HTML files directly in browser)
        if (!origin || allowedOrigins.includes(origin) || origin === 'null') {
            callback(null, true);
        } else {
            console.error('❌ Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// 🔥 IMPORTANT (handles preflight requests)
app.options('*', cors(corsOptions));

/* =========================
   🛡️ RATE LIMIT
========================= */

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}));

// Chatbot limiter
const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20
});

/* =========================
   📦 BODY PARSER
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   🚀 ROUTES
========================= */

app.use('/api/auth', authRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/investors/subscriptions', investorSubscriptionsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/chatbot', chatLimiter, chatbotRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/meeting-requests', meetingRequestRoutes);

/* =========================
   ❤️ HEALTH CHECK
========================= */

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', time: new Date() });
});

/* =========================
   ❌ 404
========================= */

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

/* =========================
   ⚠️ ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ error: err.message });
});

/* =========================
   🔥 START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

/* =========================
   ⏰ SUBSCRIPTION RENEWAL SCHEDULER
========================= */

// Run subscription renewal checks daily at 2:00 AM
cron.schedule('0 2 * * *', async () => {
    try {
        console.log('⏰ Running scheduled subscription renewal check...');
        await SubscriptionRenewalService.runDailyCheck();
    } catch (err) {
        console.error('❌ Error in scheduled subscription renewal:', err);
    }
});

// Also run renewal check at server startup (optional, useful for testing)
console.log('✅ Subscription renewal scheduler initialized (runs daily at 2:00 AM)');
