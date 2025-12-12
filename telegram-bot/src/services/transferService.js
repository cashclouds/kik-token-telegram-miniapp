/**
 * Transfer Service - Token Transfers and History
 */

const logger = require('../utils/logger');
const db = require('../database/db');
const { ethers } = require('ethers');

class TransferService {
  constructor() {
    this.transferHistory = new Map(); // transferId -> { from, to, amount, timestamp, type }
    this.pendingTransfers = new Map(); // transferId -> transferData
  }

  /**
   * Transfer tokens between users
   */
  async transferTokens(fromUserId, toUserId, amount) {
    try {
      const inMemoryDB = db.getInMemoryData();

      // Validate users
      const fromUser = inMemoryDB.users.get(fromUserId);
      const toUser = inMemoryDB.users.get(toUserId);

      if (!fromUser || !toUser) {
        return { success: false, error: 'User not found' };
      }

      // Check balance (mock - in real implementation, check blockchain)
      const fromBalance = fromUser.balance || 0;
      if (fromBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Create transfer record
      const transferId = `TRANSFER_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const transfer = {
        id: transferId,
        fromUserId,
        toUserId,
        amount,
        timestamp: new Date(),
        status: 'pending',
        type: 'transfer',
        blockchainTx: null
      };

      this.pendingTransfers.set(transferId, transfer);

      // Update balances (mock)
      fromUser.balance -= amount;
      toUser.balance += amount;

      inMemoryDB.users.set(fromUserId, fromUser);
      inMemoryDB.users.set(toUserId, toUser);

      logger.info(`Transfer initiated: ${fromUserId} -> ${toUserId}, Amount: ${amount} KIK`);

      return {
        success: true,
        transferId,
        message: 'Transfer initiated successfully'
      };
    } catch (error) {
      logger.error('Transfer error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete transfer with blockchain transaction
   */
  async completeTransfer(transferId, txHash) {
    try {
      const transfer = this.pendingTransfers.get(transferId);

      if (!transfer) {
        return { success: false, error: 'Transfer not found' };
      }

      // Update transfer status
      transfer.status = 'completed';
      transfer.blockchainTx = txHash;
      transfer.completedAt = new Date();

      // Add to transfer history
      this.transferHistory.set(transferId, transfer);
      this.pendingTransfers.delete(transferId);

      logger.info(`Transfer completed: ${transferId}, TX: ${txHash}`);

      return {
        success: true,
        transferId,
        txHash,
        message: 'Transfer completed successfully'
      };
    } catch (error) {
      logger.error('Complete transfer error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transfer history for user
   */
  async getTransferHistory(userId) {
    try {
      const history = [];

      // Get all transfers where user is sender or receiver
      for (const [transferId, transfer] of this.transferHistory.entries()) {
        if (transfer.fromUserId === userId || transfer.toUserId === userId) {
          const inMemoryDB = db.getInMemoryData();
          const fromUser = inMemoryDB.users.get(transfer.fromUserId);
          const toUser = inMemoryDB.users.get(transfer.toUserId);

          history.push({
            transferId,
            fromUser: fromUser ? fromUser.username || `User ${transfer.fromUserId}` : 'Unknown',
            toUser: toUser ? toUser.username || `User ${transfer.toUserId}` : 'Unknown',
            amount: transfer.amount,
            timestamp: transfer.timestamp,
            status: transfer.status,
            type: transfer.type,
            txHash: transfer.blockchainTx
          });
        }
      }

      // Sort by most recent
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return {
        success: true,
        history,
        totalTransfers: history.length
      };
    } catch (error) {
      logger.error('Get transfer history error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get token ownership history
   */
  async getTokenOwnershipHistory(tokenId) {
    try {
      const inMemoryDB = db.getInMemoryData();
      const token = inMemoryDB.tokens.get(tokenId);

      if (!token) {
        return { success: false, error: 'Token not found' };
      }

      // Get ownership history (mock - in real implementation, query blockchain)
      const ownershipHistory = [];

      // Add initial owner
      ownershipHistory.push({
        ownerId: token.owner,
        ownerName: `User ${token.owner}`,
        fromDate: token.createdAt,
        toDate: token.attachedAt || null,
        transferType: 'initial'
      });

      // If token has been transferred, add current owner
      if (token.currentHolder && token.currentHolder !== token.owner) {
        ownershipHistory.push({
          ownerId: token.currentHolder,
          ownerName: `User ${token.currentHolder}`,
          fromDate: token.attachedAt,
          toDate: null,
          transferType: 'transfer'
        });
      }

      return {
        success: true,
        tokenId,
        currentOwner: token.owner,
        currentHolder: token.currentHolder || token.owner,
        ownershipHistory
      };
    } catch (error) {
      logger.error('Get token ownership history error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Prepare blockchain transaction for transfer
   */
  async prepareBlockchainTransfer(fromAddress, toAddress, amount) {
    try {
      // In real implementation, this would interact with the smart contract
      // For mock purposes, return a simulated transaction

      const txData = {
        from: fromAddress,
        to: toAddress,
        value: ethers.utils.parseEther(amount.toString()),
        data: '0x', // Would contain contract call data
        gasLimit: ethers.utils.hexlify(200000),
        gasPrice: ethers.utils.parseUnits('10', 'gwei')
      };

      return {
        success: true,
        txData,
        estimatedFee: '0.002 MATIC'
      };
    } catch (error) {
      logger.error('Prepare blockchain transfer error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TransferService();
