// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./KIKTokenV2.sol";
import "./MerkleTreeManager.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AnonymousPool
 * @notice Anonymous pool for private KIK token transactions using Merkle tree commitments
 * @dev Implements deposit, withdraw, and rewrite operations with commitment expiry
 *
 * Key Features:
 * - Deposit: Burn tokens from public wallet, create anonymous commitment
 * - Withdraw: Verify Merkle proof, mint tokens to any address
 * - Rewrite: Refresh expiring commitments (burn old, create new)
 * - Expiry: Commitments expire after 13 weeks (soft) / 15 weeks (hard)
 * - Nullifier: Prevent double-spending of commitments
 *
 * Security:
 * - Nullifier tracking prevents double withdrawals
 * - Merkle proof verification ensures valid commitments
 * - Expiry system prevents indefinite commitment storage
 * - Reentrancy protection on all external functions
 */
contract AnonymousPool is Ownable, ReentrancyGuard {

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice KIK Token contract
    KIKTokenV2 public kikToken;

    /// @notice Merkle Tree Manager contract
    MerkleTreeManager public merkleTree;

    /// @notice Soft expiry period (13 weeks = 91 days)
    uint256 public constant SOFT_EXPIRY = 91 days;

    /// @notice Grace period (2 weeks = 14 days)
    uint256 public constant GRACE_PERIOD = 14 days;

    /// @notice Hard expiry period (15 weeks = 105 days)
    uint256 public constant HARD_EXPIRY = SOFT_EXPIRY + GRACE_PERIOD;

    /// @notice Minimum deposit amount
    uint256 public minDepositAmount;

    /// @notice Maximum deposit amount
    uint256 public maxDepositAmount;

    /// @notice Total value locked in the pool
    uint256 public totalValueLocked;

    /// @notice Commitment data structure
    struct CommitmentData {
        uint256 amount;          // Amount of tokens
        uint256 timestamp;       // Creation timestamp
        uint256 leafIndex;       // Index in Merkle tree
        bool isActive;           // Active status
    }

    /// @notice Mapping of commitment hash to commitment data
    mapping(bytes32 => CommitmentData) public commitments;

    /// @notice Mapping of used nullifiers to prevent double-spending
    mapping(bytes32 => bool) public usedNullifiers;

    /// @notice Array to track commitments by age for burning
    bytes32[] public commitmentList;

    /// @notice Mapping from commitment to its index in commitmentList
    mapping(bytes32 => uint256) public commitmentIndex;

    /// @notice Burning System contract address
    address public burningSystem;

    // ============================================
    // EVENTS
    // ============================================

    event Deposit(
        bytes32 indexed commitment,
        uint256 amount,
        uint256 leafIndex,
        bytes encryptedData,
        uint256 timestamp
    );

    event Withdrawal(
        bytes32 indexed nullifier,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    );

    event Rewrite(
        bytes32 indexed oldNullifier,
        bytes32 indexed newCommitment,
        uint256 amount,
        uint256 newLeafIndex,
        uint256 timestamp
    );

    event CommitmentBurned(
        bytes32 indexed commitment,
        uint256 amount,
        uint256 age
    );

    event MinDepositAmountSet(uint256 oldAmount, uint256 newAmount);
    event MaxDepositAmountSet(uint256 oldAmount, uint256 newAmount);

    // ============================================
    // ERRORS
    // ============================================

    error InvalidAmount();
    error AmountTooSmall();
    error AmountTooLarge();
    error CommitmentAlreadyExists();
    error CommitmentNotFound();
    error CommitmentExpired();
    error NullifierAlreadyUsed();
    error InvalidMerkleProof();
    error InvalidAddress();
    error InsufficientBalance();
    error TransferFailed();

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize Anonymous Pool
     * @param _kikToken Address of KIK Token contract
     * @param _merkleTree Address of Merkle Tree Manager contract
     */
    constructor(
        address payable _kikToken,
        address _merkleTree
    ) Ownable(msg.sender) {
        if (_kikToken == address(0) || _merkleTree == address(0)) revert InvalidAddress();

        kikToken = KIKTokenV2(_kikToken);
        merkleTree = MerkleTreeManager(_merkleTree);

        // Set default limits
        minDepositAmount = 1 ether;      // 1 KIK minimum
        maxDepositAmount = 1000000 ether; // 1M KIK maximum
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Set minimum deposit amount
     * @param _amount New minimum amount
     */
    function setMinDepositAmount(uint256 _amount) external onlyOwner {
        uint256 oldAmount = minDepositAmount;
        minDepositAmount = _amount;
        emit MinDepositAmountSet(oldAmount, _amount);
    }

    /**
     * @notice Set maximum deposit amount
     * @param _amount New maximum amount
     */
    function setMaxDepositAmount(uint256 _amount) external onlyOwner {
        uint256 oldAmount = maxDepositAmount;
        maxDepositAmount = _amount;
        emit MaxDepositAmountSet(oldAmount, _amount);
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Deposit tokens to anonymous pool
     * @param amount Amount of KIK tokens to deposit
     * @param commitment Commitment hash (hash of secret, nullifier, amount, recipient)
     * @param encryptedData Encrypted note for user (AES encrypted)
     *
     * @dev Process:
     * 1. Validate amount and commitment
     * 2. Burn tokens from sender
     * 3. Insert commitment to Merkle tree
     * 4. Store commitment metadata
     * 5. Update total value locked
     *
     * Gas target: ~200k
     */
    function deposit(
        uint256 amount,
        bytes32 commitment,
        bytes calldata encryptedData
    ) external nonReentrant {
        // Validate amount
        if (amount == 0) revert InvalidAmount();
        if (amount < minDepositAmount) revert AmountTooSmall();
        if (amount > maxDepositAmount) revert AmountTooLarge();

        // Check commitment doesn't already exist
        if (commitments[commitment].isActive) revert CommitmentAlreadyExists();

        // Burn tokens from sender (transfers to this contract, then burns)
        // Note: Sender must approve this contract first
        kikToken.transferFrom(msg.sender, address(this), amount);
        kikToken.burn(address(this), amount);

        // Insert commitment to Merkle tree
        (uint256 leafIndex, ) = merkleTree.insertCommitment(commitment);

        // Store commitment data
        commitments[commitment] = CommitmentData({
            amount: amount,
            timestamp: block.timestamp,
            leafIndex: leafIndex,
            isActive: true
        });

        // Add to commitment tracking list
        commitmentIndex[commitment] = commitmentList.length;
        commitmentList.push(commitment);

        // Update TVL
        totalValueLocked += amount;

        // Emit event with encrypted data
        emit Deposit(commitment, amount, leafIndex, encryptedData, block.timestamp);
    }

    /**
     * @notice Withdraw tokens from anonymous pool
     * @param nullifier Nullifier hash (prevents double-spending)
     * @param recipient Address to receive tokens
     * @param amount Amount to withdraw
     * @param merkleProof Merkle proof for the commitment
     * @param commitment Original commitment hash
     *
     * @dev Process:
     * 1. Verify nullifier not used
     * 2. Verify Merkle proof
     * 3. Verify commitment is valid and not expired
     * 4. Mark nullifier as used
     * 5. Mint tokens to recipient
     * 6. Update commitment status
     *
     * Gas target: ~180k (without ZK proof verification)
     *
     * NOTE: In Phase 2, this will require ZK-SNARK proof instead of revealing commitment
     */
    function withdraw(
        bytes32 nullifier,
        address recipient,
        uint256 amount,
        bytes32[] calldata merkleProof,
        bytes32 commitment
    ) external nonReentrant {
        // Validate recipient
        if (recipient == address(0)) revert InvalidAddress();

        // Check nullifier not already used
        if (usedNullifiers[nullifier]) revert NullifierAlreadyUsed();

        // Get commitment data
        CommitmentData storage commitmentData = commitments[commitment];
        if (!commitmentData.isActive) revert CommitmentNotFound();

        // Verify amount matches
        if (commitmentData.amount != amount) revert InvalidAmount();

        // Check not expired (hard expiry)
        uint256 age = block.timestamp - commitmentData.timestamp;
        if (age > HARD_EXPIRY) revert CommitmentExpired();

        // Verify Merkle proof
        bool isValid = merkleTree.verifyMerkleProof(
            commitment,
            commitmentData.leafIndex,
            merkleProof
        );
        if (!isValid) revert InvalidMerkleProof();

        // Mark nullifier as used
        usedNullifiers[nullifier] = true;

        // Deactivate commitment
        commitmentData.isActive = false;

        // Update TVL
        totalValueLocked -= amount;

        // Mint tokens to recipient
        kikToken.mint(recipient, amount);

        // Emit event
        emit Withdrawal(nullifier, recipient, amount, 0, block.timestamp);
    }

    /**
     * @notice Rewrite commitment to extend expiry
     * @param oldNullifier Nullifier of old commitment
     * @param oldCommitment Old commitment hash
     * @param oldMerkleProof Merkle proof for old commitment
     * @param newCommitment New commitment hash
     * @param newEncryptedData New encrypted note
     *
     * @dev Process:
     * 1. Verify old commitment (like withdraw)
     * 2. Burn old commitment
     * 3. Create new commitment (like deposit)
     * 4. Same amount, fresh timestamp
     *
     * Gas target: ~225k
     */
    function rewrite(
        bytes32 oldNullifier,
        bytes32 oldCommitment,
        bytes32[] calldata oldMerkleProof,
        bytes32 newCommitment,
        bytes calldata newEncryptedData
    ) external nonReentrant {
        // Check old nullifier not used
        if (usedNullifiers[oldNullifier]) revert NullifierAlreadyUsed();

        // Get old commitment data
        CommitmentData storage oldData = commitments[oldCommitment];
        if (!oldData.isActive) revert CommitmentNotFound();

        // Check new commitment doesn't exist
        if (commitments[newCommitment].isActive) revert CommitmentAlreadyExists();

        // Verify old Merkle proof
        bool isValid = merkleTree.verifyMerkleProof(
            oldCommitment,
            oldData.leafIndex,
            oldMerkleProof
        );
        if (!isValid) revert InvalidMerkleProof();

        // Get amount from old commitment
        uint256 amount = oldData.amount;

        // Mark old nullifier as used
        usedNullifiers[oldNullifier] = true;

        // Deactivate old commitment
        oldData.isActive = false;

        // Insert new commitment to Merkle tree
        (uint256 newLeafIndex, ) = merkleTree.insertCommitment(newCommitment);

        // Store new commitment data with fresh timestamp
        commitments[newCommitment] = CommitmentData({
            amount: amount,
            timestamp: block.timestamp, // Fresh timestamp!
            leafIndex: newLeafIndex,
            isActive: true
        });

        // Update commitment tracking list
        commitmentIndex[newCommitment] = commitmentList.length;
        commitmentList.push(newCommitment);

        // TVL stays the same (no mint/burn)

        // Emit event
        emit Rewrite(oldNullifier, newCommitment, amount, newLeafIndex, block.timestamp);
    }

    // ============================================
    // EXPIRY & BURNING FUNCTIONS
    // ============================================

    /**
     * @notice Get commitment age in days
     * @param commitment Commitment hash
     * @return age Age in days
     */
    function getCommitmentAge(bytes32 commitment) public view returns (uint256 age) {
        CommitmentData storage data = commitments[commitment];
        if (!data.isActive) return 0;

        uint256 ageInSeconds = block.timestamp - data.timestamp;
        return ageInSeconds / 1 days;
    }

    /**
     * @notice Check if commitment is in grace period
     * @param commitment Commitment hash
     * @return isInGrace True if in grace period (91-105 days)
     */
    function isInGracePeriod(bytes32 commitment) public view returns (bool isInGrace) {
        uint256 age = getCommitmentAge(commitment);
        return age >= (SOFT_EXPIRY / 1 days) && age < (HARD_EXPIRY / 1 days);
    }

    /**
     * @notice Check if commitment is expired (hard expiry)
     * @param commitment Commitment hash
     * @return expired True if older than 105 days
     */
    function isExpired(bytes32 commitment) public view returns (bool expired) {
        uint256 age = getCommitmentAge(commitment);
        return age >= (HARD_EXPIRY / 1 days);
    }

    /**
     * @notice Get all expired commitments
     * @return expired Array of expired commitment hashes
     *
     * @dev This will be called by BurningSystem contract in Phase 1, Week 4-5
     */
    function getExpiredCommitments() external view returns (bytes32[] memory expired) {
        // Count expired commitments
        uint256 count = 0;
        for (uint256 i = 0; i < commitmentList.length; i++) {
            bytes32 c = commitmentList[i];
            if (commitments[c].isActive && isExpired(c)) {
                count++;
            }
        }

        // Build array
        expired = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < commitmentList.length; i++) {
            bytes32 c = commitmentList[i];
            if (commitments[c].isActive && isExpired(c)) {
                expired[index] = c;
                index++;
            }
        }

        return expired;
    }

    /**
     * @notice Burn expired commitment (callable by anyone or BurningSystem)
     * @param commitment Commitment to burn
     *
     * @dev Only burns if commitment is past hard expiry (105 days)
     * @dev In Phase 1 Week 4-5, this will be integrated with BurningSystem
     */
    function burnExpiredCommitment(bytes32 commitment) external nonReentrant {
        CommitmentData storage data = commitments[commitment];

        // Must be active and expired
        if (!data.isActive) revert CommitmentNotFound();
        if (!isExpired(commitment)) revert("Not expired yet");

        // Calculate age
        uint256 age = getCommitmentAge(commitment);

        // Deactivate commitment
        data.isActive = false;

        // Update TVL (tokens are already burned, just accounting)
        totalValueLocked -= data.amount;

        // Emit event
        emit CommitmentBurned(commitment, data.amount, age);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get total number of commitments
     * @return count Total commitments created
     */
    function getTotalCommitments() external view returns (uint256 count) {
        return commitmentList.length;
    }

    /**
     * @notice Get total active commitments
     * @return count Number of active commitments
     */
    function getActiveCommitments() external view returns (uint256 count) {
        for (uint256 i = 0; i < commitmentList.length; i++) {
            if (commitments[commitmentList[i]].isActive) {
                count++;
            }
        }
        return count;
    }

    /**
     * @notice Get pool statistics
     * @return tvl Total value locked
     * @return totalCommits Total commitments
     * @return activeCommits Active commitments
     */
    function getPoolStats() external view returns (
        uint256 tvl,
        uint256 totalCommits,
        uint256 activeCommits
    ) {
        tvl = totalValueLocked;
        totalCommits = commitmentList.length;

        for (uint256 i = 0; i < commitmentList.length; i++) {
            if (commitments[commitmentList[i]].isActive) {
                activeCommits++;
            }
        }

        return (tvl, totalCommits, activeCommits);
    }

    /**
     * @notice Check if nullifier has been used
     * @param nullifier Nullifier hash
     * @return used True if already used
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool used) {
        return usedNullifiers[nullifier];
    }

    /**
     * @notice Get commitment details
     * @param commitment Commitment hash
     * @return amount Token amount
     * @return timestamp Creation time
     * @return leafIndex Merkle tree index
     * @return isActive Active status
     * @return age Age in days
     */
    function getCommitmentDetails(bytes32 commitment) external view returns (
        uint256 amount,
        uint256 timestamp,
        uint256 leafIndex,
        bool isActive,
        uint256 age
    ) {
        CommitmentData storage data = commitments[commitment];
        return (
            data.amount,
            data.timestamp,
            data.leafIndex,
            data.isActive,
            getCommitmentAge(commitment)
        );
    }

    // ============================================
    // BURNING SYSTEM INTEGRATION
    // ============================================

    /**
     * @notice Set burning system contract address
     * @param _burningSystem Address of BurningSystem contract
     * @dev Only owner can set
     */
    function setBurningSystem(address _burningSystem) external onlyOwner {
        require(_burningSystem != address(0), "Zero address");
        burningSystem = _burningSystem;
    }

    /**
     * @notice Burn an expired commitment (called by BurningSystem)
     * @param commitment The commitment hash to burn
     * @dev Only callable by BurningSystem contract
     */
    function burnCommitment(bytes32 commitment) external nonReentrant {
        require(msg.sender == burningSystem, "Only burning system");

        CommitmentData storage data = commitments[commitment];
        require(data.isActive, "Commitment not active");

        uint256 age = getCommitmentAge(commitment);
        require(age >= SOFT_EXPIRY, "Not expired");

        // Mark commitment as inactive (burned)
        data.isActive = false;

        // Decrease TVL
        totalValueLocked -= data.amount;

        // Note: Tokens were already burned during deposit
        // This just marks the commitment as unusable

        emit CommitmentBurned(commitment, data.amount, age);
    }

    /**
     * @notice Get all commitments (for burning system)
     * @return Array of commitment hashes
     */
    function getCommitments() external view returns (bytes32[] memory) {
        return commitmentList;
    }
}
