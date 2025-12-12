/**
 * Social Service - Friends and Levels System
 */

const logger = require('../utils/logger');
const db = require('../database/db');

class SocialService {
  constructor() {
    // In-memory social data
    this.socialData = new Map(); // userId -> { friends: [], level: number, experience: number }
  }

  /**
   * Get user's friends list
   */
  async getFriends(userId) {
    try {
      const inMemoryDB = db.getInMemoryData();
      const user = inMemoryDB.users.get(userId);

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Get user's referrals (friends)
      const referralService = require('./referralService');
      const referralStats = await referralService.getReferralStats(userId);

      // Get friends data
      const friends = [];
      const userStats = inMemoryDB.userStats.get(userId);

      if (userStats?.activeReferrals) {
        for (const friendId of userStats.activeReferrals) {
          const friend = inMemoryDB.users.get(friendId);
          const friendStats = inMemoryDB.userStats.get(friendId);

          if (friend && friendStats) {
            friends.push({
              userId: friend.id,
              username: friend.username || `User ${friend.id}`,
              level: friendStats.level,
              experience: friendStats.experience,
              streak: friendStats.streak || 0,
              lastActivity: friendStats.lastPictureAttached || null,
              publicPictures: this._getPublicPicturesCount(friendId)
            });
          }
        }
      }

      return {
        success: true,
        friends,
        totalFriends: friends.length,
        userLevel: userStats?.level || 1,
        userExperience: userStats?.experience || 0
      };
    } catch (error) {
      logger.error('Error getting friends:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get friend's public collection
   */
  async getFriendCollection(userId, friendId) {
    try {
      const inMemoryDB = db.getInMemoryData();
      const friend = inMemoryDB.users.get(friendId);

      if (!friend) {
        return { success: false, error: 'Friend not found' };
      }

      // Get public pictures
      const publicPictures = [];
      for (const [pictureId, picture] of inMemoryDB.pictures.entries()) {
        if (picture.owner === friendId && !picture.isPrivate) {
          publicPictures.push({
            pictureId,
            tokenId: picture.tokenId,
            imageUrl: picture.imageUrl,
            uploadedAt: picture.uploadedAt
          });
        }
      }

      return {
        success: true,
        username: friend.username || `User ${friend.id}`,
        level: friendStats?.level || 1,
        experience: friendStats?.experience || 0,
        publicPictures,
        totalPublicPictures: publicPictures.length
      };
    } catch (error) {
      logger.error('Error getting friend collection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user level and experience
   */
  async getUserLevel(userId) {
    try {
      const inMemoryDB = db.getInMemoryData();
      const userStats = inMemoryDB.userStats.get(userId);

      if (!userStats) {
        return {
          success: true,
          level: 1,
          experience: 0,
          nextLevelExperience: 100,
          progress: 0
        };
      }

      // Calculate level and progress
      const level = userStats.level || 1;
      const experience = userStats.experience || 0;
      const nextLevelExperience = this._calculateNextLevelExperience(level);
      const progress = Math.min(100, Math.floor((experience / nextLevelExperience) * 100));

      return {
        success: true,
        level,
        experience,
        nextLevelExperience,
        progress
      };
    } catch (error) {
      logger.error('Error getting user level:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add experience to user
   */
  async addExperience(userId, amount) {
    try {
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

      // Add experience
      userStats.experience += amount;

      // Check for level up
      const currentLevel = userStats.level;
      const nextLevelExperience = this._calculateNextLevelExperience(currentLevel);

      if (userStats.experience >= nextLevelExperience) {
        userStats.level++;
        userStats.experience = userStats.experience - nextLevelExperience;
        logger.info(`User ${userId} leveled up to level ${userStats.level}!`);
      }

      inMemoryDB.userStats.set(userId, userStats);

      return {
        success: true,
        newLevel: userStats.level,
        newExperience: userStats.experience
      };
    } catch (error) {
      logger.error('Error adding experience:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get friends activity
   */
  async getFriendsActivity(userId) {
    try {
      const inMemoryDB = db.getInMemoryData();
      const userStats = inMemoryDB.userStats.get(userId);

      if (!userStats?.activeReferrals) {
        return { success: true, activity: [] };
      }

      const activity = [];
      const now = new Date();

      for (const friendId of userStats.activeReferrals) {
        const friend = inMemoryDB.users.get(friendId);
        const friendStats = inMemoryDB.userStats.get(friendId);

        if (friend && friendStats) {
          const lastActivity = friendStats.lastPictureAttached
            ? new Date(friendStats.lastPictureAttached)
            : null;

          const hoursAgo = lastActivity
            ? Math.floor((now - lastActivity) / (1000 * 60 * 60))
            : null;

          activity.push({
            userId: friend.id,
            username: friend.username || `User ${friend.id}`,
            level: friendStats.level,
            experience: friendStats.experience,
            streak: friendStats.streak || 0,
            lastActivity: lastActivity ? lastActivity.toISOString() : null,
            hoursAgo: hoursAgo,
            isActiveToday: hoursAgo !== null && hoursAgo < 24,
            publicPictures: this._getPublicPicturesCount(friendId)
          });
        }
      }

      // Sort by most recent activity
      activity.sort((a, b) => {
        if (!a.lastActivity) return 1;
        if (!b.lastActivity) return -1;
        return new Date(b.lastActivity) - new Date(a.lastActivity);
      });

      return { success: true, activity };
    } catch (error) {
      logger.error('Error getting friends activity:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * Calculate experience needed for next level
   */
  _calculateNextLevelExperience(currentLevel) {
    // Level progression: 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, ...
    return Math.min(1000, 100 * currentLevel);
  }

  /**
   * Get count of public pictures for user
   */
  _getPublicPicturesCount(userId) {
    const inMemoryDB = db.getInMemoryData();
    let count = 0;

    for (const [pictureId, picture] of inMemoryDB.pictures.entries()) {
      if (picture.owner === userId && !picture.isPrivate) {
        count++;
      }
    }

    return count;
  }
}

module.exports = new SocialService();
