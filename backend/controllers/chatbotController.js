import OpenAI from 'openai';
import CountryData from '../models/CountryData.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const chat = async (req, res) => {
    try {
        const { message, country } = req.body;

        let countryInfo = '';

        // Fetch country data if provided
        if (country) {
            const data = await CountryData.findByCountry(country);

            if (data) {
                countryInfo = `Country: ${country}, Risk Score: ${data.risk_score}`;
            }
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an investment advisor. ${countryInfo}`
                },
                { role: 'user', content: message }
            ]
        });

        res.json({
            response: completion.choices[0].message.content
        });

    } catch {
        res.status(500).json({ error: 'Chat error' });
    }
};