-- ================================================
-- KIK COLLECTIBLES BOT - PostgreSQL Database Schema
-- Picture Tokens System MVP
-- ================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    wallet_address VARCHAR(255),
    balance DECIMAL(18, 8) DEFAULT 0,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referred_by INTEGER REFERENCES users(id),
    is_premium BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en',
    experience INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on telegram_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Tokens table (Picture Tokens)
CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    owner INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    picture_id INTEGER,
    generation INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    attached_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tokens_owner ON tokens(owner);
CREATE INDEX IF NOT EXISTS idx_tokens_picture_id ON tokens(picture_id);

-- Pictures table
CREATE TABLE IF NOT EXISTS pictures (
    id SERIAL PRIMARY KEY,
    token_id INTEGER UNIQUE NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    encryption_key TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pictures_token_id ON pictures(token_id);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_claim_date DATE,
    tokens_today INTEGER DEFAULT 0,
    experience INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    active_referrals INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- Daily activity table
CREATE TABLE IF NOT EXISTS daily_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    attached_all BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON daily_activity(user_id, date);

-- ================================================
-- LEGACY TABLES (kept for backward compatibility)
-- ================================================

-- NFTs table (legacy)
CREATE TABLE IF NOT EXISTS nfts (
    id SERIAL PRIMARY KEY,
    token_id VARCHAR(255) UNIQUE NOT NULL,
    owner INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace listings (legacy)
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    nft_id INTEGER NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
    seller INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    price DECIMAL(18, 8) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ad campaigns (legacy)
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id SERIAL PRIMARY KEY,
    advertiser INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    budget DECIMAL(18, 8) NOT NULL,
    spent DECIMAL(18, 8) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ad impressions (legacy)
CREATE TABLE IF NOT EXISTS ad_impressions (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT NOW()
);

-- Ad clicks (legacy)
CREATE TABLE IF NOT EXISTS ad_clicks (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- MIGRATION SCRIPT
-- ================================================

-- Add foreign key constraint if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tokens_picture_id_fkey'
    ) THEN
        ALTER TABLE tokens 
        ADD CONSTRAINT tokens_picture_id_fkey 
        FOREIGN KEY (picture_id) 
        REFERENCES pictures(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- ================================================
-- USEFUL QUERIES
-- ================================================

-- Get user with stats
-- SELECT u.*, s.* FROM users u 
-- LEFT JOIN user_stats s ON u.id = s.user_id 
-- WHERE u.telegram_id = <telegram_id>;

-- Get all user tokens with pictures
-- SELECT t.*, p.image_url, p.is_private 
-- FROM tokens t 
-- LEFT JOIN pictures p ON t.picture_id = p.id 
-- WHERE t.owner = <user_id>
-- ORDER BY t.created_at DESC;

-- Check yesterday's activity for rewards
-- SELECT da.* FROM daily_activity da
-- WHERE da.user_id = <user_id> 
-- AND da.date = CURRENT_DATE - INTERVAL '1 day'
-- AND da.attached_all = TRUE;

-- Count active users today
-- SELECT COUNT(DISTINCT user_id) FROM daily_activity 
-- WHERE date = CURRENT_DATE;

-- ================================================
-- GRANTS (if needed for specific database user)
-- ================================================

-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;
