// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

/**
 * @title KIK Token
 * @dev ERC20 Token with minting and pause capabilities
 * - Initial Supply: 10,000,000,000 KIK
 * - Minting: Only owner can mint new tokens
 * - Pausable: Owner can pause/unpause transfers for security
 * - No burning capability
 */
contract KIKToken is ERC20, Ownable, ERC20Pausable {
    
    uint256 public constant INITIAL_SUPPLY = 10_000_000_000 * 10**18; // 10 billion tokens
    
    // Fee for pausing (in wei) - optional feature
    uint256 public pauseFee = 0.01 ether;
    
    event TokensMinted(address indexed to, uint256 amount);
    event PauseFeeUpdated(uint256 newFee);
    event PauseFeeCollected(address indexed payer, uint256 amount);
    
    /**
     * @dev Constructor that mints initial supply to contract deployer
     */
    constructor() ERC20("KIK Token", "KIK") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Mint new tokens - only owner can call
     * @param to Address to receive minted tokens
     * @param amount Amount of tokens to mint (in wei, 18 decimals)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Pause all token transfers - requires fee payment
     * Anyone can pause if they pay the fee, but only owner can pause for free
     */
    function pause() public payable {
        if (msg.sender != owner()) {
            require(msg.value >= pauseFee, "Insufficient pause fee");
            emit PauseFeeCollected(msg.sender, msg.value);
        }
        _pause();
    }
    
    /**
     * @dev Unpause token transfers - only owner
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Update the pause fee - only owner
     * @param newFee New fee amount in wei
     */
    function setPauseFee(uint256 newFee) public onlyOwner {
        pauseFee = newFee;
        emit PauseFeeUpdated(newFee);
    }
    
    /**
     * @dev Withdraw collected pause fees - only owner
     */
    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, amount);
    }
}
