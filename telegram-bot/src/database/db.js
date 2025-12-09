const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL Database Connection Pool
 * For MVP: Using in-memory storage (no real database required)
 */

// In-memory storage for MVP (replace with real PostgreSQL in production)
const inMemoryDB = {
  users: new Map(),
  // OLD (keeping for migration):
  nfts: new Map(),
  listings: new Map(),
  adCampaigns: new Map(),
  adImpressions: [],
  adClicks: [],
  referralStats: new Map(),

  // NEW: Picture Tokens System
  tokens: new Map(),        // tokenId -> { id, owner, pictureId, generation, createdAt, attachedAt }
  pictures: new Map(),      // pictureId -> { id, tokenId, imageUrl, isPrivate, encryptionKey, uploadedAt }
  userStats: new Map(),     // userId -> { lastClaimDate, tokensToday, experience, level, activeReferrals }
  dailyActivity: new Map()  // userId -> { date, attachedAll } - track yesterday's activity
};

class Database {
  constructor() {
    this.pool = null;
    this.useInMemory = !process.env.DATABASE_URL;

    if (!this.useInMemory) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      console.log('✅ PostgreSQL connection pool created');
    } else {
      console.log('⚠️  Using in-memory storage (MVP mode)');
      console.log('   Set DATABASE_URL in .env for production database');
    }
  }

  /**
   * Execute SQL query
   * @param {string} text SQL query
   * @param {Array} params Query parameters
   * @returns {Promise<Object>} Query result
   */
  async query(text, params) {
    if (this.useInMemory) {
      return this._mockQuery(text, params);
    }

    try {
      const start = Date.now();
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        console.warn(`⚠️  Slow query (${duration}ms):`, text.substring(0, 100));
      }

      return res;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Mock query for in-memory storage (MVP)
   */
  _mockQuery(text, params) {
    const textLower = text.toLowerCase();

    // Mock SELECT queries
    if (textLower.includes('select') && textLower.includes('users')) {
      if (textLower.includes('telegram_id')) {
        const telegramId = params[0];
        const user = Array.from(inMemoryDB.users.values()).find(u => u.telegram_id === telegramId);
        return { rows: user ? [user] : [] };
      }
    }

    // Mock INSERT queries
    if (textLower.includes('insert') && textLower.includes('users')) {
      const userId = inMemoryDB.users.size + 1;
      const user = {
        id: userId,
        telegram_id: params[0],
        username: params[1],
        wallet_address: null,
        balance: 0,
        referral_code: this._generateReferralCode(),
        referred_by: null,
        is_premium: false,
        created_at: new Date()
      };
      inMemoryDB.users.set(userId, user);
      return { rows: [user] };
    }

    // Mock UPDATE queries
    if (textLower.includes('update') && textLower.includes('users')) {
      // Simple mock - just return success
      return { rows: [], rowCount: 1 };
    }

    // Default: return empty result
    return { rows: [], rowCount: 0 };
  }

  /**
   * Generate random referral code
   */
  _generateReferralCode() {
    return 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection closed');
    }
  }

  /**
   * Get in-memory data (for testing/debugging)
   */
  getInMemoryData() {
    if (!this.useInMemory) {
      throw new Error('Not using in-memory storage');
    }
    return inMemoryDB;
  }

  /**
   * Clear in-memory data (for testing)
   */
  clearInMemoryData() {
    if (!this.useInMemory) {
      throw new Error('Not using in-memory storage');
    }

    inMemoryDB.users.clear();
    inMemoryDB.nfts.clear();
    inMemoryDB.listings.clear();
    inMemoryDB.adCampaigns.clear();
    inMemoryDB.adImpressions = [];
    inMemoryDB.adClicks = [];
    inMemoryDB.referralStats.clear();

    console.log('In-memory database cleared');
  }

  /**
   * Get or create user
   * @param {Object} telegramUser Telegram user object
   * @returns {Promise<Object>} User data
   */
  async getOrCreateUser(telegramUser) {
    const telegramId = telegramUser.id;

    if (this.useInMemory) {
      // Check if user exists
      let user = Array.from(inMemoryDB.users.values()).find(u => u.telegram_id === telegramId);

      if (!user) {
        // Create new user
        const userId = inMemoryDB.users.size + 1;
        const referralCode = this._generateReferralCode();

        user = {
          id: userId,
          telegram_id: telegramId,
          username: telegramUser.username || null,
          wallet_address: null,
          balance: 0,
          referral_code: referralCode,
          referred_by: null,
          is_premium: false,
          isPremium: false, // Alias for consistency
          created_at: new Date(),
          // NEW: Picture Tokens fields
          language: 'en', // Default language (auto-detect later)
          experience: 0,
          level: 1
        };
        inMemoryDB.users.set(userId, user);

        // Initialize user stats
        inMemoryDB.userStats.set(userId, {
          lastClaimDate: null,
          tokensToday: 0,
          experience: 0,
          level: 1,
          activeReferrals: []
        });

        console.log(`Created new user: ${telegramId} (@${telegramUser.username})`);
      }

      return user;
    }

    // Real database implementation
    const result = await this.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Create new user
    const insertResult = await this.query(
      `INSERT INTO users (telegram_id, username, referral_code)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [telegramId, telegramUser.username, this._generateReferralCode()]
    );

    return insertResult.rows[0];
  }
}

// Create singleton instance
const db = new Database();

module.exports = db;
