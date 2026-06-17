-- Seed Data for GlobalVest Platform

-- Insert sample users
INSERT INTO users (email, password_hash, role) VALUES
('admin@globalvest.com', '$2a$10$example.hash.for.admin', 'admin'),
('startup1@example.com', '$2a$10$example.hash.for.startup1', 'startup'),
('startup2@example.com', '$2a$10$example.hash.for.startup2', 'startup'),
('investor1@example.com', '$2a$10$example.hash.for.investor1', 'investor'),
('investor2@example.com', '$2a$10$example.hash.for.investor2', 'investor');

-- Insert sample startups
INSERT INTO startups (user_id, name, description, industry, funding_needed, location, subscription_plan) VALUES
(2, 'TechStartup Inc', 'A revolutionary tech startup', 'Technology', 500000.00, 'San Francisco, USA', 'premium'),
(3, 'GreenEnergy Ltd', 'Sustainable energy solutions', 'Energy', 1000000.00, 'Berlin, Germany', 'free');

-- Insert sample investors
INSERT INTO investors (user_id, name, interests, budget, industries, location) VALUES
(4, 'John Investor', 'Tech and AI investments', 2000000.00, 'Technology,AI', 'New York, USA'),
(5, 'Sarah Capital', 'Green and sustainable investments', 5000000.00, 'Energy,Environment', 'London, UK');

-- Insert sample subscriptions
INSERT INTO subscriptions (user_id, plan, start_date, end_date, is_active) VALUES
(2, 'premium', '2024-01-01', '2024-12-31', TRUE),
(3, 'free', '2024-01-01', NULL, TRUE);

-- Insert sample country data
INSERT INTO country_data_cache (country, risk_score, economic_data, news_data) VALUES
('USA', 2.5, '{"gdp": 21427700, "inflation": 3.1}', '["Stable economy", "Tech innovation"]'),
('Germany', 2.0, '{"gdp": 4223116, "inflation": 2.5}', '["Strong manufacturing", "EU stability"]'),
('India', 3.5, '{"gdp": 3176290, "inflation": 4.8}', '["Growing market", "Political changes"]');