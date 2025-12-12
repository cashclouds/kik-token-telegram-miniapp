/**
 * Rental Service - Token Rental Management
 */

const logger = require('../utils/logger');
const db = require('../database/db');

class RentalService {
  constructor() {
    this.activeRentals = new Map(); // rentalId -> rentalData
    this.rentalHistory = new Map(); // rentalId -> rentalData
    this.rentalTimers = new Map(); // userId -> timerId
  }

  /**
   * Rent tokens to another user (temporary transfer)
   */
  async rentTokens(ownerId, renterId, tokenId, durationMinutes) {
    try {
      const inMemoryDB = db.getInMemoryData();

      // Validate users and token
      const owner = inMemoryDB.users.get(ownerId);
      const renter = inMemoryDB.users.get(renterId);
      const token = inMemoryDB.tokens.get(tokenId);

      if (!owner || !renter) {
        return { success: false, error: 'User not found' };
      }

      if (!token) {
        return { success: false, error: 'Token not found' };
      }

      // Check if token is already rented
      if (token.currentHolder && token.currentHolder !== token.owner) {
        return { success: false, error: 'Token is already rented' };
      }

      // Check if owner actually owns the token
      if (token.owner !== ownerId) {
        return { success: false, error: 'You do not own this token' };
      }

      // Validate duration (max 30 days)
      if (durationMinutes < 1 || durationMinutes > 43200) { // 30 days = 43200 minutes
        return { success: false, error: 'Invalid rental duration (1-43200 minutes)' };
      }

      // Create rental agreement
      const rentalId = `RENTAL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

      const rental = {
        rentalId,
        ownerId,
        renterId,
        tokenId,
        amount: 1, // Always 1 token for picture tokens
        startTime,
        endTime,
        durationMinutes,
        status: 'active',
        isReturned: false,
        blockchainTx: null
      };

      // Update token status
      token.currentHolder = renterId;
      token.rentalUntil = endTime;
      token.isRental = true;

      inMemoryDB.tokens.set(tokenId, token);
      this.activeRentals.set(rentalId, rental);

      // Set up automatic return timer (simulated)
      this._setupRentalTimer(renterId, rentalId, durationMinutes);

      logger.info(`Token rented: ${tokenId} from ${ownerId} to ${renterId} for ${durationMinutes} minutes`);

      return {
        success: true,
        rentalId,
        tokenId,
        endTime: endTime.toISOString(),
        message: `Token rented successfully! Will be returned automatically at ${endTime.toLocaleString()}`
      };
    } catch (error) {
      logger.error('Rental error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Return rented token to owner
   */
  async returnRentedToken(renterId, tokenId) {
    try {
      const inMemoryDB = db.getInMemoryData();
      const token = inMemoryDB.tokens.get(tokenId);

      if (!token) {
        return { success: false, error: 'Token not found' };
      }

      // Check if token is actually rented
      if (!token.currentHolder || token.currentHolder === token.owner) {
        return { success: false, error: 'Token is not rented' };
      }

      // Check if this user is the renter
      if (token.currentHolder !== renterId) {
        return { success: false, error: 'You are not the current renter of this token' };
      }

      // Find the rental agreement
      let rentalId = null;
      for (const [id, rental] of this.activeRentals.entries()) {
        if (rental.tokenId === tokenId && rental.renterId === renterId) {
          rentalId = id;
          break;
        }
      }

      if (!rentalId) {
        return { success: false, error: 'Active rental not found' };
      }

      const rental = this.activeRentals.get(rentalId);

      // Update token status
      token.currentHolder = token.owner;
      token.rentalUntil = null;
      token.isRental = false;

      // Update rental status
      rental.status = 'completed';
      rental.isReturned = true;
      rental.returnedAt = new Date();

      // Move from active to history
      this.rentalHistory.set(rentalId, rental);
      this.activeRentals.delete(rentalId);

      // Clear timer
      this._clearRentalTimer(renterId);

      logger.info(`Token returned: ${tokenId} from ${renterId} to ${token.owner}`);

      return {
        success: true,
        rentalId,
        tokenId,
        message: 'Token returned successfully to original owner'
      };
    } catch (error) {
      logger.error('Return rental error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Force return of rented token (admin function)
   */
  async forceReturnRentedToken(tokenId) {
    try {
      const inMemoryDB = db.getInMemoryData();
      const token = inMemoryDB.tokens.get(tokenId);

      if (!token) {
        return { success: false, error: 'Token not found' };
      }

      if (!token.currentHolder || token.currentHolder === token.owner) {
        return { success: false, error: 'Token is not rented' };
      }

      // Find the rental agreement
      let rentalId = null;
      let renterId = null;

      for (const [id, rental] of this.activeRentals.entries()) {
        if (rental.tokenId === tokenId) {
          rentalId = id;
          renterId = rental.renterId;
          break;
        }
      }

      if (!rentalId) {
        return { success: false, error: 'Active rental not found' };
      }

      const rental = this.activeRentals.get(rentalId);

      // Update token status
      token.currentHolder = token.owner;
      token.rentalUntil = null;
      token.isRental = false;

      // Update rental status
      rental.status = 'force_returned';
      rental.isReturned = true;
      rental.returnedAt = new Date();

      // Move from active to history
      this.rentalHistory.set(rentalId, rental);
      this.activeRentals.delete(rentalId);

      // Clear timer
      this._clearRentalTimer(renterId);

      logger.warn(`Token force returned by admin: ${tokenId} from ${renterId} to ${token.owner}`);

      return {
        success: true,
        rentalId,
        tokenId,
        message: 'Token force returned successfully to original owner'
      };
    } catch (error) {
      logger.error('Force return rental error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active rentals for user
   */
  async getActiveRentals(userId) {
    try {
      const activeRentals = [];

      // Rentals where user is owner
      for (const [rentalId, rental] of this.activeRentals.entries()) {
        if (rental.ownerId === userId) {
          const inMemoryDB = db.getInMemoryData();
          const token = inMemoryDB.tokens.get(rental.tokenId);
          const renter = inMemoryDB.users.get(rental.renterId);

          activeRentals.push({
            rentalId,
            tokenId: rental.tokenId,
            pictureId: token.pictureId,
            renterId: rental.renterId,
            renterName: renter ? renter.username || `User ${rental.renterId}` : 'Unknown',
            startTime: rental.startTime,
            endTime: rental.endTime,
            durationMinutes: rental.durationMinutes,
            status: rental.status,
            timeLeft: this._calculateTimeLeft(rental.endTime)
          });
        }
      }

      // Rentals where user is renter
      for (const [rentalId, rental] of this.activeRentals.entries()) {
        if (rental.renterId === userId) {
          const inMemoryDB = db.getInMemoryData();
          const token = inMemoryDB.tokens.get(rental.tokenId);
          const owner = inMemoryDB.users.get(rental.ownerId);

          activeRentals.push({
            rentalId,
            tokenId: rental.tokenId,
            pictureId: token.pictureId,
            ownerId: rental.ownerId,
            ownerName: owner ? owner.username || `User ${rental.ownerId}` : 'Unknown',
            startTime: rental.startTime,
            endTime: rental.endTime,
            durationMinutes: rental.durationMinutes,
            status: rental.status,
            timeLeft: this._calculateTimeLeft(rental.endTime),
            isRenter: true
          });
        }
      }

      return {
        success: true,
        activeRentals,
        totalActive: activeRentals.length
      };
    } catch (error) {
      logger.error('Get active rentals error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get rental history for user
   */
  async getRentalHistory(userId) {
    try {
      const history = [];

      // Get all rentals where user is involved
      for (const [rentalId, rental] of this.rentalHistory.entries()) {
        if (rental.ownerId === userId || rental.renterId === userId) {
          const inMemoryDB = db.getInMemoryData();
          const token = inMemoryDB.tokens.get(rental.tokenId);
          const owner = inMemoryDB.users.get(rental.ownerId);
          const renter = inMemoryDB.users.get(rental.renterId);

          history.push({
            rentalId,
            tokenId: rental.tokenId,
            pictureId: token.pictureId,
            ownerId: rental.ownerId,
            ownerName: owner ? owner.username || `User ${rental.ownerId}` : 'Unknown',
            renterId: rental.renterId,
            renterName: renter ? renter.username || `User ${rental.renterId}` : 'Unknown',
            startTime: rental.startTime,
            endTime: rental.endTime,
            returnedAt: rental.returnedAt,
            durationMinutes: rental.durationMinutes,
            status: rental.status,
            isOwner: rental.ownerId === userId,
            isRenter: rental.renterId === userId
          });
        }
      }

      // Sort by most recent
      history.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

      return {
        success: true,
        history,
        totalRentals: history.length
      };
    } catch (error) {
      logger.error('Get rental history error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get rental details
   */
  async getRentalDetails(rentalId) {
    try {
      // Check active rentals first
      let rental = this.activeRentals.get(rentalId);

      // If not active, check history
      if (!rental) {
        rental = this.rentalHistory.get(rentalId);
      }

      if (!rental) {
        return { success: false, error: 'Rental not found' };
      }

      const inMemoryDB = db.getInMemoryData();
      const token = inMemoryDB.tokens.get(rental.tokenId);
      const owner = inMemoryDB.users.get(rental.ownerId);
      const renter = inMemoryDB.users.get(rental.renterId);
      const picture = inMemoryDB.pictures.get(token.pictureId);

      return {
        success: true,
        rentalId: rental.rentalId,
        tokenId: rental.tokenId,
        pictureId: token.pictureId,
        pictureUrl: picture ? picture.imageUrl : null,
        ownerId: rental.ownerId,
        ownerName: owner ? owner.username || `User ${rental.ownerId}` : 'Unknown',
        renterId: rental.renterId,
        renterName: renter ? renter.username || `User ${rental.renterId}` : 'Unknown',
        amount: rental.amount,
        startTime: rental.startTime,
        endTime: rental.endTime,
        returnedAt: rental.returnedAt,
        durationMinutes: rental.durationMinutes,
        status: rental.status,
        isActive: rental.status === 'active',
        timeLeft: rental.status === 'active' ? this._calculateTimeLeft(rental.endTime) : null,
        blockchainTx: rental.blockchainTx
      };
    } catch (error) {
      logger.error('Get rental details error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Setup rental return timer (simulated)
   */
  _setupRentalTimer(renterId, rentalId, durationMinutes) {
    // In real implementation, this would use a proper timer system
    // For mock purposes, just store the timer info
    const timerId = `TIMER_${Date.now()}`;
    this.rentalTimers.set(renterId, {
      timerId,
      rentalId,
      endTime: new Date(Date.now() + durationMinutes * 60000)
    });

    logger.info(`Rental timer set for ${renterId}, will expire in ${durationMinutes} minutes`);
  }

  /**
   * Clear rental timer
   */
  _clearRentalTimer(renterId) {
    if (this.rentalTimers.has(renterId)) {
      this.rentalTimers.delete(renterId);
      logger.info(`Rental timer cleared for ${renterId}`);
    }
  }

  /**
   * Calculate time left for rental
   */
  _calculateTimeLeft(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) {
      return 'Expired';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  }

  /**
   * Check expired rentals (would be called by cron job)
   */
  async checkExpiredRentals() {
    try {
      const now = new Date();
      const expiredRentals = [];

      for (const [rentalId, rental] of this.activeRentals.entries()) {
        if (new Date(rental.endTime) <= now) {
          expiredRentals.push(rentalId);
        }
      }

      if (expiredRentals.length > 0) {
        logger.info(`Found ${expiredRentals.length} expired rentals, returning tokens...`);

        for (const rentalId of expiredRentals) {
          const rental = this.activeRentals.get(rentalId);
          const result = await this.returnRentedToken(rental.renterId, rental.tokenId);

          if (result.success) {
            logger.info(`Auto-returned expired rental: ${rentalId}`);
          } else {
            logger.error(`Failed to auto-return rental ${rentalId}: ${result.error}`);
          }
        }
      }

      return {
        success: true,
        expiredCount: expiredRentals.length,
        message: `Checked ${this.activeRentals.size} active rentals, found ${expiredRentals.length} expired`
      };
    } catch (error) {
      logger.error('Check expired rentals error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new RentalService();
