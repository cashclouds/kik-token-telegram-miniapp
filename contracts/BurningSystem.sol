// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AnonymousPool.sol";
import "./MerkleTreeManager.sol";
import "./KIKTokenV2.sol";

/**
 * @title BurningSystem
 * @notice Automatically burns expired commitments from AnonymousPool
 * @dev Uses weighted random selection + keeper incentives
 *
 * Expiry Timeline:
 * - 0-91 days: Active (no burning)
 * - 91-105 days: Grace period (low burn probability ~5%)
 * - 105+ days: Hard expiry (high burn probability ~50%)
 *
 * Keeper Rewards:
 * - 0.01 KIK per commitment burned
 * - Funded from pool transaction fees
 * - Gas-efficient batch burning (up to 10 per call)
 */
contract BurningSystem {
    // ============ State Variables ============

    AnonymousPool public immutable pool;
    MerkleTreeManager public immutable merkleTree;
    KIKTokenV2 public immutable kikToken;

    address public admin;

    // Keeper reward for burning (0.01 KIK = 10^16 wei)
    uint256 public constant KEEPER_REWARD = 0.01 ether;

    // Maximum commitments to burn per call (gas limit)
    uint256 public constant MAX_BURN_BATCH = 10;

    // Expiry thresholds
    uint256 public constant SOFT_EXPIRY = 91 days;
    uint256 public constant GRACE_PERIOD = 14 days; // 91 + 14 = 105 days
    uint256 public constant HARD_EXPIRY = 105 days;

    // Burn probabilities (out of 100)
    uint256 public constant GRACE_BURN_PROBABILITY = 5;  // 5%
    uint256 public constant HARD_BURN_PROBABILITY = 50;  // 50%

    // Tracking expired commitments
    struct ExpiredCommitment {
        bytes32 commitment;
        uint256 amount;
        uint256 depositTimestamp;
        uint256 addedToListTimestamp;
        bool burned;
    }

    // List of commitments eligible for burning
    bytes32[] public expiredCommitments;

    // Mapping: commitment => array index (for O(1) lookup)
    mapping(bytes32 => uint256) public commitmentIndex;

    // Mapping: commitment => ExpiredCommitment data
    mapping(bytes32 => ExpiredCommitment) public expiredData;

    // Statistics
    uint256 public totalBurned;
    uint256 public totalKeeperRewards;

    // Chainlink VRF integration (for random selection)
    // Note: In MVP, using blockhash as pseudorandom. Upgrade to VRF in production.
    uint256 private nonce;

    // ============ Events ============

    event CommitmentExpired(
        bytes32 indexed commitment,
        uint256 amount,
        uint256 age
    );

    event CommitmentBurned(
        bytes32 indexed commitment,
        uint256 amount,
        uint256 age,
        address indexed keeper,
        uint256 reward
    );

    event KeeperRewarded(
        address indexed keeper,
        uint256 reward,
        uint256 commitmentsBurned
    );

    // ============ Errors ============

    error OnlyAdmin();
    error OnlyPool();
    error CommitmentNotExpired();
    error CommitmentAlreadyBurned();
    error CommitmentNotInList();
    error NoExpiredCommitments();
    error InsufficientRewardBalance();

    // ============ Modifiers ============

    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    modifier onlyPool() {
        if (msg.sender != address(pool)) revert OnlyPool();
        _;
    }

    // ============ Constructor ============

    constructor(
        address _pool,
        address _merkleTree,
        address payable _kikToken
    ) {
        pool = AnonymousPool(_pool);
        merkleTree = MerkleTreeManager(_merkleTree);
        kikToken = KIKTokenV2(_kikToken);
        admin = msg.sender;
    }

    // ============ Admin Functions ============

    /**
     * @notice Transfer admin role
     */
    function setAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Zero address");
        admin = _newAdmin;
    }

    // ============ Core Functions ============

    /**
     * @notice Track an expired commitment (called by AnonymousPool)
     * @param commitment The commitment hash
     * @param amount The deposited amount
     * @param depositTimestamp When commitment was created
     * @dev Only callable by AnonymousPool contract
     */
    function trackExpiredCommitment(
        bytes32 commitment,
        uint256 amount,
        uint256 depositTimestamp
    ) external onlyPool {
        // Verify commitment is actually expired
        uint256 age = block.timestamp - depositTimestamp;
        if (age < SOFT_EXPIRY) revert CommitmentNotExpired();

        // Check if already tracked
        if (expiredData[commitment].addedToListTimestamp != 0) {
            return; // Already tracked, skip
        }

        // Add to tracking list
        expiredCommitments.push(commitment);
        uint256 index = expiredCommitments.length - 1;
        commitmentIndex[commitment] = index;

        expiredData[commitment] = ExpiredCommitment({
            commitment: commitment,
            amount: amount,
            depositTimestamp: depositTimestamp,
            addedToListTimestamp: block.timestamp,
            burned: false
        });

        emit CommitmentExpired(commitment, amount, age);
    }

    /**
     * @notice Burn expired commitments (keeper function)
     * @dev Anyone can call this to earn rewards
     * @dev Burns 1-10 commitments using weighted random selection
     * @return burnedCount Number of commitments burned
     */
    function burnExpired() external returns (uint256 burnedCount) {
        if (expiredCommitments.length == 0) revert NoExpiredCommitments();

        burnedCount = 0;
        uint256 totalReward = 0;

        // Burn up to MAX_BURN_BATCH commitments
        uint256 attempts = 0;
        uint256 maxAttempts = expiredCommitments.length > MAX_BURN_BATCH
            ? MAX_BURN_BATCH * 3  // Try 3x to find eligible commitments
            : expiredCommitments.length;

        while (burnedCount < MAX_BURN_BATCH && attempts < maxAttempts) {
            attempts++;

            // Select random commitment
            bytes32 commitment = _selectRandomCommitment();
            if (commitment == bytes32(0)) continue;

            ExpiredCommitment storage expired = expiredData[commitment];

            // Skip if already burned
            if (expired.burned) continue;

            // Calculate age
            uint256 age = block.timestamp - expired.depositTimestamp;

            // Weighted probability: higher age = higher burn chance
            bool shouldBurn = _shouldBurn(age);

            if (shouldBurn) {
                // Mark as burned
                expired.burned = true;

                // Call AnonymousPool to actually burn
                pool.burnCommitment(commitment);

                // Emit event
                emit CommitmentBurned(
                    commitment,
                    expired.amount,
                    age,
                    msg.sender,
                    KEEPER_REWARD
                );

                burnedCount++;
                totalReward += KEEPER_REWARD;
                totalBurned++;
            }
        }

        // Pay keeper reward
        if (burnedCount > 0) {
            // Check contract has enough balance for rewards
            uint256 balance = kikToken.balanceOf(address(this));
            if (balance < totalReward) revert InsufficientRewardBalance();

            // Transfer reward to keeper
            kikToken.transfer(msg.sender, totalReward);

            totalKeeperRewards += totalReward;

            emit KeeperRewarded(msg.sender, totalReward, burnedCount);
        }

        return burnedCount;
    }

    /**
     * @notice Select random commitment from list
     * @dev Uses blockhash + nonce for pseudorandomness
     * @dev TODO: Upgrade to Chainlink VRF for production
     */
    function _selectRandomCommitment() private returns (bytes32) {
        if (expiredCommitments.length == 0) return bytes32(0);

        // Generate pseudorandom index
        uint256 randomIndex = _random() % expiredCommitments.length;

        return expiredCommitments[randomIndex];
    }

    /**
     * @notice Determine if commitment should be burned based on age
     * @param age Age of commitment in seconds
     * @return shouldBurn True if commitment should be burned
     */
    function _shouldBurn(uint256 age) private returns (bool) {
        // Hard expiry (105+ days): 50% chance
        if (age >= HARD_EXPIRY) {
            uint256 rand = _random() % 100;
            return rand < HARD_BURN_PROBABILITY;
        }

        // Grace period (91-105 days): 5% chance
        if (age >= SOFT_EXPIRY) {
            uint256 rand = _random() % 100;
            return rand < GRACE_BURN_PROBABILITY;
        }

        // Not expired yet
        return false;
    }

    /**
     * @notice Generate pseudorandom number
     * @dev Uses blockhash + nonce + msg.sender
     * @dev NOT cryptographically secure - use Chainlink VRF for production
     */
    function _random() private returns (uint256) {
        nonce++;
        return uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),
                    block.timestamp,
                    msg.sender,
                    nonce
                )
            )
        );
    }

    /**
     * @notice Remove burned commitment from tracking list
     * @dev Gas-optimized: swap with last element and pop
     * @param commitment The commitment to remove
     */
    function _removeFromList(bytes32 commitment) private {
        uint256 index = commitmentIndex[commitment];
        uint256 lastIndex = expiredCommitments.length - 1;

        if (index != lastIndex) {
            // Swap with last element
            bytes32 lastCommitment = expiredCommitments[lastIndex];
            expiredCommitments[index] = lastCommitment;
            commitmentIndex[lastCommitment] = index;
        }

        // Remove last element
        expiredCommitments.pop();
        delete commitmentIndex[commitment];
    }

    // ============ View Functions ============

    /**
     * @notice Get count of tracked expired commitments
     */
    function getExpiredCount() external view returns (uint256) {
        return expiredCommitments.length;
    }

    /**
     * @notice Get expired commitment data
     */
    function getExpiredData(bytes32 commitment)
        external
        view
        returns (ExpiredCommitment memory)
    {
        return expiredData[commitment];
    }

    /**
     * @notice Get list of all expired commitments
     */
    function getExpiredCommitments() external view returns (bytes32[] memory) {
        return expiredCommitments;
    }

    /**
     * @notice Check if commitment is eligible for burning
     * @param commitment The commitment hash
     * @return eligible True if can be burned
     * @return age Age in seconds
     * @return probability Burn probability (0-100)
     */
    function getBurnEligibility(bytes32 commitment)
        external
        view
        returns (
            bool eligible,
            uint256 age,
            uint256 probability
        )
    {
        ExpiredCommitment memory expired = expiredData[commitment];

        if (expired.addedToListTimestamp == 0 || expired.burned) {
            return (false, 0, 0);
        }

        age = block.timestamp - expired.depositTimestamp;

        if (age >= HARD_EXPIRY) {
            return (true, age, HARD_BURN_PROBABILITY);
        } else if (age >= SOFT_EXPIRY) {
            return (true, age, GRACE_BURN_PROBABILITY);
        } else {
            return (false, age, 0);
        }
    }

    /**
     * @notice Get statistics
     */
    function getStats()
        external
        view
        returns (
            uint256 _expiredCount,
            uint256 _totalBurned,
            uint256 _totalRewards,
            uint256 _rewardBalance
        )
    {
        return (
            expiredCommitments.length,
            totalBurned,
            totalKeeperRewards,
            kikToken.balanceOf(address(this))
        );
    }

    // ============ Emergency Functions ============

    /**
     * @notice Emergency withdraw rewards (admin only)
     * @dev Only for recovering stuck funds
     */
    function emergencyWithdraw() external onlyAdmin {
        uint256 balance = kikToken.balanceOf(address(this));
        kikToken.transfer(admin, balance);
    }

    /**
     * @notice Fund contract with KIK for keeper rewards
     * @param amount Amount to fund
     */
    function fundRewards(uint256 amount) external {
        kikToken.transferFrom(msg.sender, address(this), amount);
    }
}
