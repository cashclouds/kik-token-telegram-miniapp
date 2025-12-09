/**
 * Referral Service - NEW CONCEPT
 *
 * NEW REWARDS:
 * - Referrer gets +1 token when new user registers (one-time)
 * - Referrer gets +1 token per active referral daily (if they attached all pictures yesterday)
 */

const logger = require('../utils/logger');
const db = require('../database/db');

class ReferralService {
  constructor() {
    // In-memory referral tracking
    this.referrals = new Map(); // userId -> { referredBy, referralCode, referrals: [] }
  }

  /**
   * Register user with referral code
   * NEW: Awards +1 token to referrer immediately
   */
  async registerReferral(userId, referredByCode) {
    if (!referredByCode) {
      // User joined without referral
      const referralCode = this._generateReferralCode(userId);
      this.referrals.set(userId, {
        referredBy: null,
        referralCode,
        referrals: []
      });
      return { success: true, referralCode, bonusToken: null };
    }

    // Find referrer
    const referrer = this._findUserByReferralCode(referredByCode);

    if (!referrer) {
      logger.warn(`Invalid referral code: ${referredByCode}`);
      return { success: false, error: 'Invalid referral code' };
    }

    // Create user's referral data
    const referralCode = this._generateReferralCode(userId);
    this.referrals.set(userId, {
      referredBy: referrer.userId,
      referralCode,
      referrals: []
    });

    // Add to referrer's list
    referrer.data.referrals.push(userId);
    this.referrals.set(referrer.userId, referrer.data);

    // Update referrer's userStats
    const inMemoryDB = db.getInMemoryData();
    let referrerStats = inMemoryDB.userStats.get(referrer.userId);
    if (!referrerStats) {
      referrerStats = {
        lastClaimDate: null,
        tokensToday: 0,
        experience: 0,
        level: 1,
        activeReferrals: []
      };
    }
    referrerStats.activeReferrals.push(userId);
    inMemoryDB.userStats.set(referrer.userId, referrerStats);

    // Award +1 token to referrer (one-time bonus)
    const bonusToken = await this._awardReferralToken(referrer.userId, 'signup_bonus');

    logger.info(`User ${userId} referred by ${referrer.userId} → Referrer got +1 token`);

    return {
      success: true,
      referralCode,
      referrer: referrer.userId,
      bonusToken
    };
  }

  /**
   * Get user's referral stats
   */
  async getReferralStats(userId) {
    const data = this.referrals.get(userId);

    if (!data) {
      return {
        referralCode: null,
        directReferrals: 0,
        totalEarnings: 0
      };
    }

    return {
      referralCode: data.referralCode,
      directReferrals: data.referrals.length,
      totalEarnings: data.referrals.length * 1000 // 1000 KIK per referral (mock)
    };
  }

  /**
   * Get referral link for user
   */
  getReferralLink(referralCode, botUsername) {
    return `https://t.me/${botUsername}?start=${referralCode}`;
  }

  /**
   * Generate referral code for user
   */
  _generateReferralCode(userId) {
    return `REF${userId}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  /**
   * Find user by referral code
   */
  _findUserByReferralCode(code) {
    for (const [userId, data] of this.referrals.entries()) {
      if (data.referralCode === code) {
        return { userId, data };
      }
    }
    return null;
  }

  /**
   * Get all referrals (for admin)
   */
  getAllReferrals() {
    return Array.from(this.referrals.entries()).map(([userId, data]) => ({
      userId,
      ...data
    }));
  }

  // ========== HELPER METHODS ==========

  /**
   * Award referral bonus token
   * @param {number} userId Referrer user ID
   * @param {string} reason Bonus reason
   * @returns {Promise<Object>} Token object
   */
  async _awardReferralToken(userId, reason) {
    const inMemoryDB = db.getInMemoryData();

    const tokenId = `TOKEN_REF_${Date.now()}_${userId}_${reason}`;
    const token = {
      id: tokenId,
      owner: userId,
      pictureId: null,
      generation: 1, // Always Generation 1 for now
      createdAt: new Date(),
      attachedAt: null
    };

    inMemoryDB.tokens.set(tokenId, token);
    logger.info(`Referral bonus token awarded to user ${userId}: ${reason}`);

    return token;
  }
}

module.exports = new ReferralService();
