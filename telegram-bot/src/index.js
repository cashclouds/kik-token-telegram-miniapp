require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const express = require('express');
const path = require('path');
const logger = require('./utils/logger');
const db = require('./database/db');
const redis = require('./utils/redis');

// Import services
const tokenService = require('./services/tokenService');
const pictureService = require('./services/pictureService');
const referralService = require('./services/referralService');
const pictureTokensCommands = require('./commands/pictureTokens');

// Initialize Telegram bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Express server for Mini App and API
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// API ENDPOINTS FOR MINI APP
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get user data
app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user from database
    const inMemoryDB = db.getInMemoryData();
    const user = Array.from(inMemoryDB.users.values()).find(u => u.telegram_id == userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
});

// Claim daily tokens
app.post('/api/claim', async (req, res) => {
  try {
    const { userId } = req.body;

    // Get user
    const inMemoryDB = db.getInMemoryData();
    const user = Array.from(inMemoryDB.users.values()).find(u => u.telegram_id == userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
});

// Generate AI image
app.post('/api/generate-ai', async (req, res) => {
  try {
    const { userId, prompt } = req.body;

    const inMemoryDB = db.getInMemoryData();
    const user = Array.from(inMemoryDB.users.values()).find(u => u.telegram_id == userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate AI image
    const genResult = await pictureService.generateAI(prompt, user.id);

    if (!genResult.success) {
      return res.json({ success: false, error: 'Generation failed' });
    }

    // Get first unattached token
    const tokens = tokenService.getUserTokens(user.id, true);

    if (tokens.length === 0) {
      return res.json({ success: false, error: 'No tokens available' });
    }

    // Attach picture to token (default private)
    const attachResult = await pictureService.attachPicture(
      tokens[0].id,
      genResult.imageUrl,
      true, // private
      false // cannot change to public
    );

    res.json({
      success: true,
      picture: attachResult.picture
    });

  } catch (error) {
    logger.error('API Error - Generate AI:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload photo (mock)
app.post('/api/upload-photo', async (req, res) => {
  try {
    const { userId } = req.body;

    const inMemoryDB = db.getInMemoryData();
    const user = Array.from(inMemoryDB.users.values()).find(u => u.telegram_id == userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mock photo upload - generate placeholder URL
    const uploadResult = await pictureService.uploadPhoto(null, user.id);

    if (!uploadResult.success) {
      return res.json({ success: false, error: 'Upload failed' });
    }

    // Get first unattached token
    const tokens = tokenService.getUserTokens(user.id, true);

    if (tokens.length === 0) {
      return res.json({ success: false, error: 'No tokens available' });
    }

    // Attach picture to token (default private, can change to public)
    const attachResult = await pictureService.attachPicture(
      tokens[0].id,
      uploadResult.imageUrl,
      true, // private
      true // can change to public
    );

    res.json({
      success: true,
      picture: attachResult.picture
    });

  } catch (error) {
    logger.error('API Error - Upload Photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Make picture public
app.post('/api/make-public', async (req, res) => {
  try {
    const { userId, pictureId, showOwner } = req.body;

    const inMemoryDB = db.getInMemoryData();
    const user = Array.from(inMemoryDB.users.values()).find(u => u.telegram_id == userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Make picture public
    const result = await pictureService.makePublic(pictureId, user.id, showOwner !== false);

    res.json(result);

  } catch (error) {
    logger.error('API Error - Make Public:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { type = 'tokens', limit = 100 } = req.query;

    const inMemoryDB = db.getInMemoryData();
    const users = Array.from(inMemoryDB.users.values());

    let sortedUsers = [];

    switch (type) {
      case 'tokens':
        // Sort by total tokens
        sortedUsers = users.map(user => {
          const tokens = tokenService.getUserTokens(user.id);
          return {
            id: user.id,
            username: user.username || 'Anonymous',
            value: tokens.length,
            level: user.level
          };
        }).sort((a, b) => b.value - a.value);
        break;

      case 'level':
        // Sort by level and experience
        sortedUsers = users.map(user => ({
          id: user.id,
          username: user.username || 'Anonymous',
          value: user.level,
          experience: user.experience
        })).sort((a, b) => {
          if (b.value !== a.value) return b.value - a.value;
          return b.experience - a.experience;
        });
        break;

      case 'referrals':
        // Sort by referral count
        const referralPromises = users.map(async user => {
          const refStats = await referralService.getReferralStats(user.id);
          return {
            id: user.id,
            username: user.username || 'Anonymous',
            value: refStats.directReferrals,
            level: user.level
          };
        });
        sortedUsers = (await Promise.all(referralPromises))
          .sort((a, b) => b.value - a.value);
        break;

      default:
        return res.status(400).json({ error: 'Invalid leaderboard type' });
    }

    // Limit results
    const topUsers = sortedUsers.slice(0, parseInt(limit));

    res.json({
      type,
      leaderboard: topUsers
    });

  } catch (error) {
    logger.error('API Error - Leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get friends list
app.get('/api/friends', async (req, res) => {
  try {
    const { userId } = req.query;

    const inMemoryDB = db.getInMemoryData();
    const user = Array.from(inMemoryDB.users.values()).find(u => u.telegram_id == userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get referrals (friends are referrals in this system)
    const refStats = await referralService.getReferralStats(user.id);
    const referralIds = refStats.referralChain || [];

    // Get friend details
    const friends = referralIds.slice(0, 50).map(friendId => {
      const friend = Array.from(inMemoryDB.users.values()).find(u => u.id === friendId);
      if (!friend) return null;

      const tokens = tokenService.getUserTokens(friendId);
      const picStats = pictureService.getUserStats(friendId);

      return {
        id: friend.id,
        username: friend.username || 'Anonymous',
        level: friend.level,
        tokens: tokens.length,
        publicPictures: picStats.publicPictures
      };
    }).filter(f => f !== null);

    res.json({
      friends,
      total: referralIds.length
    });

  } catch (error) {
    logger.error('API Error - Friends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public collection
app.get('/api/collection/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const inMemoryDB = db.getInMemoryData();
    const user = Array.from(inMemoryDB.users.values()).find(u => u.telegram_id == userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get only public pictures
    const publicPictures = pictureService.getUserCollection(user.id, true);

    res.json({
      username: user.username || 'Anonymous',
      level: user.level,
      pictures: publicPictures.map(p => ({
        id: p.id,
        imageUrl: p.imageUrl,
        uploadedAt: p.uploadedAt,
        ownerVisible: p.ownerVisible
      }))
    });

  } catch (error) {
    logger.error('API Error - Collection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// MIDDLEWARE
// ============================================

// Session middleware
bot.use(session());

// Rate limiting middleware
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return next();

  const key = `rate_limit:${userId}`;
  const requests = await redis.incr(key);

  if (requests === 1) {
    await redis.expire(key, 60); // 1 minute window
  }

  if (requests > 30) {
    return ctx.reply('⏳ Too many requests. Please wait a minute.');
  }

  return next();
});

// User session middleware
bot.use(async (ctx, next) => {
  if (ctx.from) {
    ctx.user = await db.getOrCreateUser(ctx.from);
    logger.info(`User ${ctx.from.id} (@${ctx.from.username}) accessed bot`);
  }
  return next();
});

// ============================================
// BOT COMMANDS (UPDATED WITH ALL NEW COMMANDS)
// ============================================

bot.start(pictureTokensCommands.startCommand);

bot.command('app', async (ctx) => {
  const webAppUrl = process.env.WEBAPP_URL || 'http://localhost:3000';
  await ctx.reply('🎨 **KIK Picture Tokens**\n\nOpen the app:', {
    reply_markup: {
      inline_keyboard: [[
        { text: '🚀 Open App', web_app: { url: webAppUrl } }
      ]]
    }
  });
});

// Picture Tokens Commands
bot.command('daily', pictureTokensCommands.dailyCommand);
bot.command('attach', pictureTokensCommands.attachCommand);
bot.command('collection', pictureTokensCommands.collectionCommand);
bot.command('invite', pictureTokensCommands.inviteCommand);
bot.command('help', pictureTokensCommands.helpCommand);

// NEW COMMANDS - Multilingual Support
bot.command('about', pictureTokensCommands.aboutCommand);
bot.command('language', pictureTokensCommands.languageCommand);

// Event handlers
bot.on('callback_query', pictureTokensCommands.handleCallback);
bot.on('photo', pictureTokensCommands.handlePhoto);
bot.on('text', pictureTokensCommands.handleText);

// ============================================
// ERROR HANDLER
// ============================================

bot.catch((err, ctx) => {
  logger.error('Bot error:', err);
  ctx.reply('❌ Something went wrong. Please try again.').catch(() => {});
});

// ============================================
// START BOT
// ============================================

async function start() {
  try {
    // Database and Redis are already initialized (in-memory or real)
    logger.info('Database ready (in-memory mode)');
    logger.info('Redis ready (in-memory mode)');

    // Start Express server
    app.listen(process.env.PORT || 3000, () => {
      logger.info(`Server running on port ${process.env.PORT || 3000}`);
    });

    // Launch bot
    await bot.launch();

    logger.info('✅ Bot started successfully!');
    logger.info(`Bot username: @${bot.botInfo.username}`);
    logger.info('🌍 Multilingual support: 28 European languages');
    logger.info('💎 Tokenomics: 10,000,000,000 KIK tokens');
    logger.info('Ready to receive updates...');
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Start the bot
start();
