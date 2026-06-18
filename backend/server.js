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

app.use(helmet());

const corsOptions = {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

/* =========================
   🛡️ RATE LIMIT
========================= */

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}));

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
    res.json({
        status: 'OK',
        time: new Date()
    });
});

/* =========================
   ❌ 404
========================= */

app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found'
    });
});

/* =========================
   ⚠️ ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({
        error: err.message
    });
});

/* =========================
   🔥 START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

/* =========================
   ⏰ SUBSCRIPTION RENEWAL
========================= */

cron.schedule('0 2 * * *', async () => {
    try {
        console.log('⏰ Running scheduled subscription renewal check...');
        await SubscriptionRenewalService.runDailyCheck();
    } catch (err) {
        console.error('❌ Error in scheduled subscription renewal:', err);
    }
});

console.log('✅ Subscription renewal scheduler initialized');