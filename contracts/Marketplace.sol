// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CollectiblesNFT.sol";
import "./KIKTokenV3.sol";

/**
 * @title Marketplace
 * @notice Marketplace for buying/selling KIK collectibles
 * @dev Supports listing, buying, and canceling with KIK token payments
 *
 * Features:
 * - List collectibles for sale in KIK tokens
 * - Buy listed collectibles
 * - Cancel listings
 * - 5% marketplace fee
 * - Fee distribution (3% treasury, 2% reward pool)
 */
contract Marketplace is Ownable, Pausable, ReentrancyGuard {
    // ============================================
    // TYPES
    // ============================================

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;           // Price in KIK tokens
        bool active;
        uint64 listedAt;
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice KIK token contract
    KIKTokenV3 public kikToken;

    /// @notice Collectibles NFT contract
    CollectiblesNFT public collectiblesNFT;

    /// @notice Next listing ID
    uint256 private _nextListingId;

    /// @notice All listings
    mapping(uint256 => Listing) public listings;

    /// @notice Active listings per token ID
    mapping(uint256 => uint256) public tokenToListing; // tokenId => listingId

    /// @notice Marketplace fee (500 = 5%)
    uint256 public marketplaceFee = 500; // 5%
    uint256 public constant MAX_FEE = 1000; // Max 10%
    uint256 public constant FEE_DENOMINATOR = 10000;

    /// @notice Fee distribution
    address public treasury;     // 3% of sale
    address public rewardPool;   // 2% of sale

    // ============================================
    // EVENTS
    // ============================================

    event Listed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    event Sale(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed buyer,
        address seller,
        uint256 price,
        uint256 fee
    );
    event ListingCanceled(uint256 indexed listingId, uint256 indexed tokenId);
    event MarketplaceFeeUpdated(uint256 newFee);
    event TreasuryUpdated(address newTreasury);
    event RewardPoolUpdated(address newRewardPool);

    // ============================================
    // ERRORS
    // ============================================

    error InvalidAddress();
    error InvalidPrice();
    error NotTokenOwner();
    error ListingNotActive();
    error AlreadyListed();
    error NotSeller();
    error CannotBuyOwnListing();
    error FeeTooHigh();

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize marketplace
     * @param _kikToken KIK token address
     * @param _collectiblesNFT Collectibles NFT address
     * @param _treasury Treasury address
     * @param _rewardPool Reward pool address
     */
    constructor(
        address _kikToken,
        address _collectiblesNFT,
        address _treasury,
        address _rewardPool
    ) Ownable(msg.sender) {
        if (_kikToken == address(0) ||
            _collectiblesNFT == address(0) ||
            _treasury == address(0) ||
            _rewardPool == address(0))
        {
            revert InvalidAddress();
        }

        kikToken = KIKTokenV3(_kikToken);
        collectiblesNFT = CollectiblesNFT(_collectiblesNFT);
        treasury = _treasury;
        rewardPool = _rewardPool;

        _nextListingId = 1;
    }

    // ============================================
    // LISTING FUNCTIONS
    // ============================================

    /**
     * @notice List collectible for sale
     * @param tokenId Token ID to list
     * @param price Sale price in KIK tokens
     * @return listingId New listing ID
     */
    function listForSale(uint256 tokenId, uint256 price)
        external
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        if (price == 0) revert InvalidPrice();
        if (collectiblesNFT.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (tokenToListing[tokenId] != 0) revert AlreadyListed();

        // Transfer NFT to marketplace (escrow)
        collectiblesNFT.transferFrom(msg.sender, address(this), tokenId);

        // Create listing
        uint256 listingId = _nextListingId++;
        listings[listingId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            listedAt: uint64(block.timestamp)
        });

        tokenToListing[tokenId] = listingId;

        emit Listed(listingId, tokenId, msg.sender, price);

        return listingId;
    }

    /**
     * @notice Buy listed collectible
     * @param listingId Listing ID to buy
     */
    function buy(uint256 listingId) external whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];

        if (!listing.active) revert ListingNotActive();
        if (listing.seller == msg.sender) revert CannotBuyOwnListing();

        uint256 price = listing.price;
        uint256 fee = (price * marketplaceFee) / FEE_DENOMINATOR;
        uint256 sellerAmount = price - fee;

        // Calculate fee distribution (3% treasury, 2% reward pool out of 5% total)
        uint256 treasuryFee = (fee * 3) / 5;  // 60% of fee
        uint256 rewardFee = fee - treasuryFee; // 40% of fee

        // Mark listing as inactive
        listing.active = false;
        tokenToListing[listing.tokenId] = 0;

        // Transfer KIK tokens
        kikToken.transferFrom(msg.sender, listing.seller, sellerAmount);
        kikToken.transferFrom(msg.sender, treasury, treasuryFee);
        kikToken.transferFrom(msg.sender, rewardPool, rewardFee);

        // Transfer NFT to buyer
        collectiblesNFT.transferFrom(address(this), msg.sender, listing.tokenId);

        // Update sale price in NFT contract
        collectiblesNFT.updateSalePrice(listing.tokenId, price);

        emit Sale(listingId, listing.tokenId, msg.sender, listing.seller, price, fee);
    }

    /**
     * @notice Cancel listing
     * @param listingId Listing ID to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];

        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotSeller();

        // Mark as inactive
        listing.active = false;
        tokenToListing[listing.tokenId] = 0;

        // Return NFT to seller
        collectiblesNFT.transferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingCanceled(listingId, listing.tokenId);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Set marketplace fee
     * @param newFee New fee percentage (in basis points)
     */
    function setMarketplaceFee(uint256 newFee) external onlyOwner {
        if (newFee > MAX_FEE) revert FeeTooHigh();
        marketplaceFee = newFee;
        emit MarketplaceFeeUpdated(newFee);
    }

    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    /**
     * @notice Update reward pool address
     * @param newRewardPool New reward pool address
     */
    function setRewardPool(address newRewardPool) external onlyOwner {
        if (newRewardPool == address(0)) revert InvalidAddress();
        rewardPool = newRewardPool;
        emit RewardPoolUpdated(newRewardPool);
    }

    /**
     * @notice Pause marketplace
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause marketplace
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get listing details
     * @param listingId Listing ID
     * @return Listing data
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @notice Get active listing for token
     * @param tokenId Token ID
     * @return listingId Listing ID (0 if not listed)
     */
    function getTokenListing(uint256 tokenId) external view returns (uint256) {
        return tokenToListing[tokenId];
    }

    /**
     * @notice Calculate marketplace fee for price
     * @param price Sale price
     * @return fee Fee amount
     */
    function calculateFee(uint256 price) external view returns (uint256) {
        return (price * marketplaceFee) / FEE_DENOMINATOR;
    }

    /**
     * @notice Get total listings count
     * @return Total number of listings ever created
     */
    function getTotalListings() external view returns (uint256) {
        return _nextListingId - 1;
    }
}
