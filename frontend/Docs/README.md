# GlobalVest Platform

A comprehensive web application connecting startups and investors globally with AI-powered insights and real-time risk analysis.

## Features

- **User Roles**: Startup, Investor, Admin
- **Authentication**: JWT-based secure login
- **Payments**: Bank transfer, PayPal, Mpesa, and local mobile money
- **AI Chatbot**: OpenAI-powered investment advisor
- **External APIs**: World Bank, NewsAPI for real-time data
- **Subscription System**: Free and Premium plans
- **Admin Dashboard**: User management and analytics

## Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: JWT
- **Payments**: Bank transfer, PayPal, Mpesa, Mobile Money
- **AI**: OpenAI API
- **External APIs**: World Bank, NewsAPI

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/globalvest-platform.git
   cd globalvest-platform
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Database Setup**
   - Create a PostgreSQL database named `globalvest`
   - Run the schema and seed data:
   ```bash
   psql -d globalvest -f schema.sql
   psql -d globalvest -f seed.sql
   ```

4. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in your API keys and database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=globalvest
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_jwt_secret
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_ENV=sandbox
   PAYPAL_CURRENCY=USD
   MPESA_CONSUMER_KEY=your_mpesa_consumer_key
   MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
   MPESA_SHORTCODE=174379
   MPESA_PASSKEY=your_mpesa_passkey
   MPESA_BASE_URL=https://sandbox.safaricom.co.ke
   MPESA_CALLBACK_URL=http://localhost:5000/api/payments/mpesa-callback
   MOBILE_MONEY_RECEIVER=your_mobile_money_receiver
   BANK_NAME=Your Bank Name
   BANK_ACCOUNT_NAME=GlobalVest Ltd
   BANK_ACCOUNT_NUMBER=0000000000
   BANK_SWIFT=BANKXXXX
   BANK_IBAN=YOURIBAN
   BANK_CURRENCY=USD
   OPENAI_API_KEY=sk-...
   NEWS_API_KEY=your_news_api_key
   ```

5. **Start the Backend**
   ```bash
   npm run dev
   ```

6. **Frontend Setup**
   - Open `frontend/index.html` in your browser
   - Or serve with a local server:
   ```bash
   cd frontend
   python -m http.server 3000
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Startups
- `POST /api/startups` - Create startup profile
- `GET /api/startups/profile` - Get startup profile
- `PUT /api/startups/profile` - Update startup profile
- `GET /api/startups` - Get all startups (with filters)

### Investors
- `POST /api/investors` - Create investor profile
- `GET /api/investors/profile` - Get investor profile
- `PUT /api/investors/profile` - Update investor profile
- `POST /api/investors/meetings` - Schedule meeting

### Payments
- `POST /api/payments/subscribe` - Create subscription
- `GET /api/payments/subscriptions` - Get user subscriptions

### Chatbot
- `POST /api/chatbot` - Chat with AI advisor

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/analytics` - Get platform analytics

## Testing Payments

### PayPal Test Mode
- Use PayPal sandbox credentials
- Approve the order in the PayPal sandbox flow

### Mpesa Test Mode
- Use M-Pesa sandbox credentials and STK push simulation
- Confirm transaction through callback URL

### Bank Transfer / Mobile Money
- Bank transfer and mobile money methods are manual / offline and should be validated via confirmation or webhook integration.

## Deployment

1. **Environment Setup**
   - Set up production database
   - Configure environment variables
   - Set up SSL certificates

2. **Build and Deploy**
   - Use PM2 for process management
   - Set up reverse proxy with Nginx
   - Configure domain and SSL

3. **Monitoring**
   - Set up logging
   - Monitor API usage
   - Set up alerts for errors

## Security

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Helmet for security headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@globalvest.com or create an issue in the repository.