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
// BOT COMMANDS - LAUNCH MINI APP
// ============================================

bot.start(async (ctx) => {
  try {
    const userId = ctx.user.id;
    const username = ctx.user.username || 'there';

    // Check for referral code
    const referralCode = ctx.message?.text.split(' ')[1];

    if (referralCode) {
      const result = await referralService.registerReferral(userId, referralCode);
      if (result.success && result.referrer) {
        await ctx.reply(`✅ You joined using a referral link! Your friend got a bonus token.`);
      }
    } else {
      await referralService.registerReferral(userId, null);
    }

    // Give starting tokens
    const claimResult = await tokenService.claimDailyTokens(userId);

    // Send welcome message with Mini App button
    const webAppUrl = `${process.env.WEBAPP_URL || 'http://localhost:3000'}`;

    await ctx.reply(
      `🎮 **Welcome to KIK Picture Tokens, ${username}!**\n\n` +
      `🎁 You've received ${claimResult.tokens?.length || 3} KIK tokens!\n\n` +
      `🎨 Attach pictures to your tokens\n` +
      `💎 Collect and level up\n` +
      `👥 Invite friends for rewards\n\n` +
      `👇 **Tap below to open the app:**`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Open KIK App', web_app: { url: webAppUrl } }],
            [{ text: '👥 Invite Friends', callback_data: 'invite' }],
            [{ text: 'ℹ️ Help', callback_data: 'help' }]
          ]
        }
      }
    );

    logger.info(`User ${userId} started bot, received ${claimResult.tokens?.length || 3} tokens`);
  } catch (error) {
    logger.error('Start command error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
});

bot.command('app', async (ctx) => {
  const webAppUrl = `${process.env.WEBAPP_URL || 'http://localhost:3000'}`;

  await ctx.reply(
    '🎨 **KIK Picture Tokens**\n\nOpen the app to manage your collection:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Open App', web_app: { url: webAppUrl } }]
        ]
      }
    }
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    `ℹ️ **KIK Picture Tokens - Help**\n\n` +
    `**Commands:**\n` +
    `/start - Get started\n` +
    `/app - Open Mini App\n` +
    `/help - Show this help\n\n` +
    `**How it works:**\n` +
    `1. Get 3 tokens per day\n` +
    `2. Attach pictures to ALL tokens\n` +
    `3. Get 3 more tomorrow if you completed all\n` +
    `4. Invite friends for bonus tokens\n\n` +
    `Use the Mini App for the best experience! 👇`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Open App', web_app: { url: process.env.WEBAPP_URL || 'http://localhost:3000' } }]
        ]
      }
    }
  );
});

// ============================================
// CALLBACK QUERY HANDLERS
// ============================================

bot.on('callback_query', async (ctx) => {
  const action = ctx.callbackQuery.data;

  try {
    if (action === 'invite') {
      const stats = await referralService.getReferralStats(ctx.user.id);
      const botUsername = ctx.botInfo.username;
      const referralLink = referralService.getReferralLink(stats.referralCode, botUsername);

      await ctx.reply(
        `👥 **Invite Friends**\n\n` +
        `Your referral link:\n${referralLink}\n\n` +
        `🎁 **Rewards:**\n` +
        `• +1 token when friend joins\n` +
        `• +1 token/day per active friend\n\n` +
        `📊 **Your Stats:**\n` +
        `• Referrals: ${stats.directReferrals}\n` +
        `• Total Earned: ${stats.totalEarnings} tokens`
      );
    } else if (action === 'help') {
      await ctx.reply(
        `ℹ️ **KIK Picture Tokens - Help**\n\n` +
        `Open the Mini App for full features! 🚀`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 Open App', web_app: { url: process.env.WEBAPP_URL || 'http://localhost:3000' } }]
            ]
          }
        }
      );
    }

    await ctx.answerCbQuery();
  } catch (error) {
    logger.error('Callback error:', error);
    await ctx.answerCbQuery('❌ Error');
  }
});

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
