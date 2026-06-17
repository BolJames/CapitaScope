import axios from 'axios';
import CountryData from '../models/CountryData.js';

class ExternalApiService {
    // Fetch economic data
    static async fetchData(country) {
        try {
            const response = await axios.get(
                `https://newsapi.org/v2/everything?q=${country}&apiKey=${process.env.NEWS_API_KEY}`
            );

            const news = response.data.articles.map(a => a.title);

            const riskScore = Math.random() * 10;

            // Save to DB
            await CountryData.upsert(country, riskScore, {}, news);

        } catch (err) {
            console.error('API error:', err.message);
        }
    }
}

export default ExternalApiService;