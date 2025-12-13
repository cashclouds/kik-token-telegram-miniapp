/**
 * Picture Tokens Commands - MULTILINGUAL VERSION
 *
 * Main bot commands with full i18n support for all European languages
 */

const { Markup } = require('telegraf');
const logger = require('../utils/logger');
const tokenService = require('../services/tokenService');
const pictureService = require('../services/pictureService');
const referralService = require('../services/referralService');
const { getTranslator, detectLanguage, getLanguageKeyboard, LANGUAGE_NAMES } = require('../utils/i18n');

// ============================================
// COMMAND: /start
// ============================================

async function startCommand(ctx) {
  try {
    const userId = ctx.user.id;
    const username = ctx.user.username || ctx.user.first_name || 'there';
    
    // Detect and set user language
    const userLang = detectLanguage(ctx);
    ctx.user.language = userLang;
    const t = getTranslator(userLang);

    // Check for referral code
    const referralCode = ctx.message?.text.split(' ')[1];

    if (referralCode) {
      // User joined with referral code
      const result = await referralService.registerReferral(userId, referralCode);

      if (result.success && result.referrer) {
        await ctx.reply(t('welcome.referral_joined'));
      }
    } else {
      // User joined without referral - register anyway
      await referralService.registerReferral(userId, null);
    }

    // Give user 3 starting tokens
    const claimResult = await tokenService.claimDailyTokens(userId);

    const welcomeMessage = `${t('welcome.title', { username })}\n\n${t('welcome.received_tokens', { count: claimResult.tokens.length })}\n\n${t('welcome.how_it_works')}\n${t('welcome.step1')}\n${t('welcome.step2')}\n${t('welcome.step3')}\n${t('welcome.step4')}\n\n${t('welcome.first_task')}\n${t('welcome.first_task_desc', { count: claimResult.tokens.length })}`;

    await ctx.reply(welcomeMessage, getMainMenu(t));

    logger.info(`User ${userId} started bot (${userLang}), received ${claimResult.tokens.length} tokens`);
  } catch (error) {
    logger.error('Start command error:', error);
    const t = getTranslator(detectLanguage(ctx));
    await ctx.reply(t('errors.general'));
  }
}

// ============================================
// COMMAND: /about
// ============================================

async function aboutCommand(ctx) {
  try {
    const userLang = ctx.user?.language || detectLanguage(ctx);
    const t = getTranslator(userLang);

    const aboutMessage = `${t('about.title')}\n\n${t('about.description')}\n\n${t('about.what_you_get')}\n${t('about.benefit1')}\n${t('about.benefit2')}\n${t('about.benefit3')}\n${t('about.benefit4')}\n${t('about.benefit5')}\n\n${t('about.why_cool')}\n${t('about.cool1')}\n${t('about.cool2')}\n${t('about.cool3')}\n${t('about.cool4')}\n${t('about.cool5')}\n${t('about.cool6')}\n\n${t('about.how_help')}\n${t('about.help1')}\n${t('about.help2')}\n${t('about.help3')}\n${t('about.help4')}\n${t('about.help5')}\n\n${t('about.tokenomics')}\n${t('about.total_supply')}\n${t('about.distribution')}\n\n${t('about.cta')}`;

    await ctx.reply(aboutMessage, getMainMenu(t));
    
    logger.info(`User ${ctx.user.id} viewed about page (${userLang})`);
  } catch (error) {
    logger.error('About command error:', error);
    const t = getTranslator(detectLanguage(ctx));
    await ctx.reply(t('errors.general'));
  }
}

// ============================================
// COMMAND: /daily
// ============================================

async function dailyCommand(ctx) {
  try {
    const userId = ctx.user.id;
    const userLang = ctx.user?.language || detectLanguage(ctx);
    const t = getTranslator(userLang);

    // Check eligibility
    const eligibility = await tokenService.checkEligibility(userId);

    if (!eligibility.eligible) {
      // NEW: Show timer information if available
      let message = `${t('daily.title')}\n\n${t('daily.not_eligible')}`;

      if (eligibility.reason === 'timer_not_expired' && eligibility.nextAvailableAt) {
        const timerInfo = tokenService.getUserTimerInfo(userId);
        message += `\n\n${t('daily.timer_info', {
          hours: timerInfo.hoursLeft,
          time: eligibility.nextAvailableAt.toLocaleTimeString()
        })}`;
      }

      return await ctx.reply(message);
    }

    // Claim daily tokens
    const claimResult = await tokenService.claimDailyTokens(userId);

    // Also check for referral bonus
    const referralBonus = await tokenService.getReferralBonus(userId);

    let message = `${t('daily.claimed')}\n\n${t('daily.received', { count: claimResult.tokens.length })}`;

    if (referralBonus.tokens > 0) {
      message += `\n${t('daily.bonus', { count: referralBonus.tokens })}`;
    }

    // NEW: Show referral timer information
    if (referralBonus.timers && referralBonus.timers.length > 0) {
      const pendingTimers = referralBonus.timers.filter(timer => !timer.isAvailable);
      if (pendingTimers.length > 0) {
        message += `\n\n${t('daily.referral_timers_title')}`;
        pendingTimers.forEach(timer => {
          message += `\n${t('daily.referral_timer', {
            hours: timer.hoursLeft,
            time: timer.availableAt.toLocaleTimeString()
          })}`;
        });
      }
    }

    message += `\n\n${t('daily.remember')}`;

    await ctx.reply(message, getMainMenu(t));

    logger.info(`User ${userId} claimed daily tokens: ${claimResult.tokens.length + referralBonus.tokens} total (${userLang})`);
  } catch (error) {
    logger.error('Daily command error:', error);
    const t = getTranslator(detectLanguage(ctx));
    await ctx.reply(t('errors.general'));
  }
}

// ============================================
// COMMAND: /attach
// ============================================

async function attachCommand(ctx) {
  try {
    const userId = ctx.user.id;
    const userLang = ctx.user?.language || detectLanguage(ctx);
    const t = getTranslator(userLang);

    // Get unattached tokens
    const unattachedTokens = tokenService.getUserTokens(userId, true);

    if (unattachedTokens.length === 0) {
      return await ctx.reply(t('attach.all_attached'));
    }

    const message = `${t('attach.title')}\n\n${t('attach.count', { count: unattachedTokens.length })}\n\n${t('attach.choose')}`;

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: t('buttons.upload_photo'), callback_data: 'attach_upload' },
            { text: t('buttons.generate_ai'), callback_data: 'attach_ai' }
          ],
          [{ text: t('buttons.back'), callback_data: 'main_menu' }]
        ]
      }
    });
  } catch (error) {
    logger.error('Attach command error:', error);
    const t = getTranslator(detectLanguage(ctx));
    await ctx.reply(t('errors.general'));
  }
}

// ============================================
// COMMAND: /collection
// ============================================

async function collectionCommand(ctx) {
  try {
    const userId = ctx.user.id;
    const userLang = ctx.user?.language || detectLanguage(ctx);
    const t = getTranslator(userLang);

    const stats = pictureService.getUserStats(userId);

    const message = `${t('collection.title')}\n\n${t('collection.total_tokens', { count: stats.totalTokens })}\n${t('collection.with_pictures', { count: stats.attached })}\n${t('collection.without_pictures', { count: stats.unattached })}\n\n${t('collection.private_pictures', { count: stats.privatePictures })}\n${t('collection.public_pictures', { count: stats.publicPictures })}\n\n${t('collection.level', { level: ctx.user.level || 1 })}\n${t('collection.experience', { xp: ctx.user.experience || 0 })}`;

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: t('buttons.attach_more'), callback_data: 'attach_upload' },
            { text: t('buttons.view_all'), callback_data: 'view_collection' }
          ],
          [{ text: t('buttons.back'), callback_data: 'main_menu' }]
        ]
      }
    });
  } catch (error) {
    logger.error('Collection command error:', error);
    const t = getTranslator(detectLanguage(ctx));
    await ctx.reply(t('errors.general'));
  }
}

// ============================================
// COMMAND: /invite
// ============================================

async function inviteCommand(ctx) {
  try {
    const userId = ctx.user.id;
    const userLang = ctx.user?.language || detectLanguage(ctx);
    const t = getTranslator(userLang);

    const stats = await referralService.getReferralStats(userId);
    const botUsername = ctx.botInfo.username;
    const referralLink = referralService.getReferralLink(stats.referralCode, botUsername);

    let message = `${t('invite.title')}\n\n${t('invite.your_link')}\n${referralLink}\n\n${t('invite.rewards_title')}\n${t('invite.reward1')}\n${t('invite.reward2')}\n\n${t('invite.stats_title')}\n${t('invite.referrals', { count: stats.directReferrals })}\n${t('invite.total_earned', { count: stats.totalEarnings })}`;

    // NEW: Show referral timer information
    if (stats.referralTimers && stats.referralTimers.length > 0) {
      message += `\n\n${t('invite.referral_timers_title')}`;

      stats.referralTimers.forEach(timer => {
        const status = timer.isAvailable ? '✅' : '⏳';
        message += `\n${status} ${t('invite.referral_timer', {
          hours: timer.hoursLeft,
          time: timer.availableAt.toLocaleTimeString()
        })}`;
      });
    }

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: t('buttons.share_link'), url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}` }],
          [{ text: t('buttons.back'), callback_data: 'main_menu' }]
        ]
      }
    });
  } catch (error) {
    logger.error('Invite command error:', error);
    const t = getTranslator(detectLanguage(ctx));
    await ctx.reply(t('errors.general'));
  }
}

// ============================================
// COMMAND: /language
// ============================================

async function languageCommand(ctx) {
  try {
    const userLang = ctx.user?.language || detectLanguage(ctx);
    const t = getTranslator(userLang);
    
    const currentLang = LANGUAGE_NAMES[userLang] || 'English';
    const message = `${t('language.title')}\n\n${t('language.current', { language: currentLang })}`;

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: getLanguageKeyboard()
      }
    });
  } catch (error) {
    logger.error('Language command error:', error);
    const t = getTranslator(detectLanguage(ctx));
    await ctx.reply(t('errors.general'));
  }
}

// ============================================
// COMMAND: /help
// ============================================

async function helpCommand(ctx) {
  try {
    const userLang = ctx.user?.language || detectLanguage(ctx);
    const t = getTranslator(userLang);

    const message = `${t('help.title')}\n\n${t('help.commands')}\n${t('help.cmd_start')}\n${t('help.cmd_daily')}\n${t('help.cmd_attach')}\n${t('help.cmd_collection')}\n${t('help.cmd_invite')}\n${t('help.cmd_language')}\n${t('help.cmd_about')}\n${t('help.cmd_help')}\n\n${t('help.how_title')}\n${t('help.how1')}\n${t('help.how2')}\n${t('help.how3')}\n${t('help.how4')}\n\n${t('help.tips_title')}\n${t('help.tip1')}\n${t('help.tip2')}\n${t('help.tip3')}\n${t('help.tip4')}`;

    await ctx.reply(message, getMainMenu(t));
  } catch (error) {
    logger.error('Help command error:', error);
    const t = getTranslator(detectLanguage(ctx));
    await ctx.reply(t('errors.general'));
  }
}

// ============================================
// CALLBACK HANDLERS
// ============================================

async function handleCallback(ctx) {
  const action = ctx.callbackQuery.data;
  const userLang = ctx.user?.language || detectLanguage(ctx);
  const t = getTranslator(userLang);

  try {
    // Handle language selection
    if (action.startsWith('lang_')) {
      const selectedLang = action.replace('lang_', '');
      ctx.user.language = selectedLang;
      
      // Save language to database
      const db = require('../database/db');
      if (db.useInMemory) {
        // Update in-memory user
        const userData = db.getInMemoryData();
        const user = Array.from(userData.users.values()).find(u => u.id === ctx.user.id);
        if (user) {
          user.language = selectedLang;
        }
      }
      
      const newT = getTranslator(selectedLang);
      const langName = LANGUAGE_NAMES[selectedLang] || 'English';
      
      await ctx.editMessageText(
        newT('language.changed', { language: langName }),
        getMainMenu(newT)
      );
      
      logger.info(`User ${ctx.user.id} changed language to ${selectedLang}`);
      await ctx.answerCbQuery();
      return;
    }

    switch (action) {
      case 'main_menu':
        await ctx.editMessageText('🎮 **Main Menu**\n\n' + t('attach.choose'), getMainMenu(t));
        await ctx.answerCbQuery();
        break;

      case 'attach_upload':
        await ctx.reply(t('attach.upload_photo'));
        ctx.session = ctx.session || {};
        ctx.session.waitingForPhoto = true;
        await ctx.answerCbQuery();
        break;

      case 'attach_ai':
        await ctx.reply(t('attach.generate_ai'));
        ctx.session = ctx.session || {};
        ctx.session.waitingForPrompt = true;
        await ctx.answerCbQuery();
        break;

      case 'view_collection':
        await showCollection(ctx, t);
        await ctx.answerCbQuery();
        break;

      case 'claim_daily':
        await dailyCommand(ctx);
        await ctx.answerCbQuery();
        break;

      case 'invite_friends':
        await inviteCommand(ctx);
        await ctx.answerCbQuery();
        break;

      case 'show_help':
        await helpCommand(ctx);
        await ctx.answerCbQuery();
        break;

      case 'show_about':
        await aboutCommand(ctx);
        await ctx.answerCbQuery();
        break;

      case 'show_language':
        await languageCommand(ctx);
        await ctx.answerCbQuery();
        break;

      default:
        // Handle privacy callbacks
        if (action.startsWith('privacy_')) {
          const parts = action.split('_');
          const privacy = parts[1]; // 'private' or 'public'
          const tokenId = parts.slice(2).join('_');
          const isPrivate = privacy === 'private';

          if (!ctx.session?.pendingImage) {
            await ctx.answerCbQuery(t('errors.no_pending_image'));
            return;
          }

          const imageUrl = ctx.session.pendingImage;

          // Attach picture to token
          const attachResult = await pictureService.attachPicture(
            tokenId,
            imageUrl,
            isPrivate,
            !isPrivate
          );

          if (attachResult.success) {
            await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
            await ctx.reply(t('attach.success') + '\n\n' + (isPrivate ? '🔒 Private' : '🌍 Public'));

            // NEW: Update last picture attached timestamp for timer logic
            const tokenService = require('../services/tokenService');
            tokenService.updateLastPictureAttached(ctx.user.id, new Date());

            // Clear session
            delete ctx.session.pendingImage;
            delete ctx.session.pendingToken;
          } else {
            await ctx.reply(t('attach.failed', { message: attachResult.message }));
          }

          await ctx.answerCbQuery();
          return;
        }

        await ctx.answerCbQuery();
    }
  } catch (error) {
    logger.error('Callback handler error:', error);
    await ctx.answerCbQuery(t('errors.general'));
  }
}

// ============================================
// PHOTO UPLOAD HANDLER
// ============================================

async function handlePhoto(ctx) {
  try {
    const userId = ctx.user.id;
    const userLang = ctx.user?.language || detectLanguage(ctx);
    const t = getTranslator(userLang);

    // Check if user is waiting for photo
    if (!ctx.session?.waitingForPhoto) {
      return;
    }

    // Get largest photo
    const photo = ctx.message.photo[ctx.message.photo.length - 1];

    // Upload photo
    const uploadResult = await pictureService.uploadPhoto(photo, userId);

    if (!uploadResult.success) {
      return await ctx.reply(t('attach.upload_failed'));
    }

    // Get first unattached token
    const unattachedTokens = tokenService.getUserTokens(userId, true);

    if (unattachedTokens.length === 0) {
      ctx.session.waitingForPhoto = false;
      return await ctx.reply(t('attach.all_attached'));
    }

    const token = unattachedTokens[0];

    // Ask about privacy
    await ctx.reply(t('attach.privacy_title'), {
      reply_markup: {
        inline_keyboard: [
          [
            { text: t('attach.privacy_private'), callback_data: `privacy_private_${token.id}` },
            { text: t('attach.privacy_public'), callback_data: `privacy_public_${token.id}` }
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
    const t = getTranslator(detectLanguage(ctx));
    await ctx.reply(t('errors.general'));
  }
}

// ============================================
// TEXT MESSAGE HANDLER (for AI prompts)
// ============================================

async function handleText(ctx) {
  try {
    const userId = ctx.user.id;
    const userLang = ctx.user?.language || detectLanguage(ctx);
    const t = getTranslator(userLang);

    // Check if user is waiting for AI prompt
    if (!ctx.session?.waitingForPrompt) {
      return;
    }

    const prompt = ctx.message.text;

    // Generate AI image
    await ctx.reply(t('attach.generating'));

    const generateResult = await pictureService.generateAI(prompt, userId);

    if (!generateResult.success) {
      ctx.session.waitingForPrompt = false;
      return await ctx.reply(t('attach.generate_failed'));
    }

    // Get first unattached token
    const unattachedTokens = tokenService.getUserTokens(userId, true);

    if (unattachedTokens.length === 0) {
      ctx.session.waitingForPrompt = false;
      return await ctx.reply(t('attach.all_attached'));
    }

    const token = unattachedTokens[0];

    // Show generated image
    await ctx.replyWithPhoto(generateResult.imageUrl, {
      caption: `✨ **AI Generated Image**\n\n${t('attach.privacy_title')}`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: t('attach.privacy_private'), callback_data: `privacy_private_${token.id}` },
            { text: t('attach.privacy_public'), callback_data: `privacy_public_${token.id}` }
          ],
          [{ text: t('buttons.regenerate'), callback_data: 'attach_ai' }]
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
    const t = getTranslator(detectLanguage(ctx));
    await ctx.reply(t('errors.general'));
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getMainMenu(t) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: t('buttons.attach_picture'), callback_data: 'attach_upload' },
          { text: t('buttons.collection'), callback_data: 'view_collection' }
        ],
        [
          { text: t('buttons.daily_claim'), callback_data: 'claim_daily' },
          { text: t('buttons.invite'), callback_data: 'invite_friends' }
        ],
        [
          { text: t('buttons.about'), callback_data: 'show_about' },
          { text: t('buttons.language'), callback_data: 'show_language' },
          { text: t('buttons.help'), callback_data: 'show_help' }
        ]
      ]
    }
  };
}

async function showCollection(ctx, t) {
  const userId = ctx.user.id;
  const pictures = pictureService.getUserCollection(userId);

  if (pictures.length === 0) {
    return await ctx.editMessageText(t('collection.empty'), getMainMenu(t));
  }

  // Show first picture
  const picture = pictures[0];
  const privacy = picture.isPrivate ? '🔒 Private' : '🌍 Public';
  const date = new Date(picture.uploadedAt).toLocaleDateString();

  const caption = t('collection.token_info', {
    current: 1,
    total: pictures.length,
    privacy,
    date
  });

  await ctx.deleteMessage();
  await ctx.replyWithPhoto(picture.imageUrl, {
    caption,
    reply_markup: {
      inline_keyboard: [
        [{ text: t('buttons.back_to_menu'), callback_data: 'main_menu' }]
      ]
    }
  });
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  startCommand,
  aboutCommand,
  dailyCommand,
  attachCommand,
  collectionCommand,
  inviteCommand,
  languageCommand,
  helpCommand,
  handleCallback,
  handlePhoto,
  handleText
};
