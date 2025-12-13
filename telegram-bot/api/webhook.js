// Telegram Bot Webhook Handler for Vercel - SIMPLIFIED FOR TESTING
module.exports = async (req, res) => {
  try {
    // Log request for debugging
    console.log('Webhook called:', {
      method: req.method,
      hasBody: !!req.body,
      env: {
        hasBotToken: !!process.env.BOT_TOKEN,
        nodeEnv: process.env.NODE_ENV
      }
    });

    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if BOT_TOKEN is set
    if (!process.env.BOT_TOKEN) {
      console.error('BOT_TOKEN not set!');
      return res.status(500).json({ 
        error: 'BOT_TOKEN not configured',
        hint: 'Set BOT_TOKEN in Vercel environment variables'
      });
    }

    // For now, just acknowledge the webhook
    // Full bot implementation will be added after testing
    console.log('Webhook received successfully');
    
    res.status(200).json({ 
      ok: true,
      message: 'Webhook received (simplified mode)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook error:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};
