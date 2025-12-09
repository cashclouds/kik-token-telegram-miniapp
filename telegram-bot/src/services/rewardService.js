/**
 * Reward Service (MVP - Mock Implementation)
 * For production: Integrate with RewardDistributor smart contract
 */

const logger = require('../utils/logger');

class RewardService {
  constructor() {
    // In-memory reward tracking
    this.pendingRewards = new Map();
  }

  /**
   * Award reward to user (MVP: just track, don't send)
   */
  async awardReward(userId, actionType, amount) {
    logger.info(`Awarding ${amount} KIK to user ${userId} for ${actionType}`);

    const current = this.pendingRewards.get(userId) || 0;
    this.pendingRewards.set(userId, current + amount);

    return {
      success: true,
      amount,
      totalPending: current + amount
    };
  }

  /**
   * Get pending rewards for user
   */
  async getPendingRewards(userId) {
    return this.pendingRewards.get(userId) || 0;
  }

  /**
   * Claim rewards (MVP: just clear pending)
   */
  async claimRewards(userId) {
    const amount = this.pendingRewards.get(userId) || 0;

    if (amount < 10) {
      return {
        success: false,
        error: 'Minimum 10 KIK required to claim'
      };
    }

    this.pendingRewards.set(userId, 0);

    logger.info(`User ${userId} claimed ${amount} KIK`);

    return {
      success: true,
      amount
    };
  }
}

module.exports = new RewardService();
