/**
 * Token Service - Picture Tokens Daily Distribution
 *
 * NEW CONCEPT:
 * - Users get 3 tokens/day IF they attached pictures to ALL yesterday's tokens
 * - 1 token = 1 picture (always)
 * - Tokens are unique, pictures can repeat
 * - Generation 1: 10 billion tokens total
 */

const logger = require('../utils/logger');
const db = require('../database/db');

class TokenService {
  constructor() {
    // Constants
    this.DAILY_TOKEN_AMOUNT = 3;
    this.GENERATION_1_MAX = 10_000_000_000; // 10 billion
    this.currentGeneration = 1;
    this.tokensIssued = 0;
  }

  /**
   * Check if user is eligible for daily tokens
   * @param {number} userId User ID
   * @returns {Promise<{eligible: boolean, reason: string}>}
   */
  async checkEligibility(userId) {
    const inMemoryDB = db.getInMemoryData();
    const userStats = inMemoryDB.userStats.get(userId);

    if (!userStats) {
      // New user - eligible for first tokens
      return { eligible: true, reason: 'new_user' };
    }

    // Check if already claimed today
    const today = this._getDateString(new Date());
    const lastClaim = userStats.lastClaimDate;

    if (lastClaim === today) {
      return { eligible: false, reason: 'already_claimed_today' };
    }

    // Check if user attached pictures to ALL yesterday's tokens
    const yesterday = this._getDateString(this._getYesterday());
    const yesterdayTokens = this._getUserTokensByDate(userId, yesterday);

    if (yesterdayTokens.length === 0 && lastClaim !== null) {
      // User didn't get tokens yesterday - not eligible
      return { eligible: false, reason: 'no_tokens_yesterday' };
    }

    if (yesterdayTokens.length > 0) {
      const allHavePictures = yesterdayTokens.every(token => token.pictureId !== null);

      if (!allHavePictures) {
        const attached = yesterdayTokens.filter(t => t.pictureId !== null).length;
        return {
          eligible: false,
          reason: 'missing_pictures',
          details: `${attached}/${yesterdayTokens.length} pictures attached`
        };
      }
    }

    // Check generation limit
    if (this.tokensIssued >= this.GENERATION_1_MAX) {
      return { eligible: false, reason: 'generation_1_exhausted' };
    }

    return { eligible: true, reason: 'all_conditions_met' };
  }

  /**
   * Claim daily tokens (3 tokens)
   * @param {number} userId User ID
   * @returns {Promise<{success: boolean, tokens: Array, message: string}>}
   */
  async claimDailyTokens(userId) {
    // Check eligibility
    const eligibility = await this.checkEligibility(userId);

    if (!eligibility.eligible) {
      return {
        success: false,
        tokens: [],
        message: this._getEligibilityMessage(eligibility)
      };
    }

    const inMemoryDB = db.getInMemoryData();
    const today = this._getDateString(new Date());

    // Create 3 new tokens
    const tokens = [];
    for (let i = 0; i < this.DAILY_TOKEN_AMOUNT; i++) {
      const tokenId = `TOKEN_${Date.now()}_${userId}_${i}`;
      const token = {
        id: tokenId,
        owner: userId,
        pictureId: null, // Not attached yet
        generation: this.currentGeneration,
        createdAt: new Date(),
        attachedAt: null
      };

      inMemoryDB.tokens.set(tokenId, token);
      tokens.push(token);
      this.tokensIssued++;
    }

    // Update user stats
    let userStats = inMemoryDB.userStats.get(userId);
    if (!userStats) {
      userStats = {
        lastClaimDate: null,
        tokensToday: 0,
        experience: 0,
        level: 1,
        activeReferrals: []
      };
    }

    userStats.lastClaimDate = today;
    userStats.tokensToday = this.DAILY_TOKEN_AMOUNT;
    inMemoryDB.userStats.set(userId, userStats);

    logger.info(`User ${userId} claimed ${this.DAILY_TOKEN_AMOUNT} daily tokens`);

    return {
      success: true,
      tokens,
      message: `You received ${this.DAILY_TOKEN_AMOUNT} KIK tokens! Attach pictures to get more tomorrow.`
    };
  }

  /**
   * Get referral bonus tokens
   * @param {number} userId User ID
   * @returns {Promise<{tokens: number, activeReferrals: number}>}
   */
  async getReferralBonus(userId) {
    const inMemoryDB = db.getInMemoryData();
    const userStats = inMemoryDB.userStats.get(userId);

    if (!userStats || !userStats.activeReferrals) {
      return { tokens: 0, activeReferrals: 0 };
    }

    // Count how many referrals attached all pictures yesterday
    const yesterday = this._getDateString(this._getYesterday());
    let activeCount = 0;

    for (const referralId of userStats.activeReferrals) {
      const referralTokens = this._getUserTokensByDate(referralId, yesterday);
      if (referralTokens.length > 0) {
        const allAttached = referralTokens.every(t => t.pictureId !== null);
        if (allAttached) {
          activeCount++;
        }
      }
    }

    // Award +1 token per active referral
    if (activeCount > 0) {
      const bonusTokens = [];
      for (let i = 0; i < activeCount; i++) {
        const tokenId = `TOKEN_REF_${Date.now()}_${userId}_${i}`;
        const token = {
          id: tokenId,
          owner: userId,
          pictureId: null,
          generation: this.currentGeneration,
          createdAt: new Date(),
          attachedAt: null
        };
        inMemoryDB.tokens.set(tokenId, token);
        bonusTokens.push(token);
        this.tokensIssued++;
      }

      logger.info(`User ${userId} received ${activeCount} referral bonus tokens`);
    }

    return { tokens: activeCount, activeReferrals: activeCount };
  }

  /**
   * Get user's tokens
   * @param {number} userId User ID
   * @param {boolean} onlyUnattached Only tokens without pictures
   * @returns {Array} User's tokens
   */
  getUserTokens(userId, onlyUnattached = false) {
    const inMemoryDB = db.getInMemoryData();
    const userTokens = Array.from(inMemoryDB.tokens.values())
      .filter(token => token.owner === userId);

    if (onlyUnattached) {
      return userTokens.filter(token => token.pictureId === null);
    }

    return userTokens;
  }

  /**
   * Get token by ID
   * @param {string} tokenId Token ID
   * @returns {Object|null} Token object
   */
  getToken(tokenId) {
    const inMemoryDB = db.getInMemoryData();
    return inMemoryDB.tokens.get(tokenId) || null;
  }

  /**
   * Get total tokens for user
   * @param {number} userId User ID
   * @returns {number} Total token count
   */
  getTotalTokens(userId) {
    return this.getUserTokens(userId).length;
  }

  /**
   * Get tokens issued in current generation
   * @returns {number} Tokens issued
   */
  getTokensIssuedCount() {
    return this.tokensIssued;
  }

  // ========== HELPER METHODS ==========

  /**
   * Get user tokens by date
   */
  _getUserTokensByDate(userId, dateString) {
    const inMemoryDB = db.getInMemoryData();
    return Array.from(inMemoryDB.tokens.values()).filter(token => {
      if (token.owner !== userId) return false;
      const tokenDate = this._getDateString(new Date(token.createdAt));
      return tokenDate === dateString;
    });
  }

  /**
   * Get date string (YYYY-MM-DD)
   */
  _getDateString(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get yesterday's date
   */
  _getYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  /**
   * Get eligibility message
   */
  _getEligibilityMessage(eligibility) {
    switch (eligibility.reason) {
      case 'already_claimed_today':
        return 'You already claimed your daily tokens today. Come back tomorrow!';
      case 'no_tokens_yesterday':
        return 'You didn\'t receive tokens yesterday. Claim daily to stay active!';
      case 'missing_pictures':
        return `You need to attach pictures to ALL yesterday's tokens. ${eligibility.details}`;
      case 'generation_1_exhausted':
        return 'Generation 1 tokens exhausted! Wait for Generation 2.';
      default:
        return 'You are not eligible for tokens right now.';
    }
  }
}

module.exports = new TokenService();
