// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MerkleTreeManager
 * @notice Gas-optimized Merkle tree for anonymous commitment tracking
 * @dev Implements sparse Merkle tree with depth 21 (2M max commitments)
 *
 * Key Features:
 * - Depth 21 tree (2,097,152 max leaves)
 * - Sparse storage: O(depth) instead of O(2^depth)
 * - Root history: Last 100 roots for historical proof verification
 * - Keccak256 hashing (will be replaced with Poseidon in Phase 2 for ZK)
 * - Gas optimized: <200k per insertion, <100k per verification
 *
 * Security:
 * - Only authorized pool contract can insert commitments
 * - Prevents root history manipulation
 * - Emits events for all state changes
 */
contract MerkleTreeManager {

    // ============================================
    // CONSTANTS
    // ============================================

    /// @notice Merkle tree depth (21 levels = 2^21 = 2,097,152 leaves)
    uint8 public constant TREE_DEPTH = 21;

    /// @notice Maximum number of leaves in the tree
    uint256 public constant MAX_LEAVES = 2_097_152;

    /// @notice Zero value for empty tree nodes
    bytes32 public constant ZERO_VALUE = bytes32(0);

    /// @notice Number of historical roots to store
    uint8 public constant ROOT_HISTORY_SIZE = 100;

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Current Merkle tree root
    bytes32 public currentRoot;

    /// @notice Index for next leaf insertion (also serves as leaf count)
    uint256 public nextLeafIndex;

    /// @notice Authorized pool contract that can insert commitments
    address public poolContract;

    /// @notice Owner address (for setup and emergency functions)
    address public owner;

    /// @notice Side hashes for active insertion path (sparse storage)
    /// @dev Only stores sibling hashes on the path from last inserted leaf to root
    /// @dev This reduces storage from 2M entries to just 21 entries
    mapping(uint256 level => bytes32 sideHash) public sides;

    /// @notice Root history (circular buffer of last 100 roots)
    /// @dev Allows proof verification against recent historical roots
    bytes32[ROOT_HISTORY_SIZE] public rootHistory;

    /// @notice Current index in root history circular buffer
    uint256 public historyIndex;

    /// @notice Precomputed zero hashes for each tree level
    /// @dev Computed once in constructor for gas efficiency
    bytes32[TREE_DEPTH] public zeroHashes;

    // ============================================
    // EVENTS
    // ============================================

    event CommitmentInserted(
        uint256 indexed leafIndex,
        bytes32 indexed commitment,
        bytes32 indexed newRoot,
        uint256 timestamp
    );

    event RootUpdated(bytes32 oldRoot, bytes32 newRoot);

    event PoolContractSet(address indexed oldPool, address indexed newPool);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============================================
    // ERRORS
    // ============================================

    error TreeFull();
    error Unauthorized();
    error InvalidProofLength();
    error InvalidLeafIndex();
    error ZeroAddress();
    error ProofNotFound();

    // ============================================
    // MODIFIERS
    // ============================================

    /// @notice Ensure caller is the authorized pool contract
    modifier onlyPool() {
        if (msg.sender != poolContract) revert Unauthorized();
        _;
    }

    /// @notice Ensure caller is the owner
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize Merkle tree with precomputed zero hashes
     * @dev Computes zero hashes for all 21 levels at deployment
     */
    constructor() {
        owner = msg.sender;

        // Precompute zero hashes for each level
        // Level 0: hash(0)
        // Level 1: hash(level0, level0)
        // Level 2: hash(level1, level1)
        // ... and so on
        bytes32 current = ZERO_VALUE;
        for (uint256 i = 0; i < TREE_DEPTH; ) {
            zeroHashes[i] = current;
            current = _hashPair(current, current);

            unchecked { ++i; }
        }

        // Set initial root as top-level zero hash
        currentRoot = current;
        rootHistory[0] = current;

        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Set the authorized pool contract address
     * @param _poolContract Address of the anonymous pool contract
     */
    function setPoolContract(address _poolContract) external onlyOwner {
        if (_poolContract == address(0)) revert ZeroAddress();

        address oldPool = poolContract;
        poolContract = _poolContract;

        emit PoolContractSet(oldPool, _poolContract);
    }

    /**
     * @notice Transfer ownership to a new address
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();

        address oldOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // ============================================
    // CORE FUNCTIONS - TO BE IMPLEMENTED
    // ============================================

    /**
     * @notice Insert a new commitment into the Merkle tree
     * @param commitment The commitment hash to insert
     * @return leafIndex The index where commitment was inserted
     * @return newRoot The new Merkle root after insertion
     *
     * @dev Implements sparse tree insertion with O(depth) complexity
     * @dev Updates active path siblings and root history
     * @dev Gas optimized with unchecked arithmetic and bitwise operations
     * @dev Gas target: <200k
     */
    function insertCommitment(bytes32 commitment)
        external
        onlyPool
        returns (uint256 leafIndex, bytes32 newRoot)
    {
        // Check if tree is full
        if (nextLeafIndex >= MAX_LEAVES) revert TreeFull();

        // Get current leaf index and increment for next insertion
        leafIndex = nextLeafIndex;
        unchecked {
            nextLeafIndex++;
        }

        // Start with commitment hash as current node
        bytes32 currentHash = commitment;
        uint256 currentIndex = leafIndex;

        // Build path from leaf to root
        for (uint256 level = 0; level < TREE_DEPTH; ) {
            // Determine if current node is left (0) or right (1) child
            bool isLeftChild = (currentIndex & 1) == 0;

            bytes32 sibling;

            if (isLeftChild) {
                // If left child, save current hash as side for future insertions
                sides[level] = currentHash;

                // Right sibling is zero (empty subtree)
                sibling = zeroHashes[level];

                // Hash with zero sibling on the right
                currentHash = _hashPair(currentHash, sibling);
            } else {
                // If right child, use previously saved left sibling
                sibling = sides[level];

                // Hash with saved sibling on the left
                currentHash = _hashPair(sibling, currentHash);
            }

            // Move to parent node index
            currentIndex >>= 1;

            unchecked {
                ++level;
            }
        }

        // Store old root for event
        bytes32 oldRoot = currentRoot;

        // Update current root
        currentRoot = currentHash;
        newRoot = currentHash;

        // Add to root history (circular buffer)
        rootHistory[historyIndex] = currentHash;

        // Update history index (wrap around at 100)
        unchecked {
            historyIndex = (historyIndex + 1) % ROOT_HISTORY_SIZE;
        }

        // Emit events
        emit CommitmentInserted(leafIndex, commitment, newRoot, block.timestamp);
        emit RootUpdated(oldRoot, newRoot);

        return (leafIndex, newRoot);
    }

    /**
     * @notice Verify a Merkle proof against the current root
     * @param leaf The leaf value to verify
     * @param leafIndex The index of the leaf in the tree
     * @param proof Array of sibling hashes from leaf to root
     * @return isValid True if proof is valid
     *
     * @dev Uses calldata for proof to minimize gas costs
     * @dev Gas target: <100k
     */
    function verifyMerkleProof(
        bytes32 leaf,
        uint256 leafIndex,
        bytes32[] calldata proof
    ) external view returns (bool isValid) {
        // Validate proof length
        if (proof.length != TREE_DEPTH) revert InvalidProofLength();

        // Compute root from leaf and proof
        bytes32 computedRoot = _computeRoot(leaf, leafIndex, proof);

        // Check if computed root matches current root
        return computedRoot == currentRoot;
    }

    /**
     * @notice Verify a Merkle proof against historical roots
     * @param leaf The leaf value to verify
     * @param leafIndex The index of the leaf in the tree
     * @param proof Array of sibling hashes from leaf to root
     * @param maxRootAge Maximum age of root to check (0-99)
     * @return isValid True if proof is valid against any historical root
     * @return rootAge Age of the matched root (0 = current, 1 = previous, etc.)
     *
     * @dev Checks current root first, then searches root history
     * @dev Returns (false, 0) if no match found
     */
    function verifyHistoricalProof(
        bytes32 leaf,
        uint256 leafIndex,
        bytes32[] calldata proof,
        uint256 maxRootAge
    ) external view returns (bool isValid, uint256 rootAge) {
        // Validate proof length
        if (proof.length != TREE_DEPTH) revert InvalidProofLength();

        // Compute root from leaf and proof
        bytes32 computedRoot = _computeRoot(leaf, leafIndex, proof);

        // Check current root first (age 0)
        if (computedRoot == currentRoot) {
            return (true, 0);
        }

        // Limit maxRootAge to history size
        uint256 maxAge = maxRootAge < ROOT_HISTORY_SIZE ? maxRootAge : ROOT_HISTORY_SIZE;

        // Search through root history
        for (uint256 i = 0; i < maxAge; ) {
            if (rootHistory[i] == computedRoot) {
                return (true, i);
            }

            unchecked {
                ++i;
            }
        }

        // Not found in history
        return (false, 0);
    }

    // ============================================
    // ROOT HISTORY FUNCTIONS
    // ============================================

    /**
     * @notice Get a specific historical root by index
     * @param index Index in root history (0-99)
     * @return root The root at that index
     *
     * @dev Index 0 is the oldest root, index 99 is the newest (if full)
     */
    function getHistoricalRoot(uint256 index) external view returns (bytes32 root) {
        if (index >= ROOT_HISTORY_SIZE) revert InvalidLeafIndex();
        return rootHistory[index];
    }

    /**
     * @notice Check if a root exists in history
     * @param root The root to search for
     * @return isValid True if root is found in history
     * @return age Age of the root (0 = current, 1 = oldest in history, etc.)
     *
     * @dev Searches through all 100 historical roots
     * @dev Returns age relative to history buffer, not absolute age
     */
    function isValidHistoricalRoot(bytes32 root)
        external
        view
        returns (bool isValid, uint256 age)
    {
        // Check current root first
        if (root == currentRoot) {
            return (true, 0);
        }

        // Search through root history
        for (uint256 i = 0; i < ROOT_HISTORY_SIZE; ) {
            if (rootHistory[i] == root) {
                return (true, i + 1); // age starts from 1 for historical roots
            }

            unchecked {
                ++i;
            }
        }

        // Not found
        return (false, 0);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get the current Merkle root
     * @return root Current root hash
     */
    function getRoot() external view returns (bytes32 root) {
        return currentRoot;
    }

    /**
     * @notice Get the number of leaves in the tree
     * @return count Number of inserted leaves
     */
    function getLeafCount() external view returns (uint256 count) {
        return nextLeafIndex;
    }

    /**
     * @notice Get the zero hash for a specific level
     * @param level Tree level (0-20)
     * @return zeroHash The zero hash for that level
     */
    function getZeroHash(uint256 level) external view returns (bytes32 zeroHash) {
        if (level >= TREE_DEPTH) revert InvalidLeafIndex();
        return zeroHashes[level];
    }

    /**
     * @notice Get the side hash for a specific level
     * @param level Tree level (0-20)
     * @return sideHash The side hash for that level
     */
    function getSideHash(uint256 level) external view returns (bytes32 sideHash) {
        return sides[level];
    }

    /**
     * @notice Check if tree is full
     * @return isFull True if tree has reached MAX_LEAVES
     */
    function isTreeFull() external view returns (bool isFull) {
        return nextLeafIndex >= MAX_LEAVES;
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    /**
     * @notice Compute Merkle root from leaf and proof path
     * @param leaf Leaf value
     * @param leafIndex Index of the leaf in the tree
     * @param proof Array of sibling hashes from leaf to root
     * @return root The computed Merkle root
     *
     * @dev Internal helper used by verification functions
     * @dev Gas optimized with unchecked arithmetic and bitwise operations
     */
    function _computeRoot(
        bytes32 leaf,
        uint256 leafIndex,
        bytes32[] calldata proof
    ) internal pure returns (bytes32 root) {
        bytes32 computedHash = leaf;
        uint256 index = leafIndex;

        // Reconstruct root by hashing up the tree
        for (uint256 i = 0; i < TREE_DEPTH; ) {
            bytes32 proofElement = proof[i];

            // Determine if current node is left (0) or right (1) child
            if ((index & 1) == 0) {
                // Current node is left child, proof element is right sibling
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Current node is right child, proof element is left sibling
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }

            // Move to parent node
            index >>= 1;

            unchecked {
                ++i;
            }
        }

        return computedHash;
    }

    /**
     * @notice Hash a pair of values (left, right)
     * @param left Left node hash
     * @param right Right node hash
     * @return hash The hash of the pair
     *
     * @dev Currently uses Keccak256 for MVP
     * @dev Will be replaced with Poseidon hash in Phase 2 for ZK-SNARK compatibility
     * @dev Uses standard left-to-right hashing (NOT sorted) for consistency with proof verification
     */
    function _hashPair(bytes32 left, bytes32 right) internal pure returns (bytes32 hash) {
        // Standard hashing: always left then right
        return keccak256(abi.encodePacked(left, right));
    }

    // ============================================
    // HELPER FUNCTIONS FOR TESTING
    // ============================================

    /**
     * @notice Compute Merkle root from leaf and proof (for testing)
     * @param leaf Leaf value
     * @param leafIndex Index of the leaf
     * @param proof Merkle proof path
     * @return root Computed root
     *
     * @dev Public helper function for testing proof generation
     */
    function computeRoot(
        bytes32 leaf,
        uint256 leafIndex,
        bytes32[] calldata proof
    ) external pure returns (bytes32 root) {
        if (proof.length != TREE_DEPTH) revert InvalidProofLength();

        bytes32 computedHash = leaf;
        uint256 index = leafIndex;

        for (uint256 i = 0; i < TREE_DEPTH; ) {
            bytes32 proofElement = proof[i];

            if ((index & 1) == 0) {
                // Current node is left child
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Current node is right child
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }

            index >>= 1;
            unchecked { ++i; }
        }

        return computedHash;
    }
}
