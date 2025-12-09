const redis = require('../utils/redis');
const db = require('../database/db');
const logger = require('../utils/logger');
const axios = require('axios');

/**
 * Ad Manager Service
 * Handles boot ads and rewarded video ads
 */
class AdManager {
  constructor() {
    this.bootAds = [];
    this.rewardAds = [];
    this.impressions = new Map();
  }

  /**
   * Get boot ad (shown on app launch)
   * @returns {Promise<Object|null>} Ad data
   */
  async getBootAd() {
    try {
      // Try Telegram Ads first (if available)
      if (process.env.TELEGRAM_ADS_TOKEN) {
        const ad = await this.getTelegramAd('interstitial');
        if (ad) return ad;
      }

      // Fallback to custom ad network or direct campaigns
      return await this.getCustomBootAd();

    } catch (error) {
      logger.error('Get boot ad error:', error);
      return null;
    }
  }

  /**
   * Get rewarded video ad
   * @returns {Promise<Object|null>} Ad data
   */
  async getRewardAd() {
    try {
      // Try Telegram Ads first
      if (process.env.TELEGRAM_ADS_TOKEN) {
        const ad = await this.getTelegramAd('rewarded_video');
        if (ad) return ad;
      }

      // Fallback to custom rewarded ads
      return await this.getCustomRewardAd();

    } catch (error) {
      logger.error('Get reward ad error:', error);
      return null;
    }
  }

  /**
   * Get ad from Telegram Ads API
   * @param {string} type - Ad type (interstitial, rewarded_video)
   * @returns {Promise<Object|null>}
   */
  async getTelegramAd(type) {
    try {
      const response = await axios.post('https://ads.telegram.org/api/v1/ads/get', {
        token: process.env.TELEGRAM_ADS_TOKEN,
        type: type,
        format: type === 'interstitial' ? 'image' : 'video'
      });

      if (response.data && response.data.ad) {
        return {
          id: response.data.ad.id,
          type: type,
          network: 'telegram',
          title: response.data.ad.title,
          description: response.data.ad.description,
          imageUrl: response.data.ad.image_url,
          videoUrl: response.data.ad.video_url,
          clickUrl: response.data.ad.click_url,
          duration: response.data.ad.duration || 5,
          cpm: response.data.ad.cpm || 5.0
        };
      }

      return null;

    } catch (error) {
      logger.warn('Telegram Ads API error:', error.message);
      return null;
    }
  }

  /**
   * Get custom boot ad from database
   * @returns {Promise<Object|null>}
   */
  async getCustomBootAd() {
    try {
      // Get active boot ad campaigns from database
      const campaigns = await db.query(
        `SELECT * FROM ad_campaigns
         WHERE type = 'boot'
         AND status = 'active'
         AND start_date <= NOW()
         AND end_date >= NOW()
         ORDER BY priority DESC, cpm DESC
         LIMIT 1`
      );

      if (campaigns.rows.length === 0) {
        return null;
      }

      const campaign = campaigns.rows[0];

      return {
        id: campaign.id,
        type: 'boot',
        network: 'custom',
        title: campaign.title,
        description: campaign.description,
        imageUrl: campaign.image_url,
        clickUrl: campaign.click_url,
        duration: 5,
        cpm: campaign.cpm
      };

    } catch (error) {
      logger.error('Get custom boot ad error:', error);
      return null;
    }
  }

  /**
   * Get custom rewarded video ad
   * @returns {Promise<Object|null>}
   */
  async getCustomRewardAd() {
    try {
      const campaigns = await db.query(
        `SELECT * FROM ad_campaigns
         WHERE type = 'rewarded'
         AND status = 'active'
         AND start_date <= NOW()
         AND end_date >= NOW()
         ORDER BY priority DESC, cpm DESC
         LIMIT 1`
      );

      if (campaigns.rows.length === 0) {
        return null;
      }

      const campaign = campaigns.rows[0];

      return {
        id: campaign.id,
        type: 'rewarded',
        network: 'custom',
        title: campaign.title,
        description: campaign.description,
        videoUrl: campaign.video_url,
        clickUrl: campaign.click_url,
        duration: campaign.duration || 30,
        cpm: campaign.cpm,
        reward: campaign.reward_amount || 50
      };

    } catch (error) {
      logger.error('Get custom reward ad error:', error);
      return null;
    }
  }

  /**
   * Track ad impression
   * @param {string} adId - Ad ID
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async trackImpression(adId, userId) {
    try {
      const timestamp = Date.now();
      const impressionKey = `ad_impression:${adId}:${userId}`;

      // Store impression in Redis (expires in 1 hour)
      await redis.setex(impressionKey, 3600, JSON.stringify({
        adId,
        userId,
        timestamp
      }));

      // Store in database for analytics
      await db.query(
        `INSERT INTO ad_impressions (ad_id, user_id, timestamp, ip_address)
         VALUES ($1, $2, NOW(), $3)`,
        [adId, userId, null] // IP can be added if available
      );

      // Update campaign stats
      await db.query(
        `UPDATE ad_campaigns
         SET impressions = impressions + 1
         WHERE id = $1`,
        [adId]
      );

      logger.info(`Ad impression tracked: ${adId} for user ${userId}`);

    } catch (error) {
      logger.error('Track impression error:', error);
    }
  }

  /**
   * Get impression data
   * @param {string} adId - Ad ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async getImpression(adId, userId) {
    try {
      const impressionKey = `ad_impression:${adId}:${userId}`;
      const data = await redis.get(impressionKey);

      if (!data) return null;

      return JSON.parse(data);

    } catch (error) {
      logger.error('Get impression error:', error);
      return null;
    }
  }

  /**
   * Track ad click
   * @param {string} adId - Ad ID
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async trackClick(adId, userId) {
    try {
      await db.query(
        `INSERT INTO ad_clicks (ad_id, user_id, timestamp)
         VALUES ($1, $2, NOW())`,
        [adId, userId]
      );

      // Update campaign stats
      await db.query(
        `UPDATE ad_campaigns
         SET clicks = clicks + 1
         WHERE id = $1`,
        [adId]
      );

      logger.info(`Ad click tracked: ${adId} for user ${userId}`);

    } catch (error) {
      logger.error('Track click error:', error);
    }
  }

  /**
   * Get ad revenue for period
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Object>}
   */
  async getRevenue(startDate, endDate) {
    try {
      const result = await db.query(
        `SELECT
          COUNT(DISTINCT ai.id) as total_impressions,
          COUNT(DISTINCT ac.id) as total_clicks,
          SUM(camp.cpm * ai.id / 1000) as estimated_revenue
         FROM ad_impressions ai
         LEFT JOIN ad_clicks ac ON ai.ad_id = ac.ad_id AND ai.user_id = ac.user_id
         LEFT JOIN ad_campaigns camp ON ai.ad_id = camp.id
         WHERE ai.timestamp BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      return {
        impressions: parseInt(result.rows[0].total_impressions) || 0,
        clicks: parseInt(result.rows[0].total_clicks) || 0,
        revenue: parseFloat(result.rows[0].estimated_revenue) || 0,
        ctr: result.rows[0].total_impressions > 0
          ? (result.rows[0].total_clicks / result.rows[0].total_impressions * 100).toFixed(2)
          : 0
      };

    } catch (error) {
      logger.error('Get revenue error:', error);
      return { impressions: 0, clicks: 0, revenue: 0, ctr: 0 };
    }
  }

  /**
   * Create ad campaign (for advertisers)
   * @param {Object} campaignData
   * @returns {Promise<Object>}
   */
  async createCampaign(campaignData) {
    try {
      const result = await db.query(
        `INSERT INTO ad_campaigns (
          title, description, type, image_url, video_url, click_url,
          cpm, duration, reward_amount, priority, status,
          start_date, end_date, budget, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
         RETURNING *`,
        [
          campaignData.title,
          campaignData.description,
          campaignData.type,
          campaignData.imageUrl,
          campaignData.videoUrl,
          campaignData.clickUrl,
          campaignData.cpm,
          campaignData.duration || null,
          campaignData.rewardAmount || null,
          campaignData.priority || 1,
          'active',
          campaignData.startDate,
          campaignData.endDate,
          campaignData.budget
        ]
      );

      logger.info(`Campaign created: ${result.rows[0].id}`);
      return result.rows[0];

    } catch (error) {
      logger.error('Create campaign error:', error);
      throw error;
    }
  }
}

module.exports = new AdManager();
