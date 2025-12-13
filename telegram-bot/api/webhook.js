// Telegram Bot Webhook Handler for Vercel
const { Telegraf } = require('telegraf');

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Import commands
const pictureTokensCommands = require('../src/commands/pictureTokens');
const db = require('../src/database/db');
const logger = require('../src/utils/logger');

// User session middleware
bot.use(async (ctx, next) => {
  if (ctx.from) {
    try {
      ctx.user = await db.getOrCreateUser(ctx.from);
      logger.info(`User ${ctx.from.id} accessed bot`);
    } catch (error) {
      logger.error('Error creating user:', error);
    }
  }
  return next();
});

// Commands
bot.start(pictureTokensCommands.startCommand);
bot.command('app', async (ctx) => {
  const webAppUrl = process.env.WEBAPP_URL || process.env.VERCEL_URL;
  await ctx.reply('🎨 **KIK Picture Tokens**\n\nOpen the app:', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '🚀 Open App', web_app: { url: `https://${webAppUrl}` } }
      ]]
    }
  });
});

bot.command('daily', pictureTokensCommands.dailyCommand);
bot.command('attach', pictureTokensCommands.attachCommand);
bot.command('collection', pictureTokensCommands.collectionCommand);
bot.command('invite', pictureTokensCommands.inviteCommand);
bot.command('help', pictureTokensCommands.helpCommand);
bot.command('about', pictureTokensCommands.aboutCommand);
bot.command('language', pictureTokensCommands.languageCommand);

// Event handlers
bot.on('callback_query', pictureTokensCommands.handleCallback);
bot.on('photo', pictureTokensCommands.handlePhoto);
bot.on('text', pictureTokensCommands.handleText);

// Error handler
bot.catch((err, ctx) => {
  logger.error('Bot error:', err);
  ctx.reply('❌ Something went wrong. Please try again.').catch(() => {});
});

// Serverless function handler
module.exports = async (req, res) => {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Webhook secret validation disabled
    // Telegram doesn't always send secret token in headers
    // If you need security, use setWebhook with secret_token parameter

    // Process the update
    await bot.handleUpdate(req.body);
    
    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
