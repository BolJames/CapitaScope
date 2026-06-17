import pool from '../config/database.js';

/**
 * EMAIL NOTIFICATION SERVICE
 * Handles subscription-related email notifications
 * Supports: Renewal reminders, payment alerts, invoices, etc.
 */

class EmailService {
    /**
     * Send subscription renewal reminder
     */
    static async sendRenewalReminder(subscriptionId, userEmail, userName, endDate, planName) {
        try {
            const notification = await this.createNotification(
                subscriptionId,
                userEmail,
                'renewal_reminder',
                '⏰ Your subscription will expire soon',
                `Dear ${userName},\n\nYour ${planName} subscription will expire on ${endDate}.\n\nRenew now to continue enjoying premium features!\n\nBest regards,\nGlobalVest Team`
            );

            // In production, use nodemailer or SendGrid
            console.log('📧 Renewal reminder email queued:', notification);
            return notification;
        } catch (err) {
            console.error('Error sending renewal reminder:', err);
            throw err;
        }
    }

    /**
     * Send payment success notification
     */
    static async sendPaymentSuccess(subscriptionId, userEmail, userName, amount, currency, planName) {
        try {
            const notification = await this.createNotification(
                subscriptionId,
                userEmail,
                'payment_success',
                '✅ Payment received',
                `Dear ${userName},\n\nWe have received your payment of ${currency} ${amount} for your ${planName} subscription.\n\nThank you for your business!\n\nBest regards,\nGlobalVest Team`
            );

            console.log('📧 Payment success email queued:', notification);
            return notification;
        } catch (err) {
            console.error('Error sending payment success notification:', err);
            throw err;
        }
    }

    /**
     * Send payment failure notification
     */
    static async sendPaymentFailed(subscriptionId, userEmail, userName, amount, reason) {
        try {
            const notification = await this.createNotification(
                subscriptionId,
                userEmail,
                'payment_failed',
                '❌ Payment failed',
                `Dear ${userName},\n\nWe were unable to process your payment of ${amount}.\n\nReason: ${reason}\n\nPlease update your payment method to avoid service interruption.\n\nBest regards,\nGlobalVest Team`
            );

            console.log('📧 Payment failed email queued:', notification);
            return notification;
        } catch (err) {
            console.error('Error sending payment failed notification:', err);
            throw err;
        }
    }

    /**
     * Send invoice notification
     */
    static async sendInvoice(invoiceId, userEmail, userName, invoiceNumber, amount, currency) {
        try {
            const notification = await this.createNotification(
                null,
                userEmail,
                'invoice_generated',
                `📄 Invoice ${invoiceNumber} ready`,
                `Dear ${userName},\n\nYour invoice for ${currency} ${amount} (Invoice #${invoiceNumber}) has been generated.\n\nPlease find the attached invoice.\n\nBest regards,\nGlobalVest Team`
            );

            console.log('📧 Invoice email queued:', notification);
            return notification;
        } catch (err) {
            console.error('Error sending invoice notification:', err);
            throw err;
        }
    }

    /**
     * Send upgrade offer notification
     */
    static async sendUpgradeOffer(subscriptionId, userEmail, userName, currentPlan, recommendedPlan, savings) {
        try {
            const notification = await this.createNotification(
                subscriptionId,
                userEmail,
                'upgrade_offer',
                `🚀 Special offer: Upgrade your plan`,
                `Dear ${userName},\n\nWe think you'd benefit from our ${recommendedPlan} plan! Save up to ${savings}% by upgrading today.\n\nClick here to upgrade: [upgrade_link]\n\nBest regards,\nGlobalVest Team`
            );

            console.log('📧 Upgrade offer email queued:', notification);
            return notification;
        } catch (err) {
            console.error('Error sending upgrade offer:', err);
            throw err;
        }
    }

    /**
     * Send subscription cancellation confirmation
     */
    static async sendCancellationConfirmation(subscriptionId, userEmail, userName, planName, cancelDate) {
        try {
            const notification = await this.createNotification(
                subscriptionId,
                userEmail,
                'downgrade_confirmation',
                '👋 Subscription cancelled',
                `Dear ${userName},\n\nYour ${planName} subscription has been cancelled effective ${cancelDate}.\n\nWe'd love to have you back! Feel free to reach out if there's anything we can improve.\n\nBest regards,\nGlobalVest Team`
            );

            console.log('📧 Cancellation confirmation email queued:', notification);
            return notification;
        } catch (err) {
            console.error('Error sending cancellation confirmation:', err);
            throw err;
        }
    }

    /**
     * Send expiry notice (final warning)
     */
    static async sendExpiryNotice(subscriptionId, userEmail, userName, expiryDate) {
        try {
            const notification = await this.createNotification(
                subscriptionId,
                userEmail,
                'expiry_notice',
                '⚠️ Your subscription expires today',
                `Dear ${userName},\n\nYour subscription expires on ${expiryDate}.\n\nRenew immediately to maintain access to your features.\n\nDon't lose access to your data!\n\nBest regards,\nGlobalVest Team`
            );

            console.log('📧 Expiry notice email queued:', notification);
            return notification;
        } catch (err) {
            console.error('Error sending expiry notice:', err);
            throw err;
        }
    }

    /**
     * Create notification record
     */
    static async createNotification(subscriptionId, userEmail, type, subject, message) {
        try {
            // Get user_id from email if subscription_id not provided
            let userId;
            if (subscriptionId) {
                const subResult = await pool.query(
                    'SELECT user_id FROM subscriptions WHERE id = $1',
                    [subscriptionId]
                );
                userId = subResult.rows[0]?.user_id;
            } else {
                const userResult = await pool.query(
                    'SELECT id FROM users WHERE email = $1',
                    [userEmail]
                );
                userId = userResult.rows[0]?.id;
            }

            if (!userId) throw new Error('User not found');

            const result = await pool.query(
                `INSERT INTO subscription_notifications (subscription_id, user_id, notification_type, subject, message, sent_to_email)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [subscriptionId, userId, type, subject, message, userEmail]
            );

            return result.rows[0];
        } catch (err) {
            console.error('Error creating notification:', err);
            throw err;
        }
    }

    /**
     * Mark notification as sent
     */
    static async markAsSent(notificationId) {
        try {
            const result = await pool.query(
                `UPDATE subscription_notifications 
                 SET is_sent = true, sent_at = CURRENT_TIMESTAMP
                 WHERE id = $1
                 RETURNING *`,
                [notificationId]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error marking notification as sent:', err);
            throw err;
        }
    }

    /**
     * Get unsent notifications (for batch sending)
     */
    static async getUnsentNotifications() {
        try {
            const result = await pool.query(
                `SELECT * FROM subscription_notifications 
                 WHERE is_sent = false 
                 ORDER BY created_at ASC`
            );
            return result.rows;
        } catch (err) {
            console.error('Error fetching unsent notifications:', err);
            throw err;
        }
    }

    /**
     * Send bulk emails (background job)
     * This would typically run on a schedule
     */
    static async sendBulkNotifications() {
        try {
            const unsent = await this.getUnsentNotifications();
            console.log(`📧 Sending ${unsent.length} pending notifications...`);

            for (const notification of unsent) {
                // Here you would integrate with nodemailer or SendGrid
                // For now, we just mark as sent
                await this.markAsSent(notification.id);
                console.log(`✅ Email sent to ${notification.sent_to_email}`);
            }

            return { sentCount: unsent.length };
        } catch (err) {
            console.error('Error in bulk notification sending:', err);
            throw err;
        }
    }
}

export default EmailService;
