// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./KIKTokenV3.sol";
import "./ReferralSystem.sol";

/**
 * @title RewardDistributor
 * @notice Action-based reward distribution system
 * @dev Distributes KIK tokens for various user actions
 *
 * Features:
 * - Multiple action types (registration, daily login, creation, gifts, etc.)
 * - Daily/weekly claim limits
 * - Signature-based verification (backend signs actions)
 * - Automatic referral reward distribution
 */
contract RewardDistributor is Ownable, Pausable {
    // ============================================
    // TYPES
    // ============================================

    enum ActionType {
        REGISTRATION,        // 100 KIK (one-time)
        DAILY_LOGIN,         // 10 KIK (daily)
        CREATE_COLLECTIBLE,  // 50 KIK bonus (per creation)
        GIFT_SENT,           // 50 KIK (per gift)
        GIFT_RECEIVED,       // 50 KIK (per gift received)
        FIRST_TRADE,         // 200 KIK (one-time)
        REFERRAL_SIGNUP,     // 500 KIK (when referee signs up)
        SOCIAL_SHARE,        // 50 KIK (share to social media)
        SURVEY_COMPLETE      // 200 KIK (complete partner survey)
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice KIK token contract
    KIKTokenV3 public kikToken;

    /// @notice Referral system contract
    ReferralSystem public referralSystem;

    /// @notice Reward pool address
    address public rewardPool;

    /// @notice Backend signer address (verifies actions)
    address public backendSigner;

    /// @notice Reward amounts per action type
    mapping(ActionType => uint256) public rewardAmounts;

    /// @notice One-time actions already claimed
    mapping(address => mapping(ActionType => bool)) public oneTimeClaimed;

    /// @notice Daily action claims
    mapping(address => mapping(ActionType => mapping(uint256 => uint256))) public dailyClaims;
    // user => actionType => day => count

    /// @notice Total rewards claimed per user
    mapping(address => uint256) public totalClaimed;

    /// @notice Daily claim limit per user (increased for 10M+ users)
    uint256 public dailyClaimLimit = 2000 * 10**18; // 2000 KIK/day

    /// @notice Monthly claim limit per user (increased for 10M+ users)
    uint256 public monthlyClaimLimit = 30000 * 10**18; // 30000 KIK/month

    /// @notice Used nonces (prevent replay attacks)
    mapping(bytes32 => bool) public usedNonces;

    // ============================================
    // EVENTS
    // ============================================

    event RewardClaimed(
        address indexed user,
        ActionType indexed actionType,
        uint256 amount
    );
    event RewardAmountUpdated(ActionType indexed actionType, uint256 newAmount);
    event BackendSignerUpdated(address indexed newSigner);
    event DailyLimitUpdated(uint256 newLimit);
    event MonthlyLimitUpdated(uint256 newLimit);

    // ============================================
    // ERRORS
    // ============================================

    error InvalidAddress();
    error InvalidSignature();
    error AlreadyClaimed();
    error DailyLimitExceeded();
    error MonthlyLimitExceeded();
    error NonceAlreadyUsed();
    error InvalidActionType();

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize reward distributor
     * @param _kikToken KIK token address
     * @param _referralSystem Referral system address
     * @param _rewardPool Reward pool address
     * @param _backendSigner Backend signer address
     */
    constructor(
        address _kikToken,
        address _referralSystem,
        address _rewardPool,
        address _backendSigner
    ) Ownable(msg.sender) {
        if (_kikToken == address(0) ||
            _referralSystem == address(0) ||
            _rewardPool == address(0) ||
            _backendSigner == address(0))
        {
            revert InvalidAddress();
        }

        kikToken = KIKTokenV3(_kikToken);
        referralSystem = ReferralSystem(_referralSystem);
        rewardPool = _rewardPool;
        backendSigner = _backendSigner;

        // Set default reward amounts (scaled for 10M+ users, viral growth)
        rewardAmounts[ActionType.REGISTRATION] = 100 * 10**18;
        rewardAmounts[ActionType.DAILY_LOGIN] = 10 * 10**18;
        rewardAmounts[ActionType.CREATE_COLLECTIBLE] = 50 * 10**18;
        rewardAmounts[ActionType.GIFT_SENT] = 50 * 10**18;
        rewardAmounts[ActionType.GIFT_RECEIVED] = 50 * 10**18;
        rewardAmounts[ActionType.FIRST_TRADE] = 200 * 10**18;
        rewardAmounts[ActionType.REFERRAL_SIGNUP] = 1000 * 10**18; // 2x for viral growth
        rewardAmounts[ActionType.SOCIAL_SHARE] = 50 * 10**18;
        rewardAmounts[ActionType.SURVEY_COMPLETE] = 200 * 10**18;
    }

    // ============================================
    // CLAIM FUNCTIONS
    // ============================================

    /**
     * @notice Claim reward for action
     * @param actionType Type of action performed
     * @param nonce Unique nonce for this claim
     * @param signature Backend signature
     */
    function claimReward(
        ActionType actionType,
        bytes32 nonce,
        bytes calldata signature
    ) external whenNotPaused {
        // Check nonce not used
        if (usedNonces[nonce]) revert NonceAlreadyUsed();

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, actionType, nonce));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address signer = _recoverSigner(ethSignedHash, signature);

        if (signer != backendSigner) revert InvalidSignature();

        // Mark nonce as used
        usedNonces[nonce] = true;

        // Check if one-time action
        if (_isOneTimeAction(actionType)) {
            if (oneTimeClaimed[msg.sender][actionType]) revert AlreadyClaimed();
            oneTimeClaimed[msg.sender][actionType] = true;
        }

        // Get reward amount
        uint256 rewardAmount = rewardAmounts[actionType];

        // Check daily limit
        uint256 today = block.timestamp / 1 days;
        uint256 todayClaimed = dailyClaims[msg.sender][actionType][today];
        if (todayClaimed + rewardAmount > dailyClaimLimit) revert DailyLimitExceeded();

        // Check monthly limit
        uint256 thisMonth = block.timestamp / 30 days;
        uint256 monthClaimed = _getMonthClaimed(msg.sender, thisMonth);
        if (monthClaimed + rewardAmount > monthlyClaimLimit) revert MonthlyLimitExceeded();

        // Update tracking
        dailyClaims[msg.sender][actionType][today] += rewardAmount;
        totalClaimed[msg.sender] += rewardAmount;

        // Transfer reward
        kikToken.transferFrom(rewardPool, msg.sender, rewardAmount);

        // Add referral rewards (if user has referrers)
        referralSystem.addReferralRewards(msg.sender, rewardAmount);

        emit RewardClaimed(msg.sender, actionType, rewardAmount);
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    /**
     * @notice Check if action is one-time only
     * @param actionType Action type to check
     * @return Whether action is one-time
     */
    function _isOneTimeAction(ActionType actionType) internal pure returns (bool) {
        return actionType == ActionType.REGISTRATION ||
               actionType == ActionType.FIRST_TRADE;
    }

    /**
     * @notice Get total claimed this month
     * @param user User address
     * @param month Month number
     * @return Total amount claimed this month
     */
    function _getMonthClaimed(address user, uint256 month) internal view returns (uint256) {
        uint256 total = 0;
        uint256 startDay = month * 30;
        uint256 endDay = startDay + 30;

        for (uint256 day = startDay; day < endDay; day++) {
            for (uint256 i = 0; i < 9; i++) {
                ActionType actionType = ActionType(i);
                total += dailyClaims[user][actionType][day];
            }
        }

        return total;
    }

    /**
     * @notice Recover signer from signature
     * @param ethSignedHash Signed message hash
     * @param signature Signature bytes
     * @return Signer address
     */
    function _recoverSigner(bytes32 ethSignedHash, bytes memory signature)
        internal
        pure
        returns (address)
    {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        return ecrecover(ethSignedHash, v, r, s);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Set reward amount for action type
     * @param actionType Action type
     * @param amount New reward amount
     */
    function setRewardAmount(ActionType actionType, uint256 amount) external onlyOwner {
        rewardAmounts[actionType] = amount;
        emit RewardAmountUpdated(actionType, amount);
    }

    /**
     * @notice Set backend signer address
     * @param newSigner New signer address
     */
    function setBackendSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert InvalidAddress();
        backendSigner = newSigner;
        emit BackendSignerUpdated(newSigner);
    }

    /**
     * @notice Set daily claim limit
     * @param newLimit New daily limit
     */
    function setDailyLimit(uint256 newLimit) external onlyOwner {
        dailyClaimLimit = newLimit;
        emit DailyLimitUpdated(newLimit);
    }

    /**
     * @notice Set monthly claim limit
     * @param newLimit New monthly limit
     */
    function setMonthlyLimit(uint256 newLimit) external onlyOwner {
        monthlyClaimLimit = newLimit;
        emit MonthlyLimitUpdated(newLimit);
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
     * @notice Get reward amount for action
     * @param actionType Action type
     * @return Reward amount
     */
    function getRewardAmount(ActionType actionType) external view returns (uint256) {
        return rewardAmounts[actionType];
    }

    /**
     * @notice Check if user claimed one-time action
     * @param user User address
     * @param actionType Action type
     * @return Whether claimed
     */
    function hasClaimedOneTime(address user, ActionType actionType)
        external
        view
        returns (bool)
    {
        return oneTimeClaimed[user][actionType];
    }

    /**
     * @notice Get today's claims for user
     * @param user User address
     * @param actionType Action type
     * @return Amount claimed today
     */
    function getTodayClaims(address user, ActionType actionType)
        external
        view
        returns (uint256)
    {
        uint256 today = block.timestamp / 1 days;
        return dailyClaims[user][actionType][today];
    }

    /**
     * @notice Get total rewards claimed by user
     * @param user User address
     * @return Total amount claimed
     */
    function getTotalClaimed(address user) external view returns (uint256) {
        return totalClaimed[user];
    }
}
