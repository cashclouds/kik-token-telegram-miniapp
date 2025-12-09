/**
 * Smart Contract Integration for KIK Telegram Bot
 * Handles interaction with deployed smart contracts on Polygon Amoy Testnet
 */

const { ethers } = require('ethers');
const dotenv = require('dotenv');

dotenv.config();

// Contract Addresses
const CONTRACT_ADDRESSES = {
  KIKTokenV3: process.env.KIK_TOKEN_V3_ADDRESS || '0x6B03Ff41cE23dE82241792a19E3464A304e12F97',
  CollectiblesNFT: process.env.COLLECTIBLES_NFT_ADDRESS || '0x0000000000000000000000000000000000000000',
  Marketplace: process.env.MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000000',
  ReferralSystem: process.env.REFERRAL_SYSTEM_ADDRESS || '0x0000000000000000000000000000000000000000',
  RewardDistributor: process.env.REWARD_DISTRIBUTOR_ADDRESS || '0x0000000000000000000000000000000000000000',
};

// Network Configuration
const NETWORK_CONFIG = {
  chainId: 80002,
  name: 'Polygon Amoy Testnet',
  rpcUrl: process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology/',
};

// Minimal ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address owner) public view returns (uint256)',
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) public returns (bool)',
  'function name() public view returns (string)',
  'function symbol() public view returns (string)',
  'function decimals() public view returns (uint8)',
  'function totalSupply() public view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// NFT ABI (ERC721 + Custom)
const NFT_ABI = [
  'function balanceOf(address owner) public view returns (uint256)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)',
  'function name() public view returns (string)',
  'function symbol() public view returns (string)',
  'function totalSupply() public view returns (uint256)',
  'function createNFT(string memory metadata) public returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

// ReferralSystem ABI
const REFERRAL_ABI = [
  'function registerUser(address userAddress, address referrerAddress) public',
  'function getReferralInfo(address userAddress) public view returns (tuple(address referrer, uint256 level, uint256 referralCount))',
  'function claimReferralRewards(address userAddress) public returns (uint256)',
  'event UserRegistered(address indexed user, address indexed referrer)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
];

class ContractIntegration {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
    this.contracts = {};
    this.signer = null;
  }

  /**
   * Initialize signer with backend private key
   */
  initializeSigner() {
    const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY;
    if (!backendPrivateKey) {
      console.warn('⚠️  BACKEND_PRIVATE_KEY not set. Contract write operations will be disabled.');
      return false;
    }

    try {
      this.signer = new ethers.Wallet(backendPrivateKey, this.provider);
      console.log('✅ Backend signer initialized:', this.signer.address);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize signer:', error.message);
      return false;
    }
  }

  /**
   * Get KIK Token contract instance
   */
  getKIKToken() {
    if (!this.contracts.kikToken) {
      this.contracts.kikToken = new ethers.Contract(
        CONTRACT_ADDRESSES.KIKTokenV3,
        ERC20_ABI,
        this.provider
      );
    }
    return this.contracts.kikToken;
  }

  /**
   * Get CollectiblesNFT contract instance
   */
  getCollectiblesNFT() {
    if (!this.contracts.collectiblesNFT) {
      this.contracts.collectiblesNFT = new ethers.Contract(
        CONTRACT_ADDRESSES.CollectiblesNFT,
        NFT_ABI,
        this.provider
      );
    }
    return this.contracts.collectiblesNFT;
  }

  /**
   * Get ReferralSystem contract instance
   */
  getReferralSystem() {
    if (!this.contracts.referralSystem) {
      this.contracts.referralSystem = new ethers.Contract(
        CONTRACT_ADDRESSES.ReferralSystem,
        REFERRAL_ABI,
        this.provider
      );
    }
    return this.contracts.referralSystem;
  }

  /**
   * Check KIK Token balance for user
   */
  async getTokenBalance(address) {
    try {
      const contract = this.getKIKToken();
      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  }

  /**
   * Check if contract is deployed
   */
  async isContractDeployed(contractAddress) {
    try {
      const code = await this.provider.getCode(contractAddress);
      return code !== '0x';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get status of all contracts
   */
  async getContractStatus() {
    const status = {};
    
    for (const [name, address] of Object.entries(CONTRACT_ADDRESSES)) {
      const deployed = await this.isContractDeployed(address);
      status[name] = {
        address,
        deployed,
        explorerUrl: `https://amoy.polygonscan.com/address/${address}`,
      };
    }

    return status;
  }

  /**
   * Transfer KIK tokens from backend to user
   * Requires backend signer to be initialized
   */
  async transferTokenToUser(userAddress, amount) {
    if (!this.signer) {
      throw new Error('Backend signer not initialized. Cannot perform token transfer.');
    }

    try {
      const contract = this.getKIKToken().connect(this.signer);
      const decimals = await contract.decimals();
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);

      const tx = await contract.transfer(userAddress, amountInWei);
      const receipt = await tx.wait();

      console.log(`✅ Transferred ${amount} KIK to ${userAddress}`);
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Error transferring tokens:', error);
      throw error;
    }
  }

  /**
   * Register user in referral system
   */
  async registerUserInReferralSystem(userAddress, referrerAddress = null) {
    if (!this.signer) {
      throw new Error('Backend signer not initialized.');
    }

    if (!CONTRACT_ADDRESSES.ReferralSystem || 
        CONTRACT_ADDRESSES.ReferralSystem === '0x0000000000000000000000000000000000000000') {
      throw new Error('ReferralSystem contract not deployed yet.');
    }

    try {
      const contract = this.getReferralSystem().connect(this.signer);
      const tx = await contract.registerUser(userAddress, referrerAddress || ethers.ZeroAddress);
      const receipt = await tx.wait();

      console.log(`✅ Registered ${userAddress} in referral system`);
      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }
}

// Singleton instance
let instance = null;

function getContractIntegration() {
  if (!instance) {
    instance = new ContractIntegration();
    instance.initializeSigner();
  }
  return instance;
}

module.exports = {
  ContractIntegration,
  getContractIntegration,
  CONTRACT_ADDRESSES,
  NETWORK_CONFIG,
};
