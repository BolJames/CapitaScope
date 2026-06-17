import pool from '../config/database.js';

class CountryData {
    // Save or update country data
    static async upsert(country, riskScore, economicData, newsData) {
        await pool.query(
            `INSERT INTO country_data (country, risk_score, economic_data, news_data)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (country) DO UPDATE
             SET risk_score = $2, economic_data = $3, news_data = $4`,
            [country, riskScore, JSON.stringify(economicData), JSON.stringify(newsData)]
        );
    }

    // Get country data
    static async findByCountry(country) {
        const result = await pool.query(
            'SELECT * FROM country_data WHERE country = $1',
            [country]
        );

        return result.rows[0];
    }
}

export default CountryData;