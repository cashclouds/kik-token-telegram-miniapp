// Contract Addresses Configuration
// Network: Polygon Amoy Testnet (Chain ID: 80002)
// Updated: 2025-12-09

export const CONTRACT_ADDRESSES = {
  // Token Contract
  KIKTokenV3: '0x6B03Ff41cE23dE82241792a19E3464A304e12F97',
  KIKTokenV2: '0x6DF8b5e993C54a5b51FCCd84C4C1DeEFf50cB618', // Legacy

  // Anonymous Pool System (Phase 1)
  MerkleTreeManager: '0xB6568A2D938FE84f88D788EEe3eEd66F41e811eF',
  AnonymousPool: '0xcE0b4263c09dc3110022fc953F65E9B3f3d6DeA7',

  // Collectibles System (Phase 2) - Pending Deployment
  CollectiblesNFT: '0x0000000000000000000000000000000000000000', // To be deployed
  Marketplace: '0x0000000000000000000000000000000000000000', // To be deployed
  ReferralSystem: '0x0000000000000000000000000000000000000000', // To be deployed
  RewardDistributor: '0x0000000000000000000000000000000000000000', // To be deployed
};

export const NETWORK_CONFIG = {
  chainId: 80002,
  name: 'Polygon Amoy Testnet',
  rpcUrl: 'https://rpc-amoy.polygon.technology/',
  blockExplorerUrl: 'https://amoy.polygonscan.com/',
};

export const DEPLOYER = '0x4e4A854E6D28aa7aB5b5178eFBb0F4ceA22d3141';

export const getContractUrl = (contractName: keyof typeof CONTRACT_ADDRESSES): string => {
  const address = CONTRACT_ADDRESSES[contractName];
  return `${NETWORK_CONFIG.blockExplorerUrl}address/${address}`;
};

export const isDeployed = (contractName: keyof typeof CONTRACT_ADDRESSES): boolean => {
  const address = CONTRACT_ADDRESSES[contractName];
  return address !== '0x0000000000000000000000000000000000000000';
};
