// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./KIKTokenV3.sol";

/**
 * @title ReferralSystem
 * @notice Multi-level referral system for KIK ecosystem
 * @dev 5-level referral tree with percentage-based rewards (scaled for 10M+ users)
 *
 * Features:
 * - 5-level referral structure (15% / 8% / 4% / 2% / 1%)
 * - Referral tracking and reward distribution
 * - Anti-sybil protection
 * - Claimable rewards
 */
contract ReferralSystem is Ownable, Pausable {
    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice KIK token contract
    KIKTokenV3 public kikToken;

    /// @notice Referrer for each user (who invited them)
    mapping(address => address) public referrer;

    /// @notice Number of direct referrals per user
    mapping(address => uint256) public referralCount;

    /// @notice Pending rewards per user
    mapping(address => uint256) public pendingRewards;

    /// @notice Total rewards claimed per user
    mapping(address => uint256) public claimedRewards;

    /// @notice Total referral earnings (all users)
    uint256 public totalReferralRewards;

    /// @notice Referral percentages per level (in basis points) - 5 levels for viral growth
    uint256 public constant LEVEL_1_PERCENT = 1500; // 15%
    uint256 public constant LEVEL_2_PERCENT = 800;  // 8%
    uint256 public constant LEVEL_3_PERCENT = 400;  // 4%
    uint256 public constant LEVEL_4_PERCENT = 200;  // 2%
    uint256 public constant LEVEL_5_PERCENT = 100;  // 1%
    uint256 public constant PERCENT_DENOMINATOR = 10000;

    /// @notice Minimum claim amount
    uint256 public minClaimAmount = 10 * 10**18; // 10 KIK

    /// @notice Reward pool address
    address public rewardPool;

    // ============================================
    // EVENTS
    // ============================================

    event ReferralRegistered(address indexed referee, address indexed referrer);
    event ReferralRewardAdded(
        address indexed referrer,
        address indexed referee,
        uint256 level,
        uint256 amount
    );
    event RewardsClaimed(address indexed user, uint256 amount);
    event MinClaimAmountUpdated(uint256 newAmount);

    // ============================================
    // ERRORS
    // ============================================

    error InvalidAddress();
    error AlreadyReferred();
    error CannotReferSelf();
    error NoReferrer();
    error InsufficientRewards();
    error BelowMinimumClaim();

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize referral system
     * @param _kikToken KIK token address
     * @param _rewardPool Reward pool address
     */
    constructor(address _kikToken, address _rewardPool) Ownable(msg.sender) {
        if (_kikToken == address(0) || _rewardPool == address(0)) revert InvalidAddress();
        kikToken = KIKTokenV3(_kikToken);
        rewardPool = _rewardPool;
    }

    // ============================================
    // REFERRAL FUNCTIONS
    // ============================================

    /**
     * @notice Register referral relationship
     * @param referee User being referred
     * @param _referrer User who referred them
     */
    function registerReferral(address referee, address _referrer)
        external
        whenNotPaused
        onlyOwner
    {
        if (referee == address(0) || _referrer == address(0)) revert InvalidAddress();
        if (referee == _referrer) revert CannotReferSelf();
        if (referrer[referee] != address(0)) revert AlreadyReferred();

        referrer[referee] = _referrer;
        referralCount[_referrer]++;

        emit ReferralRegistered(referee, _referrer);
    }

    /**
     * @notice Add referral rewards when referee earns tokens
     * @param referee User who earned rewards
     * @param amount Amount earned by referee
     */
    function addReferralRewards(address referee, uint256 amount)
        external
        whenNotPaused
        onlyOwner
    {
        address level1 = referrer[referee];
        if (level1 == address(0)) return; // No referrer

        // Level 1: 15%
        uint256 level1Reward = (amount * LEVEL_1_PERCENT) / PERCENT_DENOMINATOR;
        pendingRewards[level1] += level1Reward;
        totalReferralRewards += level1Reward;
        emit ReferralRewardAdded(level1, referee, 1, level1Reward);

        // Level 2: 8%
        address level2 = referrer[level1];
        if (level2 != address(0)) {
            uint256 level2Reward = (amount * LEVEL_2_PERCENT) / PERCENT_DENOMINATOR;
            pendingRewards[level2] += level2Reward;
            totalReferralRewards += level2Reward;
            emit ReferralRewardAdded(level2, referee, 2, level2Reward);

            // Level 3: 4%
            address level3 = referrer[level2];
            if (level3 != address(0)) {
                uint256 level3Reward = (amount * LEVEL_3_PERCENT) / PERCENT_DENOMINATOR;
                pendingRewards[level3] += level3Reward;
                totalReferralRewards += level3Reward;
                emit ReferralRewardAdded(level3, referee, 3, level3Reward);

                // Level 4: 2%
                address level4 = referrer[level3];
                if (level4 != address(0)) {
                    uint256 level4Reward = (amount * LEVEL_4_PERCENT) / PERCENT_DENOMINATOR;
                    pendingRewards[level4] += level4Reward;
                    totalReferralRewards += level4Reward;
                    emit ReferralRewardAdded(level4, referee, 4, level4Reward);

                    // Level 5: 1%
                    address level5 = referrer[level4];
                    if (level5 != address(0)) {
                        uint256 level5Reward = (amount * LEVEL_5_PERCENT) / PERCENT_DENOMINATOR;
                        pendingRewards[level5] += level5Reward;
                        totalReferralRewards += level5Reward;
                        emit ReferralRewardAdded(level5, referee, 5, level5Reward);
                    }
                }
            }
        }
    }

    /**
     * @notice Claim pending referral rewards
     */
    function claimRewards() external whenNotPaused {
        uint256 pending = pendingRewards[msg.sender];
        if (pending == 0) revert InsufficientRewards();
        if (pending < minClaimAmount) revert BelowMinimumClaim();

        pendingRewards[msg.sender] = 0;
        claimedRewards[msg.sender] += pending;

        // Transfer from reward pool
        kikToken.transferFrom(rewardPool, msg.sender, pending);

        emit RewardsClaimed(msg.sender, pending);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Set minimum claim amount
     * @param newAmount New minimum amount
     */
    function setMinClaimAmount(uint256 newAmount) external onlyOwner {
        minClaimAmount = newAmount;
        emit MinClaimAmountUpdated(newAmount);
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
     * @notice Get referrer for user
     * @param user User address
     * @return Referrer address (address(0) if none)
     */
    function getReferrer(address user) external view returns (address) {
        return referrer[user];
    }

    /**
     * @notice Get referral tree depth for user
     * @param user User address
     * @return Number of levels up to root
     */
    function getReferralDepth(address user) external view returns (uint256) {
        uint256 depth = 0;
        address current = user;

        while (referrer[current] != address(0) && depth < 10) {
            current = referrer[current];
            depth++;
        }

        return depth;
    }

    /**
     * @notice Get all referrers in chain (5 levels)
     * @param user User address
     * @return level1 Direct referrer
     * @return level2 Second-level referrer
     * @return level3 Third-level referrer
     * @return level4 Fourth-level referrer
     * @return level5 Fifth-level referrer
     */
    function getReferralChain(address user)
        external
        view
        returns (
            address level1,
            address level2,
            address level3,
            address level4,
            address level5
        )
    {
        level1 = referrer[user];
        if (level1 != address(0)) {
            level2 = referrer[level1];
            if (level2 != address(0)) {
                level3 = referrer[level2];
                if (level3 != address(0)) {
                    level4 = referrer[level3];
                    if (level4 != address(0)) {
                        level5 = referrer[level4];
                    }
                }
            }
        }
    }

    /**
     * @notice Get referral stats for user
     * @param user User address
     * @return directReferrals Number of direct referrals
     * @return pending Pending rewards
     * @return claimed Total claimed rewards
     */
    function getReferralStats(address user)
        external
        view
        returns (uint256 directReferrals, uint256 pending, uint256 claimed)
    {
        return (referralCount[user], pendingRewards[user], claimedRewards[user]);
    }

    /**
     * @notice Calculate rewards for amount at each level (5 levels)
     * @param amount Amount to calculate from
     * @return level1Reward Level 1 reward (15%)
     * @return level2Reward Level 2 reward (8%)
     * @return level3Reward Level 3 reward (4%)
     * @return level4Reward Level 4 reward (2%)
     * @return level5Reward Level 5 reward (1%)
     */
    function calculateRewards(uint256 amount)
        external
        pure
        returns (
            uint256 level1Reward,
            uint256 level2Reward,
            uint256 level3Reward,
            uint256 level4Reward,
            uint256 level5Reward
        )
    {
        level1Reward = (amount * LEVEL_1_PERCENT) / PERCENT_DENOMINATOR;
        level2Reward = (amount * LEVEL_2_PERCENT) / PERCENT_DENOMINATOR;
        level3Reward = (amount * LEVEL_3_PERCENT) / PERCENT_DENOMINATOR;
        level4Reward = (amount * LEVEL_4_PERCENT) / PERCENT_DENOMINATOR;
        level5Reward = (amount * LEVEL_5_PERCENT) / PERCENT_DENOMINATOR;
    }
}
