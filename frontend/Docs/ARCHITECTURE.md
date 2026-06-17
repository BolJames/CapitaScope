# GlobalVest Subscription System - Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vanilla JS)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐                 │
│  │  STARTUP DASHBOARD   │  │   ADMIN DASHBOARD    │                 │
│  ├──────────────────────┤  ├──────────────────────┤                 │
│  │ • View Plans         │  │ • View Stats         │                 │
│  │ • Subscribe          │  │ • View All Subs      │                 │
│  │ • Upgrade/Downgrade  │  │ • Filter Subs        │                 │
│  │ • Cancel             │  │ • Monitor MRR        │                 │
│  │ • Currency Selector  │  │ • Auto Refresh       │                 │
│  └──────────────────────┘  └──────────────────────┘                 │
│           │                          │                              │
│     startup-subscriptions.js    admin-subscriptions.js               │
│                                                                       │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              Subscription Cards (SaaS Design)        │           │
│  │  • Modern glass-morphism                             │           │
│  │  • Responsive grid layout                            │           │
│  │  • Hover effects & animations                        │           │
│  │  • Badge system (popular, savings)                   │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓ (HTTP/REST)
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js/Express)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              API ROUTES (/api/subscriptions)         │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                       │           │
│  │  USER ENDPOINTS (Startup Role):                     │           │
│  │  • GET  / - Current subscription                    │           │
│  │  • GET  /plans - Available plans with pricing       │           │
│  │  • POST / - Create/subscribe to plan                │           │
│  │  • PUT  /upgrade - Upgrade subscription             │           │
│  │  • DELETE / - Cancel subscription                   │           │
│  │                                                       │           │
│  │  ADMIN ENDPOINTS:                                   │           │
│  │  • GET /admin/all - All subscriptions               │           │
│  │  • GET /admin/stats - Statistics & MRR              │           │
│  │  • GET /admin/filter - Filtered subscriptions       │           │
│  │  • GET /admin/expired - Expired subs                │           │
│  └──────────────────────────────────────────────────────┘           │
│                                 ↓                                    │
│  ┌──────────────────────────────────────────────────────┐           │
│  │        SUBSCRIPTION CONTROLLER                        │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                       │           │
│  │  • Pricing Configuration (Multi-currency)           │           │
│  │  • Currency Detection & Mapping                     │           │
│  │  • Plan Validation                                 │           │
│  │  • Business Logic (create, upgrade, cancel)        │           │
│  │  • Statistics Calculation                          │           │
│  │  • Error Handling                                  │           │
│  │                                                       │           │
│  └──────────────────────────────────────────────────────┘           │
│                                 ↓                                    │
│  ┌──────────────────────────────────────────────────────┐           │
│  │        SUBSCRIPTION MODEL                            │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                       │           │
│  │  • create() - Create new subscription               │           │
│  │  • getActiveByUserId() - Get current sub            │           │
│  │  • getAllByUserId() - Subscription history          │           │
│  │  • getAll() - All subscriptions (admin)             │           │
│  │  • cancelByUserId() - Cancel subscription           │           │
│  │  • updatePlan() - Upgrade/downgrade                 │           │
│  │  • getStatistics() - Revenue & user stats           │           │
│  │  • filter() - Advanced filtering                    │           │
│  │  • getExpired() - Expired subscriptions             │           │
│  │                                                       │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓ (SQL)
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────┐           │
│  │         SUBSCRIPTIONS TABLE                          │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                       │           │
│  │  • id (PK)                                          │           │
│  │  • user_id (FK) → users table                       │           │
│  │  • plan (free | monthly | yearly)                  │           │
│  │  • price (DECIMAL)                                 │           │
│  │  • currency (USD, EUR, GBP, INR, etc.)             │           │
│  │  • start_date (DATE)                               │           │
│  │  • end_date (DATE, null for free)                  │           │
│  │  • is_active (BOOLEAN)                             │           │
│  │  • created_at, updated_at (TIMESTAMP)              │           │
│  │                                                       │           │
│  │  Indexes:                                           │           │
│  │  • idx_subscriptions_user_id                       │           │
│  │  • idx_subscriptions_plan                          │           │
│  │  • idx_subscriptions_is_active                     │           │
│  │  • idx_subscriptions_created_at                    │           │
│  │                                                       │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Diagram

```
┌─────────────────┐
│  User Visits    │
│ Startup Dash    │
└────────┬────────┘
         │
         ↓
┌──────────────────────────────┐
│ Load Plans                   │
│ GET /api/subscriptions/plans │
└────────┬─────────────────────┘
         │
         ├─→ Detect Currency
         │   └─→ Map Country → Currency
         │
         ↓
┌──────────────────────────────┐
│ Display Plan Cards            │
│ (Free, Monthly, Yearly)       │
│ with Pricing in Local Currency│
└────────┬─────────────────────┘
         │
         ↓
    ┌─────────────────────────────────────────┐
    │  User Selects Action                    │
    └─┬──────────────────────────────────────┬┘
      │                                      │
      ↓                                      ↓
  ┌─────────────┐              ┌──────────────────┐
  │ Subscribe   │              │ Upgrade/Downgrade│
  └─────┬───────┘              └────────┬─────────┘
        │                               │
        ↓                               ↓
  ┌─────────────────────┐      ┌─────────────────────┐
  │ POST /subscriptions │      │ PUT /subscriptions  │
  │                     │      │    /upgrade         │
  │ {plan, currency}    │      │ {newPlan, currency} │
  └─────┬───────────────┘      └────────┬────────────┘
        │                               │
        ├──→ Validate User             ├──→ Validate User
        ├──→ Check Existing Sub        ├──→ Check Hierarchy
        ├──→ Get Price                 ├──→ Cancel Old Sub
        ├──→ Calculate End Date        ├──→ Create New Sub
        ├──→ Create Subscription       └──→ Update is_active
        └──→ Set is_active=TRUE
        
        ↓                               ↓
  ┌─────────────────────┐      ┌─────────────────────┐
  │ Response: Success   │      │ Response: Success   │
  │ Show Current Plan   │      │ Show New Plan       │
  │ Refresh UI          │      │ Refresh UI          │
  └─────────────────────┘      └─────────────────────┘
```

## 💰 Pricing & Currency Flow

```
PRICING CONFIG (subscriptionController.js)
│
├─ SUBSCRIPTION_PRICES
│  ├─ free: 0
│  ├─ monthly:
│  │  ├─ USD: 29.99
│  │  ├─ EUR: 27.99
│  │  ├─ GBP: 23.99
│  │  └─ INR: 2499
│  │
│  └─ yearly:
│     ├─ USD: 299.99
│     ├─ EUR: 279.99
│     ├─ GBP: 239.99
│     └─ INR: 24999
│
└─ COUNTRY_CURRENCY_MAP
   ├─ 'US' → 'USD'
   ├─ 'GB' → 'GBP'
   ├─ 'IN' → 'INR'
   ├─ 'DE' → 'EUR'
   └─ etc...

USER LOCATION
│
├─ Detect Country (IP or input)
├─ Map Country → Currency
├─ Get Pricing for Currency
└─ Display to User
```

## 🎯 Subscription Lifecycle

```
User Registration
│
├─ User Role = 'startup'
└─ Default: plan = 'free'

         ↓

Browse Plans
│
├─ View Free, Monthly, Yearly
├─ See Pricing in Local Currency
└─ Select Plan

         ↓

Subscribe to Paid Plan
│
├─ Create Subscription
├─ set is_active = TRUE
├─ Calculate end_date (+30 or +365 days)
└─ Store in Database

         ↓

Active Subscription
│
├─ Has features of plan
├─ Can view current subscription
└─ Can upgrade/downgrade

         ↓

Upgrade/Downgrade
│
├─ Cancel current (is_active = FALSE)
├─ Create new subscription
├─ New end_date calculated
└─ Features updated

         ↓

Subscription Expiration (Auto-detected)
│
├─ end_date < TODAY
├─ is_active still TRUE (needs cleanup)
└─ Admin notified

         ↓

Cancel Subscription
│
├─ Set is_active = FALSE
├─ Set end_date = TODAY
├─ Revert to Free plan
└─ Lose premium features

         ↓

Free Plan (default)
│
├─ No expiration
├─ Limited features
└─ Can subscribe anytime
```

## 🔐 Authentication & Authorization

```
┌─────────────────────────────────┐
│  User Sends Request with JWT    │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  Middleware: authenticateToken  │
│  Verify JWT Signature           │
└────────┬────────────────────────┘
         │
         ├─ Valid? → Continue
         └─ Invalid? → 401 Unauthorized
         │
         ↓
┌─────────────────────────────────┐
│  Middleware: authorizeRoles     │
│  Check User Role (startup|admin)│
└────────┬────────────────────────┘
         │
         ├─ Allowed Role? → Execute Handler
         └─ Denied Role? → 403 Forbidden
         │
         ↓
┌─────────────────────────────────┐
│  Controller: Process Request    │
│  Return Data/Response           │
└─────────────────────────────────┘
```

## 📈 Admin Dashboard Statistics

```
┌─────────────────────────────────────────┐
│   Admin Dashboard Statistics            │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────┐               │
│  │ Active Subscriptions │               │
│  │ (COUNT WHERE         │               │
│  │  is_active=TRUE)     │               │
│  └──────────────────────┘               │
│                                         │
│  ┌──────────────────────┐               │
│  │ Free Plan Users      │               │
│  │ (COUNT WHERE plan=   │               │
│  │  'free')             │               │
│  └──────────────────────┘               │
│                                         │
│  ┌──────────────────────┐               │
│  │ Monthly Subscribers  │               │
│  │ (COUNT WHERE plan=   │               │
│  │  'monthly')          │               │
│  └──────────────────────┘               │
│                                         │
│  ┌──────────────────────┐               │
│  │ Yearly Subscribers   │               │
│  │ (COUNT WHERE plan=   │               │
│  │  'yearly')           │               │
│  └──────────────────────┘               │
│                                         │
│  ┌──────────────────────┐               │
│  │ Monthly Recurring    │               │
│  │ Revenue (MRR)        │               │
│  │ (SUM(price) WHERE    │               │
│  │  plan!='free' AND    │               │
│  │  is_active=TRUE)     │               │
│  └──────────────────────┘               │
│                                         │
│  ┌──────────────────────┐               │
│  │ Average Value        │               │
│  │ (AVG(price) WHERE    │               │
│  │  plan!='free' AND    │               │
│  │  is_active=TRUE)     │               │
│  └──────────────────────┘               │
│                                         │
└─────────────────────────────────────────┘
```

## 🎨 UI Components

```
┌────────────────────────────────────────────────────────┐
│              SUBSCRIPTION CARD                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [Popular Badge]                                       │
│                                                        │
│  📦 Monthly Plan                                       │
│  For growing startups                                  │
│                                                        │
│  $ 29.99 / 30 days                                     │
│                                                        │
│  ✓ Unlimited Pitch Decks                              │
│  ✓ Premium Profile Boost                              │
│  ✓ Unlimited Meeting Requests                         │
│  ✓ Priority Support                                   │
│  ✓ Advanced Analytics                                 │
│                                                        │
│  ┌──────────────────────────────┐                      │
│  │ Subscribe Now                │                      │
│  └──────────────────────────────┘                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

**This subscription system provides a complete, production-ready solution for managing multi-tier subscriptions with location-based pricing.**
