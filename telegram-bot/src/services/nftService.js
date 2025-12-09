/**
 * NFT Service (MVP - Mock Implementation)
 * For production: Integrate with DALL-E/Stable Diffusion + IPFS + CollectiblesNFT contract
 */

const logger = require('../utils/logger');

class NFTService {
  constructor() {
    // In-memory NFT storage
    this.nfts = new Map();
    this.nextTokenId = 1;
  }

  /**
   * Create AI-generated NFT (MVP: return mock data)
   */
  async createNFT(userId, prompt) {
    logger.info(`Creating NFT for user ${userId} with prompt: "${prompt}"`);

    // Mock NFT creation
    const tokenId = this.nextTokenId++;
    const nft = {
      tokenId,
      owner: userId,
      creator: userId,
      prompt,
      name: `KIK Collectible #${tokenId}`,
      imageUrl: `https://picsum.photos/seed/${tokenId}/512/512`, // Random placeholder image
      rarity: this._determineRarity(),
      createdAt: new Date()
    };

    this.nfts.set(tokenId, nft);

    return {
      success: true,
      nft
    };
  }

  /**
   * Get user's NFTs
   */
  async getUserNFTs(userId) {
    const userNFTs = Array.from(this.nfts.values())
      .filter(nft => nft.owner === userId);

    return userNFTs;
  }

  /**
   * Get NFT by token ID
   */
  async getNFT(tokenId) {
    return this.nfts.get(tokenId) || null;
  }

  /**
   * Transfer NFT (gift)
   */
  async transferNFT(tokenId, fromUserId, toUserId) {
    const nft = this.nfts.get(tokenId);

    if (!nft) {
      return { success: false, error: 'NFT not found' };
    }

    if (nft.owner !== fromUserId) {
      return { success: false, error: 'You are not the owner' };
    }

    nft.owner = toUserId;
    this.nfts.set(tokenId, nft);

    logger.info(`NFT #${tokenId} transferred from ${fromUserId} to ${toUserId}`);

    return { success: true, nft };
  }

  /**
   * Determine rarity (random)
   */
  _determineRarity() {
    const rand = Math.random();

    if (rand < 0.01) return 'Legendary'; // 1%
    if (rand < 0.10) return 'Epic';      // 9%
    if (rand < 0.30) return 'Rare';      // 20%
    return 'Common';                     // 70%
  }

  /**
   * Get all NFTs (for admin)
   */
  getAllNFTs() {
    return Array.from(this.nfts.values());
  }
}

module.exports = new NFTService();
