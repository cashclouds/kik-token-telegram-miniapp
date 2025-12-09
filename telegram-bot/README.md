# KIK Collectibles Telegram Bot

Complete Telegram bot implementation for KIK Collectibles ecosystem with ad monetization.

## 🎯 Features

### Core Functionality
- **NFT Creation**: AI-generated collectibles (DALL-E/Stable Diffusion)
- **Marketplace**: Buy/sell NFTs with KIK tokens
- **Gifting**: Send NFTs to friends, both earn rewards
- **Referral System**: 5-level referral tree (15%/8%/4%/2%/1%)
- **Reward Distribution**: Action-based rewards with signature verification

### Monetization
- **Boot Ads**: Fullscreen ad on app launch (5 sec, $5 CPM)
- **Rewarded Video Ads**: 30 sec videos, users earn 50 KIK ($7 CPM)
- **Premium Subscription**: $4.99/month for ad-free experience
- **Sponsored Collectibles**: Brands pay for custom NFT campaigns

### Revenue Projections (10M users)

| Users | Daily Ad Views | Monthly Revenue | Annual Revenue |
|-------|---------------|-----------------|----------------|
| 100k | 100k boot + 50k reward | $50k | $600k |
| 1M | 1M boot + 500k reward | $500k | $6M |
| 5M | 5M boot + 2.5M reward | $2.5M | $30M |
| 10M | 10M boot + 5M reward | $5M+ | $60M+ |

**Target**: $20M-30M/month at 10M users

## 📦 Installation

```bash
cd telegram-bot
npm install
```

## ⚙️ Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in required values:
```env
# Telegram
BOT_TOKEN=your_bot_token_from_@BotFather
WEBAPP_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/kik_collectibles

# Blockchain (Polygon)
PRIVATE_KEY=your_deployer_private_key
KIK_TOKEN_ADDRESS=0x...
REWARD_DISTRIBUTOR_ADDRESS=0x...
# ... other contract addresses

# AI & IPFS
OPENAI_API_KEY=sk-...
PINATA_API_KEY=...
PINATA_SECRET_KEY=...

# Ads
TELEGRAM_ADS_TOKEN=your_telegram_ads_token
BOOT_AD_ENABLED=true
REWARD_AD_ENABLED=true
```

## 🗄️ Database Setup

### Create Database

```sql
CREATE DATABASE kik_collectibles;
```

### Run Migrations

```bash
npm run db:migrate
```

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    wallet_address VARCHAR(42),
    balance BIGINT DEFAULT 0,
    referral_code VARCHAR(20) UNIQUE,
    referred_by INTEGER REFERENCES users(id),
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMP,
    last_login_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- NFTs table
CREATE TABLE nfts (
    id SERIAL PRIMARY KEY,
    token_id INTEGER UNIQUE NOT NULL,
    owner_id INTEGER REFERENCES users(id),
    creator_id INTEGER REFERENCES users(id),
    name VARCHAR(255),
    prompt TEXT,
    image_url TEXT,
    metadata_url TEXT,
    rarity VARCHAR(20),
    creation_price BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace listings
CREATE TABLE marketplace_listings (
    id SERIAL PRIMARY KEY,
    nft_id INTEGER REFERENCES nfts(id),
    seller_id INTEGER REFERENCES users(id),
    price BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    listed_at TIMESTAMP DEFAULT NOW(),
    sold_at TIMESTAMP
);

-- Ad campaigns
CREATE TABLE ad_campaigns (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL, -- 'boot' or 'rewarded'
    image_url TEXT,
    video_url TEXT,
    click_url TEXT,
    cpm DECIMAL(10,2) DEFAULT 5.00,
    duration INTEGER, -- seconds
    reward_amount INTEGER, -- KIK tokens for rewarded ads
    priority INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    budget DECIMAL(15,2),
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ad impressions
CREATE TABLE ad_impressions (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER REFERENCES ad_campaigns(id),
    user_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT NOW(),
    ip_address INET
);

-- Ad clicks
CREATE TABLE ad_clicks (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER REFERENCES ad_campaigns(id),
    user_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Referral stats (denormalized for performance)
CREATE TABLE referral_stats (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    direct_referrals INTEGER DEFAULT 0,
    total_referrals INTEGER DEFAULT 0,
    pending_rewards BIGINT DEFAULT 0,
    claimed_rewards BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_nfts_owner ON nfts(owner_id);
CREATE INDEX idx_nfts_token_id ON nfts(token_id);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_ad_impressions_ad_user ON ad_impressions(ad_id, user_id);
CREATE INDEX idx_ad_impressions_timestamp ON ad_impressions(timestamp);
```

## 🚀 Running the Bot

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Using PM2 (recommended)
```bash
pm2 start src/index.js --name kik-bot
pm2 logs kik-bot
pm2 restart kik-bot
```

## 🤖 Bot Commands

### User Commands
- `/start [referral_code]` - Register & get 100 KIK bonus
- `/create <prompt>` - Create AI-generated NFT (100 KIK, get 50 KIK back)
- `/gift @username <nft_id>` - Gift NFT to friend (both get 50 KIK)
- `/marketplace` - Browse NFTs for sale
- `/buy_<listing_id>` - Buy NFT from marketplace
- `/collection` - View your NFTs
- `/invite` - Get referral link & stats
- `/watchad` - Watch 30s video ad, earn 50 KIK
- `/rewards` - Check pending referral rewards
- `/claim` - Claim referral rewards (min 10 KIK)
- `/premium` - Subscribe to premium ($4.99/month)
- `/balance` - Check KIK token balance
- `/settings` - User settings

### Admin Commands
- `/stats` - Bot statistics
- `/campaign_create` - Create ad campaign
- `/campaign_list` - List active campaigns
- `/revenue` - View ad revenue

## 📊 Ad Integration

### Boot Ads (Interstitial)
- **Format**: Image (1080x1920px)
- **Duration**: 5 seconds
- **Frequency**: Once per session (1 hour cooldown)
- **CPM**: $5
- **Users**: All non-premium users
- **Monthly impressions @ 10M users**: ~200M
- **Monthly revenue**: ~$1M

### Rewarded Video Ads
- **Format**: Video (16:9, 30 seconds)
- **Reward**: 50 KIK tokens
- **Cooldown**: 5 minutes between ads
- **CPM**: $7
- **Users**: Opt-in (user chooses to watch)
- **Monthly impressions @ 10M users**: ~50M (5 ads/user/month avg)
- **Monthly revenue**: ~$350k

### Premium Subscription
- **Price**: $4.99/month
- **Benefits**:
  - Ad-free experience
  - Unlimited NFT creation
  - Exclusive templates
  - Priority support
  - +20% reward bonus
- **Conversion**: 5% of users → 500k premium @ 10M users
- **Monthly revenue**: $2.5M

### Total Monthly Revenue @ 10M Users
```
Boot ads:         $1,000,000
Reward ads:         $350,000
Premium subs:     $2,500,000
Sponsored NFTs:     $500,000 (estimate)
---------------------------------
TOTAL:           ~$4,350,000/month
ANNUAL:          ~$52M/year
```

## 🎨 NFT Creation Flow

1. User sends `/create red ferrari`
2. Bot charges 100 KIK from user balance
3. Backend calls DALL-E/Stable Diffusion API
4. Image generated (512x512 or 1024x1024)
5. Upload to IPFS via Pinata
6. Mint NFT on blockchain (CollectiblesNFT contract)
7. Save metadata to database
8. User receives 50 KIK creation bonus
9. Referrers receive 15%/8%/4%/2%/1% of 50 KIK

## 💰 Referral System

### 5-Level Structure
```
User creates NFT → earns 50 KIK reward

Level 1 (direct referrer):    15% = 7.5 KIK
Level 2 (referrer's referrer): 8%  = 4 KIK
Level 3:                       4%  = 2 KIK
Level 4:                       2%  = 1 KIK
Level 5:                       1%  = 0.5 KIK
---------------------------------
Total referral rewards:        15 KIK
```

### Signup Bonus
- Referee (new user): 100 KIK registration bonus
- Referrer: 1000 KIK for each friend signup

### Viral Growth Math
```
1 user invites 5 friends:
  Direct bonus: 5 × 1000 = 5,000 KIK

If those 5 each invite 5:
  Level 2: 25 users × 8% of their rewards

If those 25 each invite 5:
  Level 3: 125 users × 4% of their rewards

Total network: 155 users from 1 seed user!
```

## 📱 Frontend Integration

### Telegram Mini App
```javascript
// telegram-webapp.js
import { TelegramWebApp } from '@twa-dev/sdk';

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();

// Get user data
const user = tg.initDataUnsafe.user;

// Connect wallet
async function connectWallet() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  // Send to backend
  await fetch('/api/wallet/connect', {
    method: 'POST',
    body: JSON.stringify({ userId: user.id, address })
  });
}

// Create NFT
async function createNFT(prompt) {
  tg.showPopup({
    title: 'Creating NFT',
    message: 'Please wait...'
  });

  const response = await fetch('/api/nft/create', {
    method: 'POST',
    body: JSON.stringify({ userId: user.id, prompt })
  });

  const { nft } = await response.json();
  return nft;
}
```

## 🔒 Security

### Reward Signatures
Backend generates signatures for all reward claims to prevent fraud:

```javascript
// Backend: Generate signature
const ethers = require('ethers');
const wallet = new ethers.Wallet(process.env.BACKEND_SIGNER_PRIVATE_KEY);

async function generateRewardSignature(userAddress, actionType, nonce) {
  const message = ethers.solidityPackedKeccak256(
    ['address', 'uint8', 'bytes32'],
    [userAddress, actionType, nonce]
  );

  const signature = await wallet.signMessage(ethers.getBytes(message));
  return signature;
}

// User calls smart contract with signature
const tx = await rewardDistributor.claimReward(
  actionType,
  nonce,
  signature
);
```

### Rate Limiting
- 30 requests per minute per user
- Redis-based tracking
- Automatic blocking for abuse

### Anti-Sybil
- Phone number verification via Telegram
- Wallet uniqueness checks
- Behavioral analysis
- Referral fraud detection

## 📈 Scaling for 10M Users

### Infrastructure
```
Load Balancer (NGINX)
   |
   ├── Bot Instance 1 (PM2 cluster, 4 workers)
   ├── Bot Instance 2 (PM2 cluster, 4 workers)
   ├── Bot Instance 3 (PM2 cluster, 4 workers)
   └── ...10 instances

PostgreSQL (Primary + 2 Read Replicas)
   - Sharded by user_id
   - Connection pooling (pgBouncer)
   - 10M rows = ~10GB

Redis Cluster
   - Session storage
   - Rate limiting
   - Ad impression cache
   - 3 nodes, 16GB each

IPFS (Pinata)
   - 10M NFTs × 1MB = 10TB
   - CDN for images
   - ~$2k/month

Blockchain
   - Polygon (low gas fees)
   - ~$0.01 per transaction
   - Batching for efficiency
```

### Estimated Costs @ 10M Users
```
Servers (10× 16GB):        $2,000/month
Database (managed):        $5,000/month
Redis (managed):           $1,000/month
IPFS/CDN:                  $2,000/month
AI API (DALL-E):          $10,000/month (100k creations)
Blockchain gas:            $3,000/month
Monitoring:                  $500/month
-----------------------------------------
TOTAL:                    ~$23,500/month

Revenue at 10M users:     $4,350,000/month
Profit margin:            99.5%
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific service
npm test -- adManager.test.js

# Coverage
npm run test:coverage
```

## 📊 Analytics & Monitoring

### Key Metrics
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- NFT creations per day
- Marketplace volume
- Referral conversion rate
- Ad impressions & revenue
- Premium conversion rate

### Tools
- Grafana dashboards
- Prometheus metrics
- Winston logging
- Sentry error tracking

## 🚀 Deployment

### Docker
```bash
docker build -t kik-bot .
docker run -d --env-file .env kik-bot
```

### Kubernetes
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

## 📄 License

MIT License

---

**Created for KIK Collectibles** - Telegram NFT Ecosystem
**Target**: 10M+ users, $50M-200M exit value
