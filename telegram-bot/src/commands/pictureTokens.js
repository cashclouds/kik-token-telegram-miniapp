/**
 * Picture Tokens Commands - NEW CONCEPT
 *
 * Main bot commands for the new Picture Tokens game
 */

const { Markup } = require('telegraf');
const logger = require('../utils/logger');
const tokenService = require('../services/tokenService');
const pictureService = require('../services/pictureService');
const referralService = require('../services/referralService');

// ============================================
// COMMAND: /start
// ============================================

async function startCommand(ctx) {
  try {
    const userId = ctx.user.id;
    const username = ctx.user.username || 'there';

    // Check for referral code
    const referralCode = ctx.message?.text.split(' ')[1];

    if (referralCode) {
      // User joined with referral code
      const result = await referralService.registerReferral(userId, referralCode);

      if (result.success && result.referrer) {
        await ctx.reply(`✅ You joined using a referral link! Your friend got a bonus token.`);
      }
    } else {
      // User joined without referral - register anyway
      await referralService.registerReferral(userId, null);
    }

    // Give user 3 starting tokens
    const claimResult = await tokenService.claimDailyTokens(userId);

    const welcomeMessage = `🎮 Welcome to KIK Picture Tokens, ${username}!

🎁 You've received ${claimResult.tokens.length} KIK tokens!

🎨 **How it works:**
• Each token needs a picture (upload or AI generate)
• Attach pictures to ALL your tokens to get 3 more tomorrow
• Invite friends and earn bonus tokens daily
• Collect, trade, and level up!

**Your First Task:**
Attach pictures to your ${claimResult.tokens.length} tokens to get more tomorrow! 👇`;

    await ctx.reply(welcomeMessage, getMainMenu());

    logger.info(`User ${userId} started bot, received ${claimResult.tokens.length} tokens`);
  } catch (error) {
    logger.error('Start command error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

// ============================================
// COMMAND: /daily
// ============================================

async function dailyCommand(ctx) {
  try {
    const userId = ctx.user.id;

    // Check eligibility
    const eligibility = await tokenService.checkEligibility(userId);

    if (!eligibility.eligible) {
      const message = tokenService._getEligibilityMessage(eligibility);
      return await ctx.reply(`⏳ **Daily Tokens**\n\n${message}`);
    }

    // Claim daily tokens
    const claimResult = await tokenService.claimDailyTokens(userId);

    // Also check for referral bonus
    const referralBonus = await tokenService.getReferralBonus(userId);

    let message = `✅ **Daily Tokens Claimed!**\n\n🎁 You received ${claimResult.tokens.length} tokens`;

    if (referralBonus.tokens > 0) {
      message += `\n🌟 BONUS: +${referralBonus.tokens} tokens from active referrals!`;
    }

    message += `\n\n📊 **Remember:**\nAttach pictures to ALL tokens to get more tomorrow!`;

    await ctx.reply(message, getMainMenu());

    logger.info(`User ${userId} claimed daily tokens: ${claimResult.tokens.length + referralBonus.tokens} total`);
  } catch (error) {
    logger.error('Daily command error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

// ============================================
// COMMAND: /attach
// ============================================

async function attachCommand(ctx) {
  try {
    const userId = ctx.user.id;

    // Get unattached tokens
    const unattachedTokens = tokenService.getUserTokens(userId, true);

    if (unattachedTokens.length === 0) {
      return await ctx.reply(`✅ All your tokens have pictures!\n\nClaim more tokens tomorrow with /daily`);
    }

    const message = `🎨 **Attach Pictures**\n\nYou have ${unattachedTokens.length} tokens without pictures.\n\nChoose how to add a picture:`;

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📸 Upload Photo', callback_data: 'attach_upload' },
            { text: '🤖 Generate AI', callback_data: 'attach_ai' }
          ],
          [{ text: '« Back', callback_data: 'main_menu' }]
        ]
      }
    });
  } catch (error) {
    logger.error('Attach command error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

// ============================================
// COMMAND: /collection
// ============================================

async function collectionCommand(ctx) {
  try {
    const userId = ctx.user.id;

    const stats = pictureService.getUserStats(userId);
    const userStats = tokenService.getUserTokens(userId);

    const message = `📸 **Your Collection**

🎁 Total Tokens: ${stats.totalTokens}
✅ With Pictures: ${stats.attached}
⏳ Without Pictures: ${stats.unattached}

🔒 Private Pictures: ${stats.privatePictures}
🌍 Public Pictures: ${stats.publicPictures}

👤 Level: ${ctx.user.level || 1}
⭐ Experience: ${ctx.user.experience || 0} XP`;

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎨 Attach More', callback_data: 'attach_upload' },
            { text: '👀 View All', callback_data: 'view_collection' }
          ],
          [{ text: '« Back', callback_data: 'main_menu' }]
        ]
      }
    });
  } catch (error) {
    logger.error('Collection command error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

// ============================================
// COMMAND: /invite
// ============================================

async function inviteCommand(ctx) {
  try {
    const userId = ctx.user.id;

    const stats = await referralService.getReferralStats(userId);
    const botUsername = ctx.botInfo.username;
    const referralLink = referralService.getReferralLink(stats.referralCode, botUsername);

    const message = `👥 **Invite Friends**

Your referral link:
${referralLink}

🎁 **Rewards:**
• +1 token when friend joins
• +1 token/day per active friend

📊 **Your Stats:**
• Referrals: ${stats.directReferrals}
• Total Earned: ${stats.totalEarnings} tokens`;

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📤 Share Link', url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}` }],
          [{ text: '« Back', callback_data: 'main_menu' }]
        ]
      }
    });
  } catch (error) {
    logger.error('Invite command error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

// ============================================
// COMMAND: /help
// ============================================

async function helpCommand(ctx) {
  const message = `ℹ️ **KIK Picture Tokens - Help**

**Main Commands:**
/start - Get started and receive tokens
/daily - Claim your daily 3 tokens
/attach - Attach pictures to tokens
/collection - View your collection
/invite - Invite friends for rewards
/help - Show this help

**How it works:**
1. Get 3 tokens per day
2. Attach pictures to ALL tokens
3. If you complete yesterday's tokens → get 3 more today
4. Invite friends for bonus tokens

**Tips:**
• Pictures can be uploaded or AI-generated
• Make pictures private or public
• Level up by being active
• Invite friends for passive income`;

  await ctx.reply(message, getMainMenu());
}

// ============================================
// CALLBACK HANDLERS
// ============================================

async function handleCallback(ctx) {
  const action = ctx.callbackQuery.data;

  try {
    switch (action) {
      case 'main_menu':
        await ctx.editMessageText('🎮 **Main Menu**\n\nChoose an action:', getMainMenu());
        break;

      case 'attach_upload':
        await ctx.reply('📸 **Upload Photo**\n\nSend me a photo to attach to your token:');
        ctx.session = ctx.session || {};
        ctx.session.waitingForPhoto = true;
        await ctx.answerCbQuery();
        break;

      case 'attach_ai':
        await ctx.reply('🤖 **AI Generation**\n\nSend me a text prompt to generate an image:\n\nExample: "red ferrari", "sunset beach", "cute cat"');
        ctx.session = ctx.session || {};
        ctx.session.waitingForPrompt = true;
        await ctx.answerCbQuery();
        break;

      case 'view_collection':
        await showCollection(ctx);
        await ctx.answerCbQuery();
        break;

      default:
        await ctx.answerCbQuery();
    }
  } catch (error) {
    logger.error('Callback handler error:', error);
    await ctx.answerCbQuery('❌ Error');
  }
}

// ============================================
// PHOTO UPLOAD HANDLER
// ============================================

async function handlePhoto(ctx) {
  try {
    const userId = ctx.user.id;

    // Check if user is waiting for photo
    if (!ctx.session?.waitingForPhoto) {
      return; // Ignore photos not related to attachment
    }

    // Get largest photo
    const photo = ctx.message.photo[ctx.message.photo.length - 1];

    // Upload photo (mock for MVP)
    const uploadResult = await pictureService.uploadPhoto(photo, userId);

    if (!uploadResult.success) {
      return await ctx.reply('❌ Failed to upload photo. Try again.');
    }

    // Get first unattached token
    const unattachedTokens = tokenService.getUserTokens(userId, true);

    if (unattachedTokens.length === 0) {
      ctx.session.waitingForPhoto = false;
      return await ctx.reply('✅ All tokens already have pictures!');
    }

    const token = unattachedTokens[0];

    // Ask about privacy
    await ctx.reply('🔒 **Privacy Settings**\n\nMake this picture:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔒 Private (only you see)', callback_data: `privacy_private_${token.id}` },
            { text: '🌍 Public (everyone sees)', callback_data: `privacy_public_${token.id}` }
          ]
        ]
      }
    });

    // Store image URL in session
    ctx.session.pendingImage = uploadResult.imageUrl;
    ctx.session.pendingToken = token.id;
    ctx.session.waitingForPhoto = false;

    logger.info(`User ${userId} uploaded photo for token ${token.id}`);
  } catch (error) {
    logger.error('Photo handler error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

// ============================================
// TEXT MESSAGE HANDLER (for AI prompts)
// ============================================

async function handleText(ctx) {
  try {
    const userId = ctx.user.id;

    // Check if user is waiting for AI prompt
    if (!ctx.session?.waitingForPrompt) {
      return; // Ignore text not related to AI generation
    }

    const prompt = ctx.message.text;

    // Generate AI image (mock for MVP)
    await ctx.reply('🎨 Generating image... Please wait.');

    const generateResult = await pictureService.generateAI(prompt, userId);

    if (!generateResult.success) {
      ctx.session.waitingForPrompt = false;
      return await ctx.reply('❌ Failed to generate image. Try again.');
    }

    // Get first unattached token
    const unattachedTokens = tokenService.getUserTokens(userId, true);

    if (unattachedTokens.length === 0) {
      ctx.session.waitingForPrompt = false;
      return await ctx.reply('✅ All tokens already have pictures!');
    }

    const token = unattachedTokens[0];

    // Show generated image
    await ctx.replyWithPhoto(generateResult.imageUrl, {
      caption: '✨ **AI Generated Image**\n\nMake this picture:',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔒 Private', callback_data: `privacy_private_${token.id}` },
            { text: '🌍 Public', callback_data: `privacy_public_${token.id}` }
          ],
          [{ text: '🔄 Regenerate', callback_data: 'attach_ai' }]
        ]
      }
    });

    // Store image URL in session
    ctx.session.pendingImage = generateResult.imageUrl;
    ctx.session.pendingToken = token.id;
    ctx.session.waitingForPrompt = false;

    logger.info(`User ${userId} generated AI image for token ${token.id}`);
  } catch (error) {
    logger.error('Text handler error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getMainMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎨 Attach Picture', callback_data: 'attach_upload' },
          { text: '📸 Collection', callback_data: 'view_collection' }
        ],
        [
          { text: '🎁 Daily Claim', callback_data: 'claim_daily' },
          { text: '👥 Invite', callback_data: 'invite_friends' }
        ],
        [
          { text: 'ℹ️ Help', callback_data: 'show_help' }
        ]
      ]
    }
  };
}

async function showCollection(ctx) {
  const userId = ctx.user.id;
  const pictures = pictureService.getUserCollection(userId);

  if (pictures.length === 0) {
    return await ctx.editMessageText('📭 Your collection is empty. Attach pictures to your tokens!', getMainMenu());
  }

  // Show first picture (for MVP, can add pagination later)
  const picture = pictures[0];
  const token = tokenService.getToken(picture.tokenId);

  const caption = `🎨 **Token #1/${pictures.length}**

${picture.isPrivate ? '🔒 Private' : '🌍 Public'}
Created: ${new Date(picture.uploadedAt).toLocaleDateString()}

Use /collection to see stats`;

  await ctx.deleteMessage();
  await ctx.replyWithPhoto(picture.imageUrl, {
    caption,
    reply_markup: {
      inline_keyboard: [
        [{ text: '« Back to Menu', callback_data: 'main_menu' }]
      ]
    }
  });
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  startCommand,
  dailyCommand,
  attachCommand,
  collectionCommand,
  inviteCommand,
  helpCommand,
  handleCallback,
  handlePhoto,
  handleText
};
