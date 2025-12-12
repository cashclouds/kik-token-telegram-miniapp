// Claim daily tokens endpoint
const db = require('../src/database/db');
const tokenService = require('../src/services/tokenService');
const logger = require('../src/utils/logger');

module.exports = async (req, res) => {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { userId } = req.body;

    // Get user
    const inMemoryDB = db.getInMemoryData();
    const user = Array.from(inMemoryDB.users.values()).find(u => u.telegram_id == userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Try to claim
    const result = await tokenService.claimDailyTokens(user.id);

    if (result.success) {
      // Also get referral bonus
      const refBonus = await tokenService.getReferralBonus(user.id);

      res.json({
        success: true,
        tokens: result.tokens.length + refBonus.tokens,
        message: result.message
      });
    } else {
      res.json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    logger.error('API Error - Claim:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
