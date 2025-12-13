/**
 * Picture Service - Attach Pictures to Tokens
 *
 * NEW CONCEPT:
 * - 1 token = 1 picture (always 1:1)
 * - Pictures can be uploaded OR AI-generated
 * - Private pictures: Encrypted, only owner sees
 * - Public pictures: Everyone sees, owner name optional
 */

const logger = require('../utils/logger');
const db = require('../database/db');
const crypto = require('crypto');
const OpenAI = require('openai');

class PictureService {
  constructor() {
    // Initialize OpenAI client
    this.openai = process.env.OPENAI_API_KEY 
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
    
    // Fallback to mock if no API key
    this.mockAIEnabled = !process.env.OPENAI_API_KEY;
    
    if (this.mockAIEnabled) {
      logger.warn('⚠️  OPENAI_API_KEY not set - using mock AI generation');
    } else {
      logger.info('✅ OpenAI client initialized');
    }
  }

  /**
   * Attach picture to token
   * @param {string} tokenId Token ID
   * @param {string} imageUrl URL or file path
   * @param {boolean} isPrivate Is picture private?
   * @param {boolean} allowChangeInFuture Allow making public later?
   * @returns {Promise<{success: boolean, picture: Object, message: string}>}
   */
  async attachPicture(tokenId, imageUrl, isPrivate = true, allowChangeInFuture = false) {
    const inMemoryDB = db.getInMemoryData();
    const token = inMemoryDB.tokens.get(tokenId);

    if (!token) {
      return {
        success: false,
        picture: null,
        message: 'Token not found'
      };
    }

    if (token.pictureId !== null) {
      return {
        success: false,
        picture: null,
        message: 'Token already has a picture attached'
      };
    }

    // Create picture
    const pictureId = `PIC_${Date.now()}_${tokenId}`;
    const picture = {
      id: pictureId,
      tokenId: tokenId,
      imageUrl: imageUrl,
      isPrivate: isPrivate,
      encryptionKey: isPrivate ? this._generateEncryptionKey() : null,
      allowChangeInFuture: allowChangeInFuture,
      uploadedAt: new Date(),
      ownerVisible: !isPrivate // For public pictures, show owner by default
    };

    // Store picture
    inMemoryDB.pictures.set(pictureId, picture);

    // Update token
    token.pictureId = pictureId;
    token.attachedAt = new Date();
    inMemoryDB.tokens.set(tokenId, token);

    // Award experience for attaching picture
    await this._awardExperience(token.owner, 10, 'picture_attached');

    logger.info(`Picture ${pictureId} attached to token ${tokenId} (private: ${isPrivate})`);

    return {
      success: true,
      picture,
      message: 'Picture attached successfully!'
    };
  }

  /**
   * Upload user photo (mock for MVP)
   * @param {Object} file Telegram file object
   * @param {number} userId User ID
   * @returns {Promise<{success: boolean, imageUrl: string}>}
   */
  async uploadPhoto(file, userId) {
    // In production: Download from Telegram, upload to IPFS
    // For MVP: Just create a mock URL

    const mockUrl = `https://ipfs.io/ipfs/mock_${Date.now()}_${userId}`;

    logger.info(`Photo uploaded for user ${userId}: ${mockUrl}`);

    return {
      success: true,
      imageUrl: mockUrl
    };
  }

  /**
   * Generate AI image using OpenAI DALL-E
   * @param {string} prompt AI generation prompt
   * @param {number} userId User ID
   * @returns {Promise<{success: boolean, imageUrl: string, message?: string}>}
   */
  async generateAI(prompt, userId) {
    // Use mock if no OpenAI API key
    if (this.mockAIEnabled) {
      const mockUrl = `https://placehold.co/600x400/png?text=${encodeURIComponent(prompt.substring(0, 20))}`;
      logger.info(`Mock AI image generated for user ${userId}: "${prompt}"`);
      
      return {
        success: true,
        imageUrl: mockUrl,
        message: 'Mock AI generation (set OPENAI_API_KEY for real generation)'
      };
    }

    // Real OpenAI DALL-E generation
    try {
      logger.info(`Generating AI image with DALL-E for user ${userId}: "${prompt}"`);
      
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid"
      });

      const imageUrl = response.data[0].url;
      
      logger.info(`✅ AI image generated successfully for user ${userId}`);

      return {
        success: true,
        imageUrl: imageUrl
      };
    } catch (error) {
      logger.error(`❌ OpenAI image generation failed for user ${userId}:`, error.message);
      
      // Fallback to mock on error
      const mockUrl = `https://placehold.co/600x400/EE4444/FFFFFF/png?text=Generation+Failed`;
      
      return {
        success: false,
        imageUrl: mockUrl,
        message: `AI generation failed: ${error.message}`
      };
    }
  }

  /**
   * Make private picture public
   * @param {string} pictureId Picture ID
   * @param {number} userId User ID (must be owner)
   * @param {boolean} showOwner Show owner name?
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async makePublic(pictureId, userId, showOwner = true) {
    const inMemoryDB = db.getInMemoryData();
    const picture = inMemoryDB.pictures.get(pictureId);

    if (!picture) {
      return { success: false, message: 'Picture not found' };
    }

    // Verify ownership
    const token = inMemoryDB.tokens.get(picture.tokenId);
    if (!token || token.owner !== userId) {
      return { success: false, message: 'Not your picture' };
    }

    if (!picture.isPrivate) {
      return { success: false, message: 'Picture already public' };
    }

    if (!picture.allowChangeInFuture) {
      return { success: false, message: 'Cannot make this picture public (permission not set)' };
    }

    // Update picture
    picture.isPrivate = false;
    picture.encryptionKey = null; // Remove encryption key
    picture.ownerVisible = showOwner;
    inMemoryDB.pictures.set(pictureId, picture);

    // Award experience for creating public content
    await this._awardExperience(userId, 20, 'public_picture_created');

    logger.info(`Picture ${pictureId} made public by user ${userId}`);

    return { success: true, message: 'Picture is now public!' };
  }

  /**
   * Get picture by ID
   * @param {string} pictureId Picture ID
   * @param {number} requestingUserId User requesting (for privacy check)
   * @returns {Object|null} Picture object or null if no access
   */
  getPicture(pictureId, requestingUserId) {
    const inMemoryDB = db.getInMemoryData();
    const picture = inMemoryDB.pictures.get(pictureId);

    if (!picture) return null;

    // Check privacy
    if (picture.isPrivate) {
      const token = inMemoryDB.tokens.get(picture.tokenId);
      if (!token || token.owner !== requestingUserId) {
        // Private picture, not owner - return limited info
        return {
          id: picture.id,
          isPrivate: true,
          message: 'Private picture'
        };
      }
    }

    return picture;
  }

  /**
   * Get all pictures for token
   * @param {string} tokenId Token ID
   * @returns {Object|null} Picture object
   */
  getPictureByToken(tokenId) {
    const inMemoryDB = db.getInMemoryData();
    return Array.from(inMemoryDB.pictures.values()).find(p => p.tokenId === tokenId) || null;
  }

  /**
   * Get user's collection (all pictures)
   * @param {number} userId User ID
   * @param {boolean} publicOnly Only public pictures?
   * @returns {Array} User's pictures
   */
  getUserCollection(userId, publicOnly = false) {
    const inMemoryDB = db.getInMemoryData();
    const userTokens = Array.from(inMemoryDB.tokens.values()).filter(t => t.owner === userId);

    const pictures = userTokens
      .map(token => {
        if (!token.pictureId) return null;
        return inMemoryDB.pictures.get(token.pictureId);
      })
      .filter(p => p !== null);

    if (publicOnly) {
      return pictures.filter(p => !p.isPrivate);
    }

    return pictures;
  }

  /**
   * Get stats for user
   * @param {number} userId User ID
   * @returns {Object} Stats
   */
  getUserStats(userId) {
    const inMemoryDB = db.getInMemoryData();
    const userTokens = Array.from(inMemoryDB.tokens.values()).filter(t => t.owner === userId);
    const attached = userTokens.filter(t => t.pictureId !== null).length;
    const unattached = userTokens.length - attached;

    const pictures = this.getUserCollection(userId);
    const privatePictures = pictures.filter(p => p.isPrivate).length;
    const publicPictures = pictures.filter(p => !p.isPrivate).length;

    return {
      totalTokens: userTokens.length,
      attached,
      unattached,
      privatePictures,
      publicPictures
    };
  }

  // ========== HELPER METHODS ==========

  /**
   * Generate encryption key for private pictures
   */
  _generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Award experience to user
   */
  async _awardExperience(userId, amount, reason) {
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

    userStats.experience += amount;

    // Level up logic (simple exponential)
    const newLevel = this._calculateLevel(userStats.experience);
    if (newLevel > userStats.level) {
      userStats.level = newLevel;
      logger.info(`User ${userId} leveled up to Level ${newLevel}!`);
    }

    inMemoryDB.userStats.set(userId, userStats);

    // Also update user object
    const user = Array.from(inMemoryDB.users.values()).find(u => u.id === userId);
    if (user) {
      user.experience = userStats.experience;
      user.level = userStats.level;
      inMemoryDB.users.set(userId, user);
    }

    logger.info(`User ${userId} +${amount} XP for ${reason} (Total: ${userStats.experience} XP)`);
  }

  /**
   * Calculate level from experience
   */
  _calculateLevel(experience) {
    // Level thresholds (from NEW_CONCEPT.md)
    const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000];

    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (experience >= thresholds[i]) {
        return i + 1;
      }
    }

    return 1;
  }
}

module.exports = new PictureService();
