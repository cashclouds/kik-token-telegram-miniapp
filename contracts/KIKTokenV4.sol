// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title KIKTokenV4
 * @notice KIK Token V4 - Enhanced with Token Rental and Transfer History
 * @dev Extended KIKTokenV3 with rental functionality and ownership history
 *
 * New Features:
 * - Token rental (temporary transfers with auto-return)
 * - Ownership history tracking
 * - Secure rental management
 * - Transfer and rental events with metadata
 */
contract KIKTokenV4 is ERC20, Ownable, Pausable {
    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Total supply: 1 billion tokens (scaled for 10M+ users)
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;

    /// @notice Transfer fee percentage (2% = 200 basis points)
    uint256 public transferFeePercent = 200; // 2%
    uint256 public constant MAX_FEE_PERCENT = 500; // Max 5%
    uint256 public constant FEE_DENOMINATOR = 10000; // 100.00%

    /// @notice Reward pool address (receives transfer fees)
    address public rewardPool;

    /// @notice Fee collector address
    address public feeCollector;

    /// @notice Addresses exempt from transfer fees
    mapping(address => bool) public isFeeExempt;

    /// @notice Vesting schedules for locked tokens
    struct VestingSchedule {
        uint256 totalAmount;      // Total tokens vested
        uint256 releasedAmount;   // Tokens already released
        uint256 startTime;        // Vesting start timestamp
        uint256 duration;         // Vesting duration in seconds
        uint256 cliffDuration;    // Cliff period before any tokens release
    }

    /// @notice Vesting schedules per address
    mapping(address => VestingSchedule) public vestingSchedules;

    // ============================================
    // NEW: TOKEN RENTAL SYSTEM
    // ============================================

    /// @notice Rental agreement structure
    struct RentalAgreement {
        address renter;           // Current renter (temporary holder)
        address originalOwner;    // Original owner
        uint256 amount;           // Amount rented
        uint256 startTime;        // Rental start timestamp
        uint256 endTime;          // Rental end timestamp
        bool isActive;            // Whether rental is active
    }

    /// @notice Rental agreements by token holder
    mapping(address => RentalAgreement) public rentalAgreements;

    /// @notice Token ownership history
    struct OwnershipRecord {
        address owner;
        uint256 amount;
        uint256 timestamp;
        string transferType;     // "transfer", "rental_start", "rental_end"
        address relatedAddress;   // Other party in transfer
    }

    /// @notice Ownership history per token holder
    mapping(address => OwnershipRecord[]) public ownershipHistory;

    // ============================================
    // EVENTS
    // ============================================

    event RewardPoolUpdated(address indexed oldPool, address indexed newPool);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);
    event TransferFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeExemptionUpdated(address indexed account, bool exempt);
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 amount,
        uint256 startTime,
        uint256 duration,
        uint256 cliffDuration
    );
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event FeeCollected(address indexed from, address indexed to, uint256 amount);

    // NEW: Rental and History Events
    event TokenRented(
        address indexed originalOwner,
        address indexed renter,
        uint256 amount,
        uint256 duration,
        uint256 endTime
    );
    event TokenReturned(
        address indexed originalOwner,
        address indexed renter,
        uint256 amount
    );
    event OwnershipRecorded(
        address indexed owner,
        uint256 amount,
        string transferType,
        address relatedAddress
    );

    // ============================================
    // ERRORS
    // ============================================

    error InvalidAddress();
    error FeeTooHigh();
    error VestingAlreadyExists();
    error NoVestingSchedule();
    error NoTokensToRelease();
    error InsufficientVestedTokens();
    error RentalAlreadyActive();
    error NoActiveRental();
    error RentalNotExpired();
    error InvalidRentalDuration();
    error TransferNotAllowedDuringRental();

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize KIK Token V4
     * @param _feeCollector Address to receive collected fees
     * @param _rewardPool Address of reward distribution pool
     */
    constructor(
        address _feeCollector,
        address _rewardPool
    ) ERC20("KIK Token", "KIK") Ownable(msg.sender) {
        if (_feeCollector == address(0) || _rewardPool == address(0)) revert InvalidAddress();

        feeCollector = _feeCollector;
        rewardPool = _rewardPool;

        // Mint total supply to deployer
        _mint(msg.sender, TOTAL_SUPPLY);

        // Exempt key addresses from fees
        isFeeExempt[msg.sender] = true;
        isFeeExempt[_feeCollector] = true;
        isFeeExempt[_rewardPool] = true;
        isFeeExempt[address(this)] = true;

        emit RewardPoolUpdated(address(0), _rewardPool);
        emit FeeCollectorUpdated(address(0), _feeCollector);
    }

    // ============================================
    // TRANSFER FUNCTIONS (ENHANCED)
    // ============================================

    /**
     * @notice Override transfer to include fee mechanism and rental checks
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transfer(address to, uint256 amount)
        public
        override
        whenNotPaused
        returns (bool)
    {
        // Check if sender has active rental agreement
        RentalAgreement storage senderRental = rentalAgreements[msg.sender];
        if (senderRental.isActive) {
            revert TransferNotAllowedDuringRental();
        }

        bool success = _transferWithFee(msg.sender, to, amount);

        if (success) {
            // Record ownership transfer
            _recordOwnership(msg.sender, to, amount, "transfer");
        }

        return success;
    }

    /**
     * @notice Override transferFrom to include fee mechanism and rental checks
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transferFrom(address from, address to, uint256 amount)
        public
        override
        whenNotPaused
        returns (bool)
    {
        // Check if sender has active rental agreement
        RentalAgreement storage senderRental = rentalAgreements[from];
        if (senderRental.isActive) {
            revert TransferNotAllowedDuringRental();
        }

        _spendAllowance(from, msg.sender, amount);
        bool success = _transferWithFee(from, to, amount);

        if (success) {
            // Record ownership transfer
            _recordOwnership(from, to, amount, "transfer");
        }

        return success;
    }

    /**
     * @notice Internal transfer with fee calculation
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function _transferWithFee(address from, address to, uint256 amount)
        internal
        returns (bool)
    {
        // Check if either party is fee exempt
        if (isFeeExempt[from] || isFeeExempt[to]) {
            _transfer(from, to, amount);
            return true;
        }

        // Calculate fee
        uint256 feeAmount = (amount * transferFeePercent) / FEE_DENOMINATOR;
        uint256 amountAfterFee = amount - feeAmount;

        // Transfer fee to reward pool
        if (feeAmount > 0) {
            _transfer(from, rewardPool, feeAmount);
            emit FeeCollected(from, rewardPool, feeAmount);
        }

        // Transfer remaining amount to recipient
        _transfer(from, to, amountAfterFee);

        return true;
    }

    // ============================================
    // NEW: TOKEN RENTAL FUNCTIONS
    // ============================================

    /**
     * @notice Rent tokens to another address (temporary transfer)
     * @param renter Address that will temporarily hold tokens
     * @param amount Amount of tokens to rent
     * @param duration Rental duration in seconds
     */
    function rentTokens(address renter, uint256 amount, uint256 duration)
        external
        whenNotPaused
        returns (uint256 endTime)
    {
        if (renter == address(0)) revert InvalidAddress();
        if (duration == 0 || duration > 30 days) revert InvalidRentalDuration();

        RentalAgreement storage agreement = rentalAgreements[msg.sender];
        if (agreement.isActive) revert RentalAlreadyActive();

        // Check balance
        if (balanceOf(msg.sender) < amount) revert ERC20InsufficientBalance(msg.sender, balanceOf(msg.sender), amount);

        // Calculate end time
        uint256 startTime = block.timestamp;
        uint256 calculatedEndTime = startTime + duration;

        // Transfer tokens to renter
        _transfer(msg.sender, renter, amount);

        // Create rental agreement
        agreement = RentalAgreement({
            renter: renter,
            originalOwner: msg.sender,
            amount: amount,
            startTime: startTime,
            endTime: calculatedEndTime,
            isActive: true
        });

        // Record rental start
        _recordOwnership(msg.sender, renter, amount, "rental_start");

        emit TokenRented(msg.sender, renter, amount, duration, calculatedEndTime);

        return calculatedEndTime;
    }

    /**
     * @notice Return rented tokens to original owner
     * @param renter Address that currently holds rented tokens
     */
    function returnRentedTokens(address renter)
        external
        whenNotPaused
    {
        RentalAgreement storage agreement = rentalAgreements[renter];
        if (!agreement.isActive) revert NoActiveRental();
        if (block.timestamp < agreement.endTime) revert RentalNotExpired();

        // Transfer tokens back to original owner
        _transfer(renter, agreement.originalOwner, agreement.amount);

        // Clear rental agreement
        agreement.isActive = false;

        // Record rental end
        _recordOwnership(renter, agreement.originalOwner, agreement.amount, "rental_end");

        emit TokenReturned(agreement.originalOwner, renter, agreement.amount);
    }

    /**
     * @notice Force return of rented tokens (admin function)
     * @param renter Address that currently holds rented tokens
     */
    function forceReturnRentedTokens(address renter)
        external
        onlyOwner
        whenNotPaused
    {
        RentalAgreement storage agreement = rentalAgreements[renter];
        if (!agreement.isActive) revert NoActiveRental();

        // Transfer tokens back to original owner
        _transfer(renter, agreement.originalOwner, agreement.amount);

        // Clear rental agreement
        agreement.isActive = false;

        // Record rental end
        _recordOwnership(renter, agreement.originalOwner, agreement.amount, "rental_end");

        emit TokenReturned(agreement.originalOwner, renter, agreement.amount);
    }

    // ============================================
    // OWNERSHIP HISTORY FUNCTIONS
    // ============================================

    /**
     * @notice Record ownership transfer in history
     * @param from Previous owner
     * @param to New owner
     * @param amount Amount transferred
     * @param transferType Type of transfer
     */
    function _recordOwnership(
        address from,
        address to,
        uint256 amount,
        string memory transferType
    ) internal {
        // Record for sender
        ownershipHistory[from].push(OwnershipRecord({
            owner: to,
            amount: amount,
            timestamp: block.timestamp,
            transferType: transferType,
            relatedAddress: to
        }));

        // Record for receiver
        ownershipHistory[to].push(OwnershipRecord({
            owner: from,
            amount: amount,
            timestamp: block.timestamp,
            transferType: transferType,
            relatedAddress: from
        }));
    }

    /**
     * @notice Get ownership history for address
     * @param account Address to query
     * @return Array of ownership records
     */
    function getOwnershipHistory(address account)
        external
        view
        returns (OwnershipRecord[] memory)
    {
        return ownershipHistory[account];
    }

    /**
     * @notice Get active rental agreement for address
     * @param account Address to query
     * @return Rental agreement details
     */
    function getActiveRental(address account)
        external
        view
        returns (RentalAgreement memory)
    {
        return rentalAgreements[account];
    }

    // ============================================
    // VESTING FUNCTIONS (from V3)
    // ============================================

    /**
     * @notice Create vesting schedule for beneficiary
     * @param beneficiary Address that will receive vested tokens
     * @param amount Total amount of tokens to vest
     * @param startTime Timestamp when vesting starts
     * @param duration Total vesting duration in seconds
     * @param cliffDuration Cliff duration in seconds before any release
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 startTime,
        uint256 duration,
        uint256 cliffDuration
    ) external onlyOwner {
        if (beneficiary == address(0)) revert InvalidAddress();
        if (vestingSchedules[beneficiary].totalAmount > 0) revert VestingAlreadyExists();

        // Transfer tokens to this contract for vesting
        _transfer(msg.sender, address(this), amount);

        // Create vesting schedule
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: startTime,
            duration: duration,
            cliffDuration: cliffDuration
        });

        emit VestingScheduleCreated(beneficiary, amount, startTime, duration, cliffDuration);
    }

    /**
     * @notice Release vested tokens to beneficiary
     */
    function releaseVestedTokens() external {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        if (schedule.totalAmount == 0) revert NoVestingSchedule();

        uint256 releasable = _computeReleasableAmount(schedule);
        if (releasable == 0) revert NoTokensToRelease();

        schedule.releasedAmount += releasable;
        _transfer(address(this), msg.sender, releasable);

        emit TokensReleased(msg.sender, releasable);
    }

    /**
     * @notice Compute amount of tokens that can be released
     * @param schedule Vesting schedule to calculate from
     * @return Amount of tokens releasable
     */
    function _computeReleasableAmount(VestingSchedule memory schedule)
        internal
        view
        returns (uint256)
    {
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        if (block.timestamp >= schedule.startTime + schedule.duration) {
            // All tokens vested
            return schedule.totalAmount - schedule.releasedAmount;
        }

        // Linear vesting
        uint256 timeFromStart = block.timestamp - schedule.startTime;
        uint256 vestedAmount = (schedule.totalAmount * timeFromStart) / schedule.duration;

        return vestedAmount - schedule.releasedAmount;
    }

    /**
     * @notice Get releasable amount for address
     * @param beneficiary Address to check
     * @return Amount of tokens currently releasable
     */
    function getReleasableAmount(address beneficiary) external view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        if (schedule.totalAmount == 0) return 0;
        return _computeReleasableAmount(schedule);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Update reward pool address
     * @param newRewardPool New reward pool address
     */
    function setRewardPool(address newRewardPool) external onlyOwner {
        if (newRewardPool == address(0)) revert InvalidAddress();
        address oldPool = rewardPool;
        rewardPool = newRewardPool;
        isFeeExempt[newRewardPool] = true;
        emit RewardPoolUpdated(oldPool, newRewardPool);
    }

    /**
     * @notice Update fee collector address
     * @param newFeeCollector New fee collector address
     */
    function setFeeCollector(address newFeeCollector) external onlyOwner {
        if (newFeeCollector == address(0)) revert InvalidAddress();
        address oldCollector = feeCollector;
        feeCollector = newFeeCollector;
        isFeeExempt[newFeeCollector] = true;
        emit FeeCollectorUpdated(oldCollector, newFeeCollector);
    }

    /**
     * @notice Update transfer fee percentage
     * @param newFeePercent New fee percentage (in basis points)
     */
    function setTransferFee(uint256 newFeePercent) external onlyOwner {
        if (newFeePercent > MAX_FEE_PERCENT) revert FeeTooHigh();
        uint256 oldFee = transferFeePercent;
        transferFeePercent = newFeePercent;
        emit TransferFeeUpdated(oldFee, newFeePercent);
    }

    /**
     * @notice Set fee exemption status for address
     * @param account Address to update
     * @param exempt Whether address should be exempt from fees
     */
    function setFeeExempt(address account, bool exempt) external onlyOwner {
        isFeeExempt[account] = exempt;
        emit FeeExemptionUpdated(account, exempt);
    }

    /**
     * @notice Pause all transfers
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause all transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get vesting schedule for address
     * @param beneficiary Address to check
     * @return Vesting schedule details
     */
    function getVestingSchedule(address beneficiary)
        external
        view
        returns (VestingSchedule memory)
    {
        return vestingSchedules[beneficiary];
    }

    /**
     * @notice Calculate fee for transfer amount
     * @param amount Transfer amount
     * @return Fee amount
     */
    function calculateFee(uint256 amount) external view returns (uint256) {
        return (amount * transferFeePercent) / FEE_DENOMINATOR;
    }
}
