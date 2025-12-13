/**
 * Photo Upload API Endpoint
 * Handles photo uploads to Cloudinary for KIK Picture Tokens
 */

const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  }
}).single('photo');

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'kik-tokens',
        resource_type: 'auto',
        transformation: [
          { width: 1024, height: 1024, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

// Main handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Parse multipart form data
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            reject(new Error('File too large. Maximum size is 5MB.'));
          } else if (err.message) {
            reject(err);
          } else {
            reject(new Error('Failed to upload file'));
          }
        } else {
          resolve();
        }
      });
    });

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Get userId and tokenId from form data
    const { userId, tokenId } = req.body;

    if (!userId || !tokenId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId or tokenId'
      });
    }

    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `token_${tokenId}_${Date.now()}`,
      tags: [`user_${userId}`, `token_${tokenId}`]
    });

    console.log('Upload successful:', result.secure_url);

    // Here you would normally save to database
    // For now, we'll use in-memory storage
    const db = require('../src/database/db');
    
    if (db.useInMemory) {
      const inMemoryData = db.getInMemoryData();
      
      // Save picture data
      const pictureId = `pic_${Date.now()}`;
      inMemoryData.pictures.set(pictureId, {
        id: pictureId,
        tokenId: tokenId,
        imageUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        isPrivate: req.body.isPrivate === 'true',
        uploadedAt: new Date().toISOString(),
        userId: userId
      });

      // Update token to mark as having picture
      if (inMemoryData.tokens.has(tokenId)) {
        const token = inMemoryData.tokens.get(tokenId);
        token.pictureId = pictureId;
        token.attachedAt = new Date().toISOString();
      }

      console.log('Saved to database');
    }

    // Return success response
    res.status(200).json({
      success: true,
      imageUrl: result.secure_url,
      tokenId: tokenId,
      cloudinaryId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes
    });

  } catch (error) {
    console.error('Upload error:', error);

    // Handle specific errors
    if (error.message.includes('File too large')) {
      return res.status(413).json({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      });
    }

    if (error.message.includes('Invalid file type')) {
      return res.status(415).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('cloud_name')) {
      return res.status(500).json({
        success: false,
        error: 'Cloudinary not configured. Please set environment variables.'
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: 'Failed to upload photo',
      details: error.message
    });
  }
};
