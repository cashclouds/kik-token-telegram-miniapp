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
   * NEW LOGIC: 24-hour timer after attaching last picture
   * @param {number} userId User ID
   * @returns {Promise<{eligible: boolean, reason: string, nextAvailableAt?: Date}>}
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

    // NEW LOGIC: Check if 24 hours have passed since last picture attachment
    if (userStats.lastPictureAttached) {
      const lastAttachmentTime = new Date(userStats.lastPictureAttached);
      const twentyFourHoursLater = new Date(lastAttachmentTime.getTime() + 24 * 60 * 60 * 1000);

      if (new Date() < twentyFourHoursLater) {
        return {
          eligible: false,
          reason: 'timer_not_expired',
          nextAvailableAt: twentyFourHoursLater
        };
      }
    }

    // Check generation limit
    if (this.tokensIssued >= this.GENERATION_1_MAX) {
      return { eligible: false, reason: 'generation_1_exhausted' };
    }

    return { eligible: true, reason: 'timer_expired' };
  }

  /**
   * Claim daily tokens (3 tokens)
   * UPDATED: Reset timer when claiming tokens
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
        message: this.getEligibilityMessage(eligibility)
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
    // NEW: Reset lastPictureAttached to null since user just claimed new tokens
    userStats.lastPictureAttached = null;
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
   * UPDATED: Check if user was active yesterday before awarding referral bonuses
   * @param {number} userId User ID
   * @returns {Promise<{tokens: number, activeReferrals: number, timers: Array}>}
   */
  async getReferralBonus(userId) {
    const inMemoryDB = db.getInMemoryData();
    const userStats = inMemoryDB.userStats.get(userId);

    if (!userStats || !userStats.activeReferrals) {
      return { tokens: 0, activeReferrals: 0, timers: [] };
    }

    // NEW: Check if user was active yesterday (attached all pictures)
    const yesterday = this._getDateString(this._getYesterday());
    const userYesterdayTokens = this._getUserTokensByDate(userId, yesterday);
    const userWasActive = userYesterdayTokens.length === 0 ||
                         userYesterdayTokens.every(t => t.pictureId !== null);

    if (!userWasActive) {
      logger.info(`User ${userId} not eligible for referral bonuses - was inactive yesterday`);
      return { tokens: 0, activeReferrals: 0, timers: [] };
    }

    // Count how many referrals attached all pictures yesterday
    let activeCount = 0;
    const referralTimers = [];

    for (const referralId of userStats.activeReferrals) {
      const referralTokens = this._getUserTokensByDate(referralId, yesterday);
      if (referralTokens.length > 0) {
        const allAttached = referralTokens.every(t => t.pictureId !== null);
        if (allAttached) {
          activeCount++;
          // Calculate when this referral bonus will be available
          const referralStats = inMemoryDB.userStats.get(referralId);
          if (referralStats?.lastPictureAttached) {
            const lastAttachmentTime = new Date(referralStats.lastPictureAttached);
            const availableAt = new Date(lastAttachmentTime.getTime() + 24 * 60 * 60 * 1000);
            referralTimers.push({
              referralId,
              availableAt,
              isAvailable: new Date() >= availableAt
            });
          }
        }
      }
    }

    // Award +1 token per active referral (only if timer expired)
    const availableTimers = referralTimers.filter(t => t.isAvailable);
    const availableCount = availableTimers.length;

    if (availableCount > 0) {
      const bonusTokens = [];
      for (let i = 0; i < availableCount; i++) {
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

      logger.info(`User ${userId} received ${availableCount} referral bonus tokens`);
    }

    return {
      tokens: availableCount,
      activeReferrals: activeCount,
      timers: referralTimers
    };
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
   * Update last picture attached timestamp
   * @param {number} userId User ID
   * @param {Date} timestamp When picture was attached
   */
  updateLastPictureAttached(userId, timestamp) {
    const inMemoryDB = db.getInMemoryData();
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

    userStats.lastPictureAttached = timestamp;
    inMemoryDB.userStats.set(userId, userStats);
  }

  /**
   * Get timer information for user
   * @param {number} userId User ID
   * @returns {Object} Timer info
   */
  getUserTimerInfo(userId) {
    const inMemoryDB = db.getInMemoryData();
    const userStats = inMemoryDB.userStats.get(userId);

    if (!userStats || !userStats.lastPictureAttached) {
      return {
        hasActiveTimer: false,
        nextAvailableAt: null,
        hoursLeft: 0
      };
    }

    const lastAttachmentTime = new Date(userStats.lastPictureAttached);
    const twentyFourHoursLater = new Date(lastAttachmentTime.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const hasActiveTimer = now < twentyFourHoursLater;
    const hoursLeft = hasActiveTimer ? Math.ceil((twentyFourHoursLater - now) / (60 * 60 * 1000)) : 0;

    return {
      hasActiveTimer,
      nextAvailableAt: twentyFourHoursLater,
      hoursLeft
    };
  }

  /**
   * Get eligibility message
   * UPDATED: Add timer-related messages
   */
  getEligibilityMessage(eligibility) {
    switch (eligibility.reason) {
      case 'already_claimed_today':
        return 'You already claimed your daily tokens today. Come back tomorrow!';
      case 'no_tokens_yesterday':
        return 'You didn\'t receive tokens yesterday. Claim daily to stay active!';
      case 'missing_pictures':
        return `You need to attach pictures to ALL yesterday's tokens. ${eligibility.details}`;
      case 'generation_1_exhausted':
        return 'Generation 1 tokens exhausted! Wait for Generation 2.';
      case 'timer_not_expired':
        if (eligibility.nextAvailableAt) {
          const hoursLeft = Math.ceil((eligibility.nextAvailableAt - new Date()) / (60 * 60 * 1000));
          return `⏳ Timer active! Next tokens available in ${hoursLeft} hours.`;
        }
        return '⏳ Timer active! Please wait before claiming more tokens.';
      default:
        return 'You are not eligible for tokens right now.';
    }
  }
}

module.exports = new TokenService();
