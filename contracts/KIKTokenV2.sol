// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KIK Token V2
 * @notice Enhanced ERC-20 token with anonymous pool integration
 * @dev Implements dynamic fees, pause mechanism, and burn/mint for pool
 *
 * Key Features:
 * - Standard ERC-20 functionality for public transfers
 * - Integration with anonymous pool (burn/mint mechanics)
 * - Dynamic fee system (0.5-5% based on network conditions)
 * - Pause mechanism with dynamic fee for community unpausing
 * - Fee distribution (70% creator, 30% pool reinvestment)
 *
 * Security:
 * - Only authorized pool contract can mint tokens
 * - Reentrancy protection on critical functions
 * - Pausable transfers for emergency situations
 */
contract KIKTokenV2 is ERC20, Ownable, ReentrancyGuard {

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Maximum total supply (10 billion tokens)
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18;

    /// @notice Anonymous pool contract address (can mint/burn)
    address public anonymousPool;

    /// @notice Fee collector address (receives 70% of fees)
    address public feeCollector;

    /// @notice Contract pause state
    bool public paused;

    /// @notice Fee required to unpause contract (in MATIC wei)
    uint256 public pauseFee;

    /// @notice Base fee percentage (in basis points, 50 = 0.5%)
    uint256 public baseFeeRate;

    /// @notice Maximum fee percentage (in basis points, 500 = 5%)
    uint256 public constant MAX_FEE_RATE = 500;

    /// @notice Minimum fee percentage (in basis points, 50 = 0.5%)
    uint256 public constant MIN_FEE_RATE = 50;

    /// @notice Total fees collected in KIK tokens
    uint256 public totalFeesCollected;

    /// @notice Last block number for congestion calculation
    uint256 private lastCongestionBlock;

    /// @notice Transaction count in congestion window
    uint256 private congestionTxCount;

    /// @notice Congestion measurement window (blocks)
    uint256 public constant CONGESTION_WINDOW = 100;

    // ============================================
    // EVENTS
    // ============================================

    event AnonymousPoolSet(address indexed oldPool, address indexed newPool);
    event FeeCollectorSet(address indexed oldCollector, address indexed newCollector);
    event PauseFeeSet(uint256 oldFee, uint256 newFee);
    event BaseFeeRateSet(uint256 oldRate, uint256 newRate);
    event Paused(address indexed by);
    event Unpaused(address indexed by, uint256 feePaid);
    event FeeCollected(address indexed from, address indexed to, uint256 amount, uint256 feeAmount);
    event TokensBurned(address indexed from, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);

    // ============================================
    // ERRORS
    // ============================================

    error ContractIsPaused();
    error ContractNotPaused();
    error UnauthorizedMinter();
    error InvalidAddress();
    error InvalidFeeRate();
    error InvalidAmount();
    error InsufficientPauseFee();
    error MaxSupplyExceeded();
    error TransferFailed();

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize KIK Token V2
     * @param _feeCollector Address to receive 70% of fees
     */
    constructor(address _feeCollector) ERC20("KIK Token", "KIK") Ownable(msg.sender) {
        if (_feeCollector == address(0)) revert InvalidAddress();

        feeCollector = _feeCollector;
        baseFeeRate = MIN_FEE_RATE; // Start at 0.5%
        pauseFee = 0.1 ether; // 0.1 MATIC
        paused = false;

        // Mint initial supply to owner (can be adjusted)
        _mint(msg.sender, MAX_SUPPLY);

        emit FeeCollectorSet(address(0), _feeCollector);
        emit BaseFeeRateSet(0, MIN_FEE_RATE);
        emit PauseFeeSet(0, pauseFee);
    }

    // ============================================
    // MODIFIERS
    // ============================================

    /// @notice Ensure contract is not paused
    modifier whenNotPaused() {
        if (paused) revert ContractIsPaused();
        _;
    }

    /// @notice Ensure contract is paused
    modifier whenPaused() {
        if (!paused) revert ContractNotPaused();
        _;
    }

    /// @notice Ensure caller is anonymous pool
    modifier onlyPool() {
        if (msg.sender != anonymousPool) revert UnauthorizedMinter();
        _;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Set anonymous pool contract address
     * @param _pool Address of the anonymous pool contract
     */
    function setAnonymousPool(address _pool) external onlyOwner {
        if (_pool == address(0)) revert InvalidAddress();

        address oldPool = anonymousPool;
        anonymousPool = _pool;

        emit AnonymousPoolSet(oldPool, _pool);
    }

    /**
     * @notice Set fee collector address
     * @param _collector New fee collector address
     */
    function setFeeCollector(address _collector) external onlyOwner {
        if (_collector == address(0)) revert InvalidAddress();

        address oldCollector = feeCollector;
        feeCollector = _collector;

        emit FeeCollectorSet(oldCollector, _collector);
    }

    /**
     * @notice Set pause fee (in MATIC wei)
     * @param _fee New pause fee
     */
    function setPauseFee(uint256 _fee) external onlyOwner {
        uint256 oldFee = pauseFee;
        pauseFee = _fee;

        emit PauseFeeSet(oldFee, _fee);
    }

    /**
     * @notice Set base fee rate
     * @param _rate New base fee rate (in basis points)
     */
    function setBaseFeeRate(uint256 _rate) external onlyOwner {
        if (_rate < MIN_FEE_RATE || _rate > MAX_FEE_RATE) revert InvalidFeeRate();

        uint256 oldRate = baseFeeRate;
        baseFeeRate = _rate;

        emit BaseFeeRateSet(oldRate, _rate);
    }

    /**
     * @notice Pause contract (owner only)
     * @dev Stops all transfers except pool operations
     */
    function pause() external payable onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Unpause contract
     * @dev Anyone can unpause by paying the pause fee
     */
    function unpause() external payable whenPaused nonReentrant {
        if (msg.value < pauseFee) revert InsufficientPauseFee();

        paused = false;

        // Transfer fee to owner
        (bool success, ) = owner().call{value: msg.value}("");
        if (!success) revert TransferFailed();

        emit Unpaused(msg.sender, msg.value);
    }

    // ============================================
    // POOL FUNCTIONS (Burn & Mint)
    // ============================================

    /**
     * @notice Burn tokens (only callable by pool)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyPool {
        if (amount == 0) revert InvalidAmount();

        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @notice Mint tokens (only callable by pool)
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyPool {
        if (amount == 0) revert InvalidAmount();
        if (totalSupply() + amount > MAX_SUPPLY) revert MaxSupplyExceeded();

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    // ============================================
    // FEE CALCULATION
    // ============================================

    /**
     * @notice Calculate dynamic transfer fee
     * @param amount Transfer amount
     * @return fee Fee amount in tokens
     *
     * @dev Fee formula: baseFee * (1 + congestionMultiplier) * (1 + utilizationMultiplier)
     * - Congestion: Based on recent transaction count
     * - Utilization: Based on pool balance vs total supply (would need pool integration)
     * - Current implementation: Simple congestion-based fee
     */
    function calculateFee(uint256 amount) public view returns (uint256 fee) {
        // Update congestion metrics (view function, so we estimate)
        uint256 congestionMultiplier = _calculateCongestionMultiplier();

        // For MVP: Simple fee = baseFeeRate * amount * (1 + congestion)
        // Future: Add pool utilization multiplier
        uint256 effectiveFeeRate = baseFeeRate + (baseFeeRate * congestionMultiplier / 100);

        // Cap at MAX_FEE_RATE
        if (effectiveFeeRate > MAX_FEE_RATE) {
            effectiveFeeRate = MAX_FEE_RATE;
        }

        // Calculate fee (basis points to percentage)
        fee = (amount * effectiveFeeRate) / 10000;
    }

    /**
     * @notice Calculate network congestion multiplier
     * @return multiplier Congestion multiplier (0-400, representing 0-4x)
     *
     * @dev Measures transaction density in recent blocks
     * - Low congestion (0-20 tx): 0% multiplier
     * - Medium (20-50 tx): 0-100% multiplier
     * - High (50-100 tx): 100-400% multiplier
     */
    function _calculateCongestionMultiplier() internal view returns (uint256 multiplier) {
        // Simplified congestion: based on how many blocks since last measurement
        // In production, this would track actual tx count

        uint256 blocksSinceLastTx = block.number - lastCongestionBlock;

        if (blocksSinceLastTx < 10) {
            // High congestion: transactions in last 10 blocks
            multiplier = 200; // 2x fee
        } else if (blocksSinceLastTx < 50) {
            // Medium congestion
            multiplier = 100; // 1x fee (double the base)
        } else {
            // Low congestion
            multiplier = 0; // No multiplier (just base fee)
        }

        return multiplier;
    }

    // ============================================
    // TRANSFER FUNCTIONS (Override)
    // ============================================

    /**
     * @notice Transfer tokens with dynamic fee
     * @param to Recipient address
     * @param amount Amount to transfer (before fees)
     * @return success Transfer success
     */
    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return _transferWithFee(msg.sender, to, amount);
    }

    /**
     * @notice TransferFrom with dynamic fee
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer (before fees)
     * @return success Transfer success
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        // Check allowance
        _spendAllowance(from, msg.sender, amount);

        return _transferWithFee(from, to, amount);
    }

    /**
     * @notice Internal transfer with fee collection
     * @param from Sender
     * @param to Recipient
     * @param amount Amount (before fees)
     * @return success Transfer success
     */
    function _transferWithFee(address from, address to, uint256 amount) internal returns (bool) {
        if (amount == 0) revert InvalidAmount();

        // Calculate fee
        uint256 fee = calculateFee(amount);
        uint256 amountAfterFee = amount - fee;

        // Update congestion tracking
        _updateCongestionMetrics();

        if (fee > 0) {
            // Split fee: 70% to feeCollector, 30% to pool
            uint256 feeToCollector = (fee * 70) / 100;
            uint256 feeToPool = fee - feeToCollector;

            // Transfer fee to collector
            _transfer(from, feeCollector, feeToCollector);

            // Transfer fee to pool (if pool is set)
            if (anonymousPool != address(0)) {
                _transfer(from, anonymousPool, feeToPool);
            } else {
                // If pool not set, send all to collector
                _transfer(from, feeCollector, feeToPool);
            }

            totalFeesCollected += fee;
            emit FeeCollected(from, to, amount, fee);
        }

        // Transfer remaining amount
        _transfer(from, to, amountAfterFee);

        return true;
    }

    /**
     * @notice Update congestion metrics
     * @dev Called on each transfer to track network activity
     */
    function _updateCongestionMetrics() internal {
        uint256 currentBlock = block.number;

        // Reset counter if we're in a new window
        if (currentBlock - lastCongestionBlock > CONGESTION_WINDOW) {
            congestionTxCount = 1;
            lastCongestionBlock = currentBlock;
        } else {
            congestionTxCount++;
        }
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get current congestion level
     * @return txCount Number of transactions in current window
     * @return windowStart Block number of window start
     */
    function getCongestionMetrics() external view returns (uint256 txCount, uint256 windowStart) {
        return (congestionTxCount, lastCongestionBlock);
    }

    /**
     * @notice Check if address is the pool
     * @param account Address to check
     * @return isPool True if address is pool
     */
    function isPool(address account) external view returns (bool) {
        return account == anonymousPool;
    }

    // ============================================
    // RECEIVE FUNCTION
    // ============================================

    /// @notice Reject direct MATIC transfers
    receive() external payable {
        revert("Direct MATIC transfers not accepted");
    }
}
