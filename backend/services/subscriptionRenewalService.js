import Subscription from '../models/Subscription.js';
import EmailService from './emailNotificationService.js';
import pool from '../config/database.js';

/**
 * SUBSCRIPTION RENEWAL SERVICE
 * Handles automatic renewals, expiration checks, and renewal reminders
 * This service should run on a schedule (e.g., every day via cron job)
 */

class SubscriptionRenewalService {
    /**
     * Run daily renewal check
     * - Send renewal reminders (7 days before expiry)
     * - Send expiry notices (on expiry date)
     * - Auto-renew subscriptions (with auto_renew flag)
     * - Send expiry warnings (3 days before expiry)
     */
    static async runDailyCheck() {
        try {
            console.log('🔄 Starting subscription renewal check...');

            // 1. Send reminders for subscriptions expiring in 7 days
            await this.sendRenewalReminders();

            // 2. Send warnings for subscriptions expiring in 3 days
            await this.sendExpiryWarnings();

            // 3. Auto-renew subscriptions with auto_renew = true
            await this.autoRenewSubscriptions();

            // 4. Handle expired subscriptions
            await this.handleExpiredSubscriptions();

            // 5. Send bulk notification emails
            await EmailService.sendBulkNotifications();

            console.log('✅ Subscription renewal check completed');
            return { status: 'completed' };
        } catch (err) {
            console.error('❌ Error in daily renewal check:', err);
            throw err;
        }
    }

    /**
     * Send renewal reminders for subscriptions expiring in 7 days
     */
    static async sendRenewalReminders() {
        try {
            const result = await pool.query(
                `SELECT s.*, u.email, u.first_name 
                 FROM subscriptions s
                 JOIN users u ON s.user_id = u.id
                 WHERE s.is_active = true 
                 AND s.end_date = CURRENT_DATE + INTERVAL '7 days'
                 AND s.plan != 'free'`
            );

            for (const subscription of result.rows) {
                await EmailService.sendRenewalReminder(
                    subscription.id,
                    subscription.email,
                    subscription.first_name,
                    subscription.end_date,
                    subscription.plan
                );
            }

            console.log(`📧 Sent ${result.rows.length} renewal reminder emails`);
            return result.rows.length;
        } catch (err) {
            console.error('Error sending renewal reminders:', err);
            throw err;
        }
    }

    /**
     * Send expiry warnings for subscriptions expiring in 3 days
     */
    static async sendExpiryWarnings() {
        try {
            const result = await pool.query(
                `SELECT s.*, u.email, u.first_name 
                 FROM subscriptions s
                 JOIN users u ON s.user_id = u.id
                 WHERE s.is_active = true 
                 AND s.end_date = CURRENT_DATE + INTERVAL '3 days'
                 AND s.plan != 'free'`
            );

            for (const subscription of result.rows) {
                await EmailService.sendExpiryNotice(
                    subscription.id,
                    subscription.email,
                    subscription.first_name,
                    subscription.end_date
                );
            }

            console.log(`⚠️ Sent ${result.rows.length} expiry warning emails`);
            return result.rows.length;
        } catch (err) {
            console.error('Error sending expiry warnings:', err);
            throw err;
        }
    }

    /**
     * Auto-renew subscriptions with auto_renew flag set to true
     */
    static async autoRenewSubscriptions() {
        try {
            // Get subscriptions that need auto-renewal
            const result = await pool.query(
                `SELECT s.*, u.email, u.first_name 
                 FROM subscriptions s
                 JOIN users u ON s.user_id = u.id
                 WHERE s.auto_renew = true 
                 AND s.is_active = false 
                 AND s.end_date = CURRENT_DATE
                 AND s.plan != 'free'`
            );

            let renewedCount = 0;

            for (const subscription of result.rows) {
                try {
                    // Renew subscription
                    const newEndDate = new Date();
                    if (subscription.plan === 'monthly') {
                        newEndDate.setMonth(newEndDate.getMonth() + 1);
                    } else if (subscription.plan === 'yearly') {
                        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                    }

                    await pool.query(
                        `UPDATE subscriptions 
                         SET end_date = $1, 
                             is_active = true, 
                             renewal_date = CURRENT_DATE,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE id = $2`,
                        [newEndDate, subscription.id]
                    );

                    // Send confirmation email
                    await EmailService.sendPaymentSuccess(
                        subscription.id,
                        subscription.email,
                        subscription.first_name,
                        subscription.price,
                        subscription.currency,
                        subscription.plan
                    );

                    // Log audit trail
                    await this.logAuditTrail(
                        subscription.id,
                        subscription.user_id,
                        'renewed',
                        subscription.plan,
                        subscription.plan,
                        subscription.price,
                        subscription.price
                    );

                    renewedCount++;
                } catch (err) {
                    console.error(`Error renewing subscription ${subscription.id}:`, err);
                }
            }

            console.log(`✅ Auto-renewed ${renewedCount} subscriptions`);
            return renewedCount;
        } catch (err) {
            console.error('Error in auto-renewal process:', err);
            throw err;
        }
    }

    /**
     * Handle expired subscriptions (mark as inactive)
     */
    static async handleExpiredSubscriptions() {
        try {
            const result = await pool.query(
                `SELECT s.*, u.email, u.first_name 
                 FROM subscriptions s
                 JOIN users u ON s.user_id = u.id
                 WHERE s.is_active = true 
                 AND s.end_date < CURRENT_DATE
                 AND s.plan != 'free'`
            );

            let expiredCount = 0;

            for (const subscription of result.rows) {
                try {
                    // Mark as inactive
                    await pool.query(
                        `UPDATE subscriptions 
                         SET is_active = false, updated_at = CURRENT_TIMESTAMP
                         WHERE id = $1`,
                        [subscription.id]
                    );

                    // Send expiration confirmation
                    await EmailService.sendCancellationConfirmation(
                        subscription.id,
                        subscription.email,
                        subscription.first_name,
                        subscription.plan,
                        subscription.end_date
                    );

                    // Log audit trail
                    await this.logAuditTrail(
                        subscription.id,
                        subscription.user_id,
                        'suspension',
                        subscription.plan,
                        null,
                        subscription.price,
                        0
                    );

                    expiredCount++;
                } catch (err) {
                    console.error(`Error handling expired subscription ${subscription.id}:`, err);
                }
            }

            console.log(`🛑 Marked ${expiredCount} subscriptions as expired`);
            return expiredCount;
        } catch (err) {
            console.error('Error handling expired subscriptions:', err);
            throw err;
        }
    }

    /**
     * Log action in audit trail
     */
    static async logAuditTrail(subscriptionId, userId, action, oldPlan, newPlan, oldPrice, newPrice) {
        try {
            await pool.query(
                `INSERT INTO subscription_audit_trail (subscription_id, user_id, action, old_plan, new_plan, old_price, new_price)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [subscriptionId, userId, action, oldPlan, newPlan, oldPrice, newPrice]
            );
        } catch (err) {
            console.error('Error logging audit trail:', err);
        }
    }

    /**
     * Get renewal statistics
     */
    static async getStats() {
        try {
            const stats = await pool.query(
                `SELECT 
                    COUNT(CASE WHEN auto_renew = true THEN 1 END) as auto_renew_enabled,
                    COUNT(CASE WHEN end_date <= CURRENT_DATE + INTERVAL '7 days' AND is_active = true THEN 1 END) as expiring_soon,
                    COUNT(CASE WHEN end_date < CURRENT_DATE AND is_active = true THEN 1 END) as overdue_renewal
                 FROM subscriptions
                 WHERE plan != 'free'`
            );

            return stats.rows[0];
        } catch (err) {
            console.error('Error fetching renewal stats:', err);
            throw err;
        }
    }

    /**
     * Get subscription upgrade recommendations
     */
    static async getUpgradeRecommendations(userId) {
        try {
            const result = await pool.query(
                `SELECT s.*, 
                        CASE 
                            WHEN s.plan = 'free' THEN 'monthly'
                            WHEN s.plan = 'monthly' THEN 'yearly'
                            ELSE NULL
                        END as recommended_plan
                 FROM subscriptions s
                 WHERE s.user_id = $1 AND s.is_active = true`,
                [userId]
            );

            return result.rows[0] || null;
        } catch (err) {
            console.error('Error getting upgrade recommendations:', err);
            throw err;
        }
    }
}

export default SubscriptionRenewalService;
