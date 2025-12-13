// Get user data API endpoint
const db = require('../../src/database/db');
const tokenService = require('../../src/services/tokenService');
const pictureService = require('../../src/services/pictureService');
const referralService = require('../../src/services/referralService');
const logger = require('../../src/utils/logger');

module.exports = async (req, res) => {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { userId } = req.query;

    // Get user from database
    const inMemoryDB = db.getInMemoryData();
    let user = Array.from(inMemoryDB.users.values()).find(u => u.telegram_id == userId);

    // Auto-create user if not found (Mini App can be opened before bot interaction)
    if (!user) {
      user = await db.getOrCreateUser({
        id: Number(userId),
        username: null
      });
    }

    // Get user stats
    const userStats = inMemoryDB.userStats.get(user.id);
    const tokens = tokenService.getUserTokens(user.id);
    const pictures = pictureService.getUserCollection(user.id);
    const picStats = pictureService.getUserStats(user.id);
    const refStats = await referralService.getReferralStats(user.id);

    res.json({
      id: user.id,
      username: user.username,
      level: user.level,
      experience: user.experience,
      language: user.language || 'en',
      tokens: {
        total: picStats.totalTokens,
        attached: picStats.attached,
        unattached: picStats.unattached
      },
      pictures: pictures.map(p => ({
        id: p.id,
        imageUrl: p.imageUrl,
        isPrivate: p.isPrivate
      })),
      referrals: {
        total: refStats.directReferrals,
        active: userStats?.activeReferrals?.length || 0,
        earned: refStats.totalEarnings
      },
      referralCode: user.referral_code
    });

  } catch (error) {
    logger.error('API Error - Get User:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
