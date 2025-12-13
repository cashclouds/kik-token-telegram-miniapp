/**
 * Photo Upload API Endpoint (MVP)
 *
 * Supports TWO formats:
 * 1) JSON body (used by Mini App app.js today):
 *    { userId, photoData (dataURL/base64), isPrivate }
 * 2) multipart/form-data (optional, for future):
 *    photo=<file>, userId, tokenId, isPrivate
 *
 * Behavior:
 * - If tokenId is not provided, picks the first unattached token for the user.
 * - If Cloudinary is configured and photoData/file is available, uploads there.
 * - Otherwise falls back to a mock URL (so MVP works without Cloudinary).
 */

const db = require('../src/database/db');
const tokenService = require('../src/services/tokenService');
const pictureService = require('../src/services/pictureService');
const logger = require('../src/utils/logger');

let multer;
let cloudinary;

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function initCloudinaryIfNeeded() {
  if (!isCloudinaryConfigured()) return null;

  if (!cloudinary) {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  return cloudinary;
}

async function uploadDataUrlToCloudinary(dataUrl, { userId, tokenId }) {
  const cl = initCloudinaryIfNeeded();
  if (!cl) return null;

  const result = await cl.uploader.upload(dataUrl, {
    folder: 'kik-tokens',
    public_id: `token_${tokenId || 'unattached'}_${Date.now()}`,
    tags: [`user_${userId}`],
    resource_type: 'image'
  });

  return result?.secure_url || null;
}

async function uploadBufferToCloudinary(buffer, { userId, tokenId }) {
  const cl = initCloudinaryIfNeeded();
  if (!cl) return null;

  return new Promise((resolve, reject) => {
    const uploadStream = cl.uploader.upload_stream(
      {
        folder: 'kik-tokens',
        public_id: `token_${tokenId || 'unattached'}_${Date.now()}`,
        tags: [`user_${userId}`],
        resource_type: 'image'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || null);
      }
    );

    uploadStream.end(buffer);
  });
}

function enableCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

function getUserByTelegramId(telegramId) {
  const inMemoryDB = db.getInMemoryData();
  return Array.from(inMemoryDB.users.values()).find(u => u.telegram_id == telegramId) || null;
}

function pickUnattachedTokenId(userId) {
  const unattached = tokenService.getUserTokens(userId, true);
  if (!unattached || unattached.length === 0) return null;
  return unattached[0].id;
}

async function handleJsonUpload(req, res) {
  const { userId, photoData, isPrivate } = req.body || {};

  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }

  let user = getUserByTelegramId(userId);

  // Auto-create user if not found (Mini App can be opened before bot interaction)
  if (!user) {
    user = await db.getOrCreateUser({
      id: Number(userId),
      username: null
    });
  }

  // Pick token automatically
  const tokenId = pickUnattachedTokenId(user.id);
  if (!tokenId) {
    return res.status(400).json({
      success: false,
      error: 'No unattached tokens available',
      hint: 'User must claim daily tokens first'
    });
  }

  // Upload image
  let imageUrl = null;

  if (photoData && isCloudinaryConfigured()) {
    try {
      imageUrl = await uploadDataUrlToCloudinary(photoData, { userId, tokenId });
    } catch (e) {
      logger.warn('Cloudinary upload (dataUrl) failed, falling back to mock URL: ' + e.message);
    }
  }

  // Fallback for MVP
  if (!imageUrl) {
    const mock = await pictureService.uploadPhoto(null, user.id);
    imageUrl = mock.imageUrl;
  }

  const attachResult = await pictureService.attachPicture(
    tokenId,
    imageUrl,
    Boolean(isPrivate),
    true // allowChangeInFuture
  );

  // Update timer for daily-claim logic
  tokenService.updateLastPictureAttached(user.id, new Date());

  return res.status(200).json({
    success: true,
    tokenId,
    picture: {
      id: attachResult.picture?.id,
      imageUrl: attachResult.picture?.imageUrl,
      isPrivate: attachResult.picture?.isPrivate
    }
  });
}

async function handleMultipartUpload(req, res) {
  // Lazy-require multer only when needed
  if (!multer) {
    multer = require('multer');
  }

  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }
  }).single('photo');

  await new Promise((resolve, reject) => {
    upload(req, res, (err) => (err ? reject(err) : resolve()));
  });

  const { userId, tokenId: tokenIdFromBody, isPrivate } = req.body || {};

  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }

  let user = getUserByTelegramId(userId);

  // Auto-create user if not found (Mini App can be opened before bot interaction)
  if (!user) {
    user = await db.getOrCreateUser({
      id: Number(userId),
      username: null
    });
  }

  // Pick token automatically if not provided
  const tokenId = tokenIdFromBody || pickUnattachedTokenId(user.id);
  if (!tokenId) {
    return res.status(400).json({
      success: false,
      error: 'No unattached tokens available',
      hint: 'User must claim daily tokens first'
    });
  }

  let imageUrl = null;

  if (req.file && isCloudinaryConfigured()) {
    try {
      imageUrl = await uploadBufferToCloudinary(req.file.buffer, { userId, tokenId });
    } catch (e) {
      logger.warn('Cloudinary upload (buffer) failed, falling back to mock URL: ' + e.message);
    }
  }

  if (!imageUrl) {
    const mock = await pictureService.uploadPhoto(null, user.id);
    imageUrl = mock.imageUrl;
  }

  const attachResult = await pictureService.attachPicture(
    tokenId,
    imageUrl,
    String(isPrivate) === 'true' || isPrivate === true,
    true
  );

  tokenService.updateLastPictureAttached(user.id, new Date());

  return res.status(200).json({
    success: true,
    tokenId,
    picture: {
      id: attachResult.picture?.id,
      imageUrl: attachResult.picture?.imageUrl,
      isPrivate: attachResult.picture?.isPrivate
    }
  });
}

module.exports = async (req, res) => {
  try {
    enableCors(res);

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const contentType = (req.headers['content-type'] || '').toLowerCase();

    // JSON upload (Mini App current)
    if (contentType.includes('application/json')) {
      return await handleJsonUpload(req, res);
    }

    // multipart upload (optional)
    if (contentType.includes('multipart/form-data')) {
      return await handleMultipartUpload(req, res);
    }

    // Unsupported
    return res.status(415).json({
      success: false,
      error: 'Unsupported Content-Type',
      expected: ['application/json', 'multipart/form-data']
    });
  } catch (error) {
    logger.error('API Error - Upload Photo:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload photo',
      details: error.message
    });
  }
};
