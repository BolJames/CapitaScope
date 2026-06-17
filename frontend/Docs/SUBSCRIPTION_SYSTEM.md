# GlobalVest Subscription System - Implementation Guide

## 📋 Overview

This document details the complete subscription system implementation for GlobalVest, including location-based pricing, multi-tier plans, and admin management.

---

## 🚀 Quick Start

### 1. Database Migration

Run this SQL to update your PostgreSQL database:

```sql
-- Update subscriptions table with new schema
DROP TABLE IF EXISTS subscriptions CASCADE;

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL CHECK (plan IN ('free', 'monthly', 'yearly')),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX idx_subscriptions_created_at ON subscriptions(created_at);
```

### 2. Backend Setup

All backend files are already created:
- **Model**: `backend/models/Subscription.js` - Database operations
- **Controller**: `backend/controllers/subscriptionController.js` - Business logic
- **Routes**: `backend/routes/subscriptions.js` - API endpoints
- **Server**: Updated `backend/server.js` with subscription routes

**No additional installation needed!** The system is fully integrated.

### 3. Frontend Setup

Frontend files are ready to use:
- **Startup Dashboard**: `frontend/startup-dashboard.html` - Subscription UI
- **Styles**: `frontend/css/styles.css` - Modern SaaS design
- **Startup Logic**: `frontend/js/startup-subscriptions.js` - Subscription management
- **Admin Logic**: `frontend/js/admin-subscriptions.js` - Admin panel

---

## 💰 Subscription Plans

### Free Plan
- **Price**: $0
- **Duration**: Forever (no expiration)
- **Features**:
  - 1 Pitch Deck Upload
  - Basic Profile
  - Up to 5 Meeting Requests/month
  - Platform Support (Email)
  - Standard Analytics

### Monthly Plan
- **Price**: $29.99 USD (varies by currency)
- **Duration**: 30 days
- **Features**:
  - Unlimited Pitch Decks
  - Premium Profile Boost
  - Unlimited Meeting Requests
  - Priority Support (Chat & Email)
  - Advanced Analytics
  - Featured in Investor Directory
  - Custom Brand Colors
  - Marketing Materials (PDF)

### Yearly Plan
- **Price**: $299.99 USD (2 months free equivalent)
- **Duration**: 365 days
- **Features**:
  - Everything in Monthly +
  - White-label Options
  - Dedicated Account Manager
  - 24/7 Priority Support
  - Advanced Investor Matching
  - API Access
  - Custom Integrations
  - Quarterly Strategy Consultations

---

## 🌍 Location-Based Currency Support

### Supported Currencies

```javascript
{
    USD: 'United States',
    EUR: 'Europe',
    GBP: 'United Kingdom',
    INR: 'India',
    CAD: 'Canada',
    AUD: 'Australia',
    JPY: 'Japan',
    CHF: 'Switzerland'
}
```

### How It Works

1. Frontend detects user country/currency (configurable)
2. API returns pricing in user's local currency
3. Prices are pre-configured in `subscriptionController.js`
4. Users can manually select currency from dropdown

---

## 📡 API Endpoints

### User Endpoints (Requires Authentication)

#### 1. Get User's Current Subscription
```
GET /api/subscriptions
Authorization: Bearer {token}

Response:
{
  "id": 1,
  "user_id": 5,
  "plan": "monthly",
  "price": 29.99,
  "currency": "USD",
  "start_date": "2026-04-23",
  "end_date": "2026-05-23",
  "is_active": true,
  "created_at": "2026-04-23T10:00:00Z"
}
```

#### 2. Get Available Plans
```
GET /api/subscriptions/plans?country=US&currency=USD
(No authentication required for public plans)

Response:
{
  "currency": "USD",
  "country": "US",
  "plans": [
    {
      "id": "free",
      "name": "Free Plan",
      "price": 0,
      "billingCycle": "Forever",
      "features": [...],
      "badge": null,
      "recommended": false
    },
    // ... monthly and yearly plans
  ]
}
```

#### 3. Subscribe to a Plan
```
POST /api/subscriptions
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan": "monthly",
  "currency": "USD"
}

Response:
{
  "message": "Successfully subscribed to monthly plan",
  "subscription": { ... }
}
```

#### 4. Upgrade Subscription
```
PUT /api/subscriptions/upgrade
Authorization: Bearer {token}
Content-Type: application/json

{
  "newPlan": "yearly",
  "currency": "USD"
}

Response:
{
  "message": "Successfully upgraded to yearly plan",
  "subscription": { ... }
}
```

#### 5. Cancel Subscription
```
DELETE /api/subscriptions
Authorization: Bearer {token}

Response:
{
  "message": "Subscription cancelled successfully",
  "subscription": { ... }
}
```

### Admin Endpoints (Requires Admin Role)

#### 1. Get All Subscriptions
```
GET /api/subscriptions/admin/all
Authorization: Bearer {admin_token}

Response: Array of all subscriptions with user details
```

#### 2. Get Subscription Statistics
```
GET /api/subscriptions/admin/stats
Authorization: Bearer {admin_token}

Response:
{
  "active_subscriptions": 150,
  "free_subscribers": 1200,
  "monthly_subscribers": 130,
  "yearly_subscribers": 20,
  "total_mrr": 4200.70,
  "avg_price": 28.67
}
```

#### 3. Filter Subscriptions
```
GET /api/subscriptions/admin/filter?plan=monthly&isActive=true&currency=USD
Authorization: Bearer {admin_token}

Response: Filtered array of subscriptions
```

#### 4. Get Expired Subscriptions
```
GET /api/subscriptions/admin/expired
Authorization: Bearer {admin_token}

Response: Array of subscriptions past end_date
```

---

## 🎨 Frontend Usage

### Startup Dashboard

**Location**: `frontend/startup-dashboard.html`

Features:
- View current active subscription
- Browse available plans with pricing
- Subscribe/Upgrade/Downgrade plans
- Cancel subscription
- Currency selector for localized pricing
- Modern glass-morphism card design
- Loading states and error handling

**Key Functions** (from `startup-subscriptions.js`):

```javascript
// Load available plans
loadPlans()

// Subscribe to plan
subscribeToplan(planId, currency)

// Cancel subscription
cancelSubscriptionHandler()

// Get current subscription
getCurrentSubscription()

// Detect user currency
detectCurrency(country)
```

### Admin Dashboard

**Location**: `frontend/admin-dashboard.html`

Features:
- View all subscriptions in table format
- Filter by plan type (free/monthly/yearly)
- Filter by status (active/inactive)
- View subscription statistics (MRR, total users, etc.)
- Automatic refresh every 30 seconds
- Visual indicators for plan types

**Key Functions** (from `admin-subscriptions.js`):

```javascript
// Load subscription statistics
loadSubscriptionStats()

// Load all subscriptions
loadSubscriptions(filters)

// Filter subscriptions
filterSubscriptions()

// Load expired subscriptions
loadExpiredSubscriptions()
```

---

## 🔧 Configuration

### Pricing Configuration

Edit `backend/controllers/subscriptionController.js`:

```javascript
const SUBSCRIPTION_PRICES = {
    free: 0,
    monthly: {
        USD: 29.99,
        EUR: 27.99,
        GBP: 23.99,
        INR: 2499,
        // Add more currencies
    },
    yearly: {
        USD: 299.99,
        EUR: 279.99,
        // ... etc
    }
};
```

### Currency Mapping

Edit `backend/controllers/subscriptionController.js`:

```javascript
const COUNTRY_CURRENCY_MAP = {
    'GB': 'GBP',
    'IN': 'INR',
    'US': 'USD',
    // Add/modify country mappings
};
```

### Billing Cycle Duration

Edit `backend/models/Subscription.js`:

```javascript
// Modify in create() method:
if (plan === 'monthly') {
    date.setDate(date.getDate() + 30); // Change to preferred duration
}
```

---

## 📊 Database Schema

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL CHECK (plan IN ('free', 'monthly', 'yearly')),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Fields

- **id**: Unique subscription identifier
- **user_id**: Foreign key to users table
- **plan**: Plan type (free/monthly/yearly)
- **price**: Amount charged for subscription
- **currency**: Currency code (USD, EUR, etc.)
- **start_date**: When subscription became active
- **end_date**: When subscription expires (null for free/infinite)
- **is_active**: Whether subscription is currently active
- **created_at**: Timestamp of subscription creation
- **updated_at**: Timestamp of last update

---

## 🔐 Security Features

1. **Authentication**: JWT token required for all endpoints
2. **Authorization**: Role-based access control (startup, investor, admin)
3. **Rate Limiting**: Requests limited to 100 per 15 minutes
4. **CORS**: Configured for specific origins
5. **Helmet**: Security headers enabled
6. **Input Validation**: Plan and currency validated on backend

---

## 🎯 Business Logic

### Subscription Rules

1. **Free Plan**: Default for all new users
2. **Single Active Subscription**: Only one active per user
3. **Auto-expiration**: End dates automatically calculated:
   - Monthly: +30 days from start
   - Yearly: +365 days from start
   - Free: No expiration
4. **Upgrade/Downgrade**: Previous subscription cancelled, new one created
5. **Cancellation**: Sets `is_active = FALSE` and `end_date = TODAY`

### Automatic Expiration Detection

Admin panel identifies expired subscriptions:
```javascript
// Query for subscriptions past end_date
WHERE is_active = TRUE AND end_date < CURRENT_DATE
```

---

## 🧪 Testing

### Test Subscription Flow

1. **Create Account**: Register as startup user
2. **View Plans**: Visit startup dashboard → Subscriptions section
3. **Subscribe**: Click "Subscribe Now" on Monthly or Yearly plan
4. **Upgrade**: Change to Yearly plan (if on Monthly)
5. **Cancel**: Cancel active subscription
6. **Admin View**: Login as admin, view all subscriptions in admin dashboard

### Test Data Queries

```sql
-- View all subscriptions
SELECT * FROM subscriptions ORDER BY created_at DESC;

-- Check active subscriptions
SELECT COUNT(*) FROM subscriptions WHERE is_active = TRUE;

-- Check expired subscriptions
SELECT * FROM subscriptions WHERE end_date < CURRENT_DATE AND is_active = TRUE;

-- Revenue statistics
SELECT plan, COUNT(*), SUM(price) as total_revenue 
FROM subscriptions 
WHERE is_active = TRUE 
GROUP BY plan;
```

---

## 🐛 Troubleshooting

### Issue: Plans not loading

**Solution**: Check:
1. Backend server is running (`npm start` in backend folder)
2. JWT token is valid in localStorage
3. CORS is allowing requests from your frontend URL
4. Network tab shows 200 response from `/api/subscriptions/plans`

### Issue: Subscribe button not working

**Solution**: Check:
1. You're authenticated (token in localStorage)
2. Currency is selected
3. Browser console for errors
4. Backend logs for error details

### Issue: Admin stats not showing

**Solution**: Check:
1. You're logged in as admin (role = 'admin')
2. Database has subscriptions with is_active = TRUE
3. Backend subscriptions table exists
4. Check `/api/subscriptions/admin/stats` response in network tab

---

## 🚀 Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Backend server running
- [ ] Frontend pointing to correct API URL
- [ ] JWT secret configured
- [ ] CORS origins updated for production
- [ ] Pricing updated for target markets
- [ ] Currency mappings complete
- [ ] Admin user created
- [ ] Test full subscription flow
- [ ] Monitor logs for errors

---

## 📝 Future Enhancements

1. **Payment Processing**: Integrate Stripe/PayPal for paid plans
2. **Invoice Generation**: Auto-generate invoices on subscription
3. **Usage Analytics**: Track feature usage by subscription level
4. **Auto-renewal**: Automatic billing for renewal
5. **Email Notifications**: Notify users of expiration/renewal
6. **Trial Periods**: Free trial before requiring payment
7. **Promo Codes**: Discount codes and coupon system
8. **Team Plans**: Subscription sharing within team
9. **Custom Pricing**: Different pricing for different markets
10. **API Rate Limiting**: Tier-based API rate limits

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check backend server logs
4. Verify database connection
5. Check JWT token validity

---

## ✅ Verification Checklist

Run these commands to verify setup:

```bash
# Check backend server
curl http://localhost:5000/api/health

# Check subscription routes
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/subscriptions

# Check admin routes
curl -H "Authorization: Bearer ADMIN_TOKEN" http://localhost:5000/api/subscriptions/admin/stats
```

---

**Last Updated**: April 23, 2026
**Version**: 1.0
**Status**: ✅ Production Ready
