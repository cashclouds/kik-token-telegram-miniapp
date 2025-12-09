const redis = require('redis');
const logger = require('./logger');
require('dotenv').config();

/**
 * Redis Client for Caching & Rate Limiting
 * For MVP: Using in-memory Map (no Redis required)
 */

class RedisClient {
  constructor() {
    this.client = null;
    this.useInMemory = !process.env.REDIS_URL;

    if (!this.useInMemory) {
      this.client = redis.createClient({
        url: process.env.REDIS_URL
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        logger.info('✅ Redis client connected');
      });

      this.connect();
    } else {
      // In-memory storage for MVP
      this.store = new Map();
      this.expiries = new Map();
      logger.info('⚠️  Using in-memory cache (MVP mode)');
      logger.info('   Set REDIS_URL in .env for production Redis');

      // Cleanup expired keys every 10 seconds
      setInterval(() => this._cleanupExpired(), 10000);
    }
  }

  async connect() {
    if (this.client && !this.client.isOpen) {
      await this.client.connect();
    }
  }

  /**
   * Set key-value pair
   */
  async set(key, value) {
    if (this.useInMemory) {
      this.store.set(key, value);
      return 'OK';
    }
    return await this.client.set(key, value);
  }

  /**
   * Set key-value pair with expiry (seconds)
   */
  async setex(key, seconds, value) {
    if (this.useInMemory) {
      this.store.set(key, value);
      this.expiries.set(key, Date.now() + seconds * 1000);
      return 'OK';
    }
    return await this.client.setEx(key, seconds, value);
  }

  /**
   * Get value by key
   */
  async get(key) {
    if (this.useInMemory) {
      // Check if expired
      const expiry = this.expiries.get(key);
      if (expiry && Date.now() > expiry) {
        this.store.delete(key);
        this.expiries.delete(key);
        return null;
      }
      return this.store.get(key) || null;
    }
    return await this.client.get(key);
  }

  /**
   * Delete key
   */
  async del(key) {
    if (this.useInMemory) {
      this.store.delete(key);
      this.expiries.delete(key);
      return 1;
    }
    return await this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (this.useInMemory) {
      const expiry = this.expiries.get(key);
      if (expiry && Date.now() > expiry) {
        this.store.delete(key);
        this.expiries.delete(key);
        return 0;
      }
      return this.store.has(key) ? 1 : 0;
    }
    return await this.client.exists(key);
  }

  /**
   * Increment value
   */
  async incr(key) {
    if (this.useInMemory) {
      const current = parseInt(this.store.get(key) || '0');
      const newValue = current + 1;
      this.store.set(key, newValue.toString());
      return newValue;
    }
    return await this.client.incr(key);
  }

  /**
   * Set expiry on existing key
   */
  async expire(key, seconds) {
    if (this.useInMemory) {
      if (this.store.has(key)) {
        this.expiries.set(key, Date.now() + seconds * 1000);
        return 1;
      }
      return 0;
    }
    return await this.client.expire(key, seconds);
  }

  /**
   * Cleanup expired keys (in-memory only)
   */
  _cleanupExpired() {
    if (!this.useInMemory) return;

    const now = Date.now();
    for (const [key, expiry] of this.expiries.entries()) {
      if (now > expiry) {
        this.store.delete(key);
        this.expiries.delete(key);
      }
    }
  }

  /**
   * Close Redis connection
   */
  async quit() {
    if (this.client && this.client.isOpen) {
      await this.client.quit();
      logger.info('Redis connection closed');
    }
  }

  /**
   * Clear all data (for testing)
   */
  async flushAll() {
    if (this.useInMemory) {
      this.store.clear();
      this.expiries.clear();
      logger.info('In-memory cache cleared');
    } else if (this.client) {
      await this.client.flushAll();
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
