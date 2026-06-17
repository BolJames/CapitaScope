import pool from '../config/database.js';

/**
 * COUPON MODEL
 * Handles discount codes and promotional pricing
 */

class Coupon {
    /**
     * Create a new coupon
     */
    static async create(code, discountType, discountValue, maxUses, validUntil, description) {
        try {
            const result = await pool.query(
                `INSERT INTO coupons (code, discount_type, discount_value, max_uses, valid_until, description)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [code.toUpperCase(), discountType, discountValue, maxUses, validUntil, description]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error creating coupon:', err);
            throw err;
        }
    }

    /**
     * Get coupon by code
     */
    static async getByCode(code) {
        try {
            const result = await pool.query(
                `SELECT * FROM coupons 
                 WHERE code = $1 
                 AND valid_until >= CURRENT_DATE 
                 AND (max_uses IS NULL OR times_used < max_uses)
                 AND is_active = true`,
                [code.toUpperCase()]
            );
            return result.rows[0] || null;
        } catch (err) {
            console.error('Error fetching coupon:', err);
            throw err;
        }
    }

    /**
     * Validate coupon
     */
    static async validate(code) {
        try {
            const coupon = await this.getByCode(code);
            if (!coupon) {
                return { valid: false, error: 'Coupon not found or expired' };
            }
            return { valid: true, coupon };
        } catch (err) {
            return { valid: false, error: 'Error validating coupon' };
        }
    }

    /**
     * Apply coupon (increment usage)
     */
    static async apply(code) {
        try {
            const result = await pool.query(
                `UPDATE coupons 
                 SET times_used = times_used + 1, updated_at = CURRENT_TIMESTAMP
                 WHERE code = $1
                 RETURNING *`,
                [code.toUpperCase()]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error applying coupon:', err);
            throw err;
        }
    }

    /**
     * Calculate discount amount
     */
    static calculateDiscount(price, coupon) {
        if (!coupon) return { discount: 0, finalPrice: price };

        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = (price * coupon.discount_value) / 100;
        } else if (coupon.discount_type === 'fixed') {
            discount = coupon.discount_value;
        }

        const finalPrice = Math.max(0, price - discount);
        return { discount, finalPrice };
    }

    /**
     * Get all coupons (admin)
     */
    static async getAll() {
        try {
            const result = await pool.query(
                `SELECT * FROM coupons ORDER BY created_at DESC`
            );
            return result.rows;
        } catch (err) {
            console.error('Error fetching coupons:', err);
            throw err;
        }
    }

    /**
     * Deactivate coupon
     */
    static async deactivate(code) {
        try {
            const result = await pool.query(
                `UPDATE coupons 
                 SET is_active = false, updated_at = CURRENT_TIMESTAMP
                 WHERE code = $1
                 RETURNING *`,
                [code.toUpperCase()]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error deactivating coupon:', err);
            throw err;
        }
    }
}

export default Coupon;
