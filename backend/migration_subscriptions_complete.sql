/**
 * DATABASE MIGRATION - SUBSCRIPTION FEATURES
 * This migration adds support for:
 * - Coupons/Discount codes
 * - Invoices
 * - Enhanced Payment tracking
 * - Subscription notifications
 * - Subscription audit trail
 */

-- ============================================
-- COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_uses INTEGER,
    times_used INTEGER DEFAULT 0,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_valid_until ON coupons(valid_until);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
    description TEXT,
    due_date DATE,
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- ============================================
-- ENHANCED PAYMENTS TABLE
-- ============================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- SUBSCRIPTION NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_notifications (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (
        notification_type IN ('renewal_reminder', 'expiry_notice', 'upgrade_offer', 'downgrade_confirmation', 'payment_failed', 'payment_success', 'invoice_generated')
    ),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_to_email VARCHAR(255),
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_notifications_user_id ON subscription_notifications(user_id);
CREATE INDEX idx_subscription_notifications_subscription_id ON subscription_notifications(subscription_id);
CREATE INDEX idx_subscription_notifications_is_sent ON subscription_notifications(is_sent);

-- ============================================
-- SUBSCRIPTION AUDIT TRAIL TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_audit_trail (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (
        action IN ('created', 'upgraded', 'downgraded', 'renewed', 'cancelled', 'payment_processed', 'coupon_applied', 'suspension', 'reactivation')
    ),
    old_plan VARCHAR(50),
    new_plan VARCHAR(50),
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_audit_trail_subscription_id ON subscription_audit_trail(subscription_id);
CREATE INDEX idx_subscription_audit_trail_user_id ON subscription_audit_trail(user_id);
CREATE INDEX idx_subscription_audit_trail_action ON subscription_audit_trail(action);

-- ============================================
-- UPDATE SUBSCRIPTIONS TABLE
-- ============================================
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_subscriptions_coupon_code ON subscriptions(coupon_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_auto_renew ON subscriptions(auto_renew);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_date ON subscriptions(renewal_date);

-- ============================================
-- UPDATE USERS TABLE FOR INVESTOR SUBSCRIPTIONS
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_metadata JSONB DEFAULT '{}';

-- ============================================
-- CREATE INVESTOR SUBSCRIPTIONS VIEW
-- ============================================
CREATE OR REPLACE VIEW investor_subscriptions AS
SELECT 
    s.id,
    s.user_id,
    u.email,
    u.first_name,
    u.last_name,
    s.plan,
    s.price,
    s.currency,
    s.start_date,
    s.end_date,
    s.is_active,
    s.auto_renew,
    s.renewal_date,
    'investor' as user_type
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE u.role = 'investor';

-- ============================================
-- CREATE STARTUP SUBSCRIPTIONS VIEW
-- ============================================
CREATE OR REPLACE VIEW startup_subscriptions AS
SELECT 
    s.id,
    s.user_id,
    u.email,
    u.first_name,
    u.last_name,
    s.plan,
    s.price,
    s.currency,
    s.start_date,
    s.end_date,
    s.is_active,
    s.auto_renew,
    s.renewal_date,
    'startup' as user_type
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE u.role = 'startup';
