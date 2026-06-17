import { Pool } from 'pg';

// ❗ Validate environment variables (very important)
if (!process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_NAME) {
    console.error('❌ Missing DB environment variables');
    process.exit(1);
}

// Create connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5433,
});

// When DB connects
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL');
});

// If error occurs
pool.on('error', (err) => {
    console.error('❌ DB error:', err);
    process.exit(1);
});

export default pool;