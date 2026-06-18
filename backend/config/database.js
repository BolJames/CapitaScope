import { Pool } from 'pg';

const isRender = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('render');

const buildConnectionString = () => {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 5432;
    const name = process.env.DB_NAME || 'globalvest';
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || '';

    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
};

const connectionString = buildConnectionString();

if (!connectionString) {
    throw new Error('Database connection configuration is missing.');
}

const pool = new Pool({
    connectionString,
    ssl: isRender ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL Error:', err);
});

export default pool;