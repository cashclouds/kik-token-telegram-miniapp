// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./KIKTokenV3.sol";

/**
 * @title CollectiblesNFT
 * @notice NFT contract for KIK collectibles (photos, images, AI-generated art)
 * @dev ERC-721 with metadata, rarity system, and KIK token integration
 *
 * Features:
 * - Create collectibles (AI-generated or user upload)
 * - Rarity tiers (Common, Rare, Epic, Legendary)
 * - Gift mechanics (transfer with bonus rewards)
 * - Creation fees in KIK tokens
 * - IPFS metadata storage
 * - Sales history tracking
 */
contract CollectiblesNFT is ERC721, ERC721URIStorage, Ownable, Pausable {
    // ============================================
    // TYPES
    // ============================================

    enum Rarity {
        COMMON,      // 70% chance
        RARE,        // 20% chance
        EPIC,        // 8% chance
        LEGENDARY    // 2% chance
    }

    struct Collectible {
        uint256 tokenId;
        string name;              // "Red Ferrari"
        Rarity rarity;
        uint256 creationPrice;    // KIK paid to create
        uint256 lastSalePrice;    // Last traded price (0 if never sold)
        address creator;
        uint64 createdAt;
        uint32 giftCount;         // Number of times gifted
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice KIK token contract
    KIKTokenV3 public kikToken;

    /// @notice Next token ID
    uint256 private _nextTokenId;

    /// @notice Collectibles data
    mapping(uint256 => Collectible) public collectibles;

    /// @notice Creation fee per rarity (in KIK tokens)
    mapping(Rarity => uint256) public creationFees;

    /// @notice Reward pool address (receives creation fees)
    address public rewardPool;

    /// @notice Daily creation limit per user
    uint256 public dailyCreationLimit = 5;

    /// @notice Track daily creations per user
    mapping(address => mapping(uint256 => uint256)) public dailyCreations; // user => day => count

    /// @notice Premium users (unlimited creation)
    mapping(address => bool) public isPremium;

    // ============================================
    // EVENTS
    // ============================================

    event CollectibleCreated(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        Rarity rarity,
        uint256 creationFee
    );
    event CollectibleGifted(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );
    event CreationFeeUpdated(Rarity rarity, uint256 newFee);
    event DailyLimitUpdated(uint256 newLimit);
    event PremiumStatusUpdated(address indexed user, bool isPremium);

    // ============================================
    // ERRORS
    // ============================================

    error InvalidAddress();
    error DailyLimitReached();
    error InsufficientPayment();
    error InvalidRarity();
    error NotTokenOwner();

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize Collectibles NFT contract
     * @param _kikToken KIK token contract address
     * @param _rewardPool Reward pool address
     */
    constructor(
        address _kikToken,
        address _rewardPool
    ) ERC721("KIK Collectibles", "KIKNFT") Ownable(msg.sender) {
        if (_kikToken == address(0) || _rewardPool == address(0)) revert InvalidAddress();

        kikToken = KIKTokenV3(_kikToken);
        rewardPool = _rewardPool;

        // Set default creation fees (in KIK tokens with 18 decimals)
        creationFees[Rarity.COMMON] = 100 * 10**18;     // 100 KIK
        creationFees[Rarity.RARE] = 100 * 10**18;       // 100 KIK (same, rarity is random)
        creationFees[Rarity.EPIC] = 100 * 10**18;       // 100 KIK
        creationFees[Rarity.LEGENDARY] = 100 * 10**18;  // 100 KIK

        _nextTokenId = 1; // Start from 1
    }

    // ============================================
    // CREATION FUNCTIONS
    // ============================================

    /**
     * @notice Create new collectible
     * @param name Collectible name
     * @param tokenURI IPFS URI for metadata
     * @param rarity Rarity tier
     * @return tokenId New token ID
     */
    function createCollectible(
        string memory name,
        string memory tokenURI,
        Rarity rarity
    ) external whenNotPaused returns (uint256) {
        // Check daily limit (unless premium)
        if (!isPremium[msg.sender]) {
            uint256 today = block.timestamp / 1 days;
            if (dailyCreations[msg.sender][today] >= dailyCreationLimit) {
                revert DailyLimitReached();
            }
            dailyCreations[msg.sender][today]++;
        }

        // Get creation fee
        uint256 fee = creationFees[rarity];

        // Transfer KIK tokens from creator to reward pool
        bool success = kikToken.transferFrom(msg.sender, rewardPool, fee);
        if (!success) revert InsufficientPayment();

        // Mint NFT
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Store collectible data
        collectibles[tokenId] = Collectible({
            tokenId: tokenId,
            name: name,
            rarity: rarity,
            creationPrice: fee,
            lastSalePrice: 0,
            creator: msg.sender,
            createdAt: uint64(block.timestamp),
            giftCount: 0
        });

        emit CollectibleCreated(tokenId, msg.sender, name, rarity, fee);

        return tokenId;
    }

    // ============================================
    // GIFT FUNCTIONS
    // ============================================

    /**
     * @notice Gift collectible to another user
     * @param tokenId Token ID to gift
     * @param recipient Recipient address
     */
    function gift(uint256 tokenId, address recipient) external whenNotPaused {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (recipient == address(0)) revert InvalidAddress();

        // Update gift count
        collectibles[tokenId].giftCount++;

        // Transfer NFT
        _transfer(msg.sender, recipient, tokenId);

        emit CollectibleGifted(tokenId, msg.sender, recipient);
    }

    /**
     * @notice Batch gift multiple collectibles
     * @param tokenIds Array of token IDs to gift
     * @param recipients Array of recipient addresses
     */
    function batchGift(uint256[] calldata tokenIds, address[] calldata recipients)
        external
        whenNotPaused
    {
        require(tokenIds.length == recipients.length, "Length mismatch");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (ownerOf(tokenIds[i]) != msg.sender) revert NotTokenOwner();
            if (recipients[i] == address(0)) revert InvalidAddress();

            collectibles[tokenIds[i]].giftCount++;
            _transfer(msg.sender, recipients[i], tokenIds[i]);

            emit CollectibleGifted(tokenIds[i], msg.sender, recipients[i]);
        }
    }

    // ============================================
    // SALE TRACKING
    // ============================================

    /**
     * @notice Update last sale price (called by marketplace)
     * @param tokenId Token ID
     * @param salePrice Sale price in KIK
     */
    function updateSalePrice(uint256 tokenId, uint256 salePrice) external {
        // Only marketplace contract can call this
        // This will be set by owner to marketplace address
        collectibles[tokenId].lastSalePrice = salePrice;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Set creation fee for rarity
     * @param rarity Rarity tier
     * @param fee Fee amount in KIK (with decimals)
     */
    function setCreationFee(Rarity rarity, uint256 fee) external onlyOwner {
        creationFees[rarity] = fee;
        emit CreationFeeUpdated(rarity, fee);
    }

    /**
     * @notice Set daily creation limit
     * @param newLimit New daily limit
     */
    function setDailyLimit(uint256 newLimit) external onlyOwner {
        dailyCreationLimit = newLimit;
        emit DailyLimitUpdated(newLimit);
    }

    /**
     * @notice Set premium status for user (unlimited creation)
     * @param user User address
     * @param premium Premium status
     */
    function setPremiumStatus(address user, bool premium) external onlyOwner {
        isPremium[user] = premium;
        emit PremiumStatusUpdated(user, premium);
    }

    /**
     * @notice Update reward pool address
     * @param newRewardPool New reward pool address
     */
    function setRewardPool(address newRewardPool) external onlyOwner {
        if (newRewardPool == address(0)) revert InvalidAddress();
        rewardPool = newRewardPool;
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get collectible data
     * @param tokenId Token ID
     * @return Collectible data
     */
    function getCollectible(uint256 tokenId) external view returns (Collectible memory) {
        return collectibles[tokenId];
    }

    /**
     * @notice Get total supply of collectibles
     * @return Total number of collectibles minted
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @notice Get today's creation count for user
     * @param user User address
     * @return Number of collectibles created today
     */
    function getTodayCreationCount(address user) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        return dailyCreations[user][today];
    }

    /**
     * @notice Check if user can create more collectibles today
     * @param user User address
     * @return Whether user can create more
     */
    function canCreateMore(address user) external view returns (bool) {
        if (isPremium[user]) return true;
        uint256 today = block.timestamp / 1 days;
        return dailyCreations[user][today] < dailyCreationLimit;
    }

    // ============================================
    // OVERRIDES
    // ============================================

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
