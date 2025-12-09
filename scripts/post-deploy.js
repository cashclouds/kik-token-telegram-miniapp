#!/usr/bin/env node

/**
 * Post-Deployment Configuration Script
 * Run this after npm run deploy:amoy to update all contract addresses
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const deploymentFile = args[0] || 'deployments/amoy-deployment.json';

if (!fs.existsSync(deploymentFile)) {
  console.error(`❌ Deployment file not found: ${deploymentFile}`);
  console.log('Usage: node scripts/post-deploy.js [path-to-deployment-json]');
  process.exit(1);
}

// Read deployment results
const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

console.log('📋 Post-Deployment Configuration Script');
console.log('=====================================\n');

// Extract addresses
const addresses = {
  KIKTokenV3: deployment.contracts?.kikTokenV3?.address,
  CollectiblesNFT: deployment.contracts?.collectiblesNFT?.address,
  Marketplace: deployment.contracts?.marketplace?.address,
  ReferralSystem: deployment.contracts?.referralSystem?.address,
  RewardDistributor: deployment.contracts?.rewardDistributor?.address,
};

console.log('📝 Contract Addresses from Deployment:');
Object.entries(addresses).forEach(([name, addr]) => {
  console.log(`  ${name}: ${addr}`);
});
console.log();

// Update wallet-app/lib/contracts.ts
const contractsConfigPath = path.join(__dirname, '../wallet-app/lib/contracts.ts');
const contractsConfigContent = `// Contract Addresses Configuration
// Network: Polygon Amoy Testnet (Chain ID: 80002)
// Updated: ${new Date().toISOString().split('T')[0]}

export const CONTRACT_ADDRESSES = {
  // Token Contract
  KIKTokenV3: '${addresses.KIKTokenV3}',

  // Anonymous Pool System (Phase 1)
  MerkleTreeManager: '0xB6568A2D938FE84f88D788EEe3eEd66F41e811eF',
  AnonymousPool: '0xcE0b4263c09dc3110022fc953F65E9B3f3d6DeA7',

  // Collectibles System (Phase 2)
  CollectiblesNFT: '${addresses.CollectiblesNFT}',
  Marketplace: '${addresses.Marketplace}',
  ReferralSystem: '${addresses.ReferralSystem}',
  RewardDistributor: '${addresses.RewardDistributor}',
};

export const NETWORK_CONFIG = {
  chainId: 80002,
  name: 'Polygon Amoy Testnet',
  rpcUrl: 'https://rpc-amoy.polygon.technology/',
  blockExplorerUrl: 'https://amoy.polygonscan.com/',
};

export const DEPLOYER = '${deployment.deployer}';

export const getContractUrl = (contractName: keyof typeof CONTRACT_ADDRESSES): string => {
  const address = CONTRACT_ADDRESSES[contractName];
  return \`\${NETWORK_CONFIG.blockExplorerUrl}address/\${address}\`;
};

export const isDeployed = (contractName: keyof typeof CONTRACT_ADDRESSES): boolean => {
  const address = CONTRACT_ADDRESSES[contractName];
  return address !== '0x0000000000000000000000000000000000000000';
};
`;

try {
  fs.writeFileSync(contractsConfigPath, contractsConfigContent);
  console.log(`✅ Updated: wallet-app/lib/contracts.ts`);
} catch (error) {
  console.error(`❌ Failed to update wallet-app/lib/contracts.ts:`, error.message);
}

// Update telegram-bot/.env
const botEnvPath = path.join(__dirname, '../telegram-bot/.env');
try {
  let envContent = fs.readFileSync(botEnvPath, 'utf8');
  
  // Update contract addresses
  envContent = envContent.replace(
    /COLLECTIBLES_NFT_ADDRESS=.*/,
    `COLLECTIBLES_NFT_ADDRESS=${addresses.CollectiblesNFT}`
  );
  envContent = envContent.replace(
    /MARKETPLACE_ADDRESS=.*/,
    `MARKETPLACE_ADDRESS=${addresses.Marketplace}`
  );
  envContent = envContent.replace(
    /REFERRAL_SYSTEM_ADDRESS=.*/,
    `REFERRAL_SYSTEM_ADDRESS=${addresses.ReferralSystem}`
  );
  envContent = envContent.replace(
    /REWARD_DISTRIBUTOR_ADDRESS=.*/,
    `REWARD_DISTRIBUTOR_ADDRESS=${addresses.RewardDistributor}`
  );

  fs.writeFileSync(botEnvPath, envContent);
  console.log(`✅ Updated: telegram-bot/.env`);
} catch (error) {
  console.error(`❌ Failed to update telegram-bot/.env:`, error.message);
}

// Update telegram-bot/src/services/contractIntegration.js
const contractIntegrationPath = path.join(__dirname, '../telegram-bot/src/services/contractIntegration.js');
try {
  let integrationContent = fs.readFileSync(contractIntegrationPath, 'utf8');
  
  // Update CONTRACT_ADDRESSES
  integrationContent = integrationContent.replace(
    /CollectiblesNFT: process\.env\.COLLECTIBLES_NFT_ADDRESS \|\| '[^']*'/,
    `CollectiblesNFT: process.env.COLLECTIBLES_NFT_ADDRESS || '${addresses.CollectiblesNFT}'`
  );
  integrationContent = integrationContent.replace(
    /Marketplace: process\.env\.MARKETPLACE_ADDRESS \|\| '[^']*'/,
    `Marketplace: process.env.MARKETPLACE_ADDRESS || '${addresses.Marketplace}'`
  );
  integrationContent = integrationContent.replace(
    /ReferralSystem: process\.env\.REFERRAL_SYSTEM_ADDRESS \|\| '[^']*'/,
    `ReferralSystem: process.env.REFERRAL_SYSTEM_ADDRESS || '${addresses.ReferralSystem}'`
  );
  integrationContent = integrationContent.replace(
    /RewardDistributor: process\.env\.REWARD_DISTRIBUTOR_ADDRESS \|\| '[^']*'/,
    `RewardDistributor: process.env.REWARD_DISTRIBUTOR_ADDRESS || '${addresses.RewardDistributor}'`
  );

  fs.writeFileSync(contractIntegrationPath, integrationContent);
  console.log(`✅ Updated: telegram-bot/src/services/contractIntegration.js`);
} catch (error) {
  console.error(`❌ Failed to update contractIntegration.js:`, error.message);
}

// Create summary file
const summaryPath = path.join(__dirname, '../DEPLOYMENT_SUMMARY.md');
const summaryContent = `# Deployment Summary
**Date**: ${new Date().toISOString()}
**Network**: Polygon Amoy Testnet
**Deployer**: ${deployment.deployer}

## Deployed Contracts

| Contract | Address |
|----------|---------|
| KIKTokenV3 | ${addresses.KIKTokenV3} |
| CollectiblesNFT | ${addresses.CollectiblesNFT} |
| Marketplace | ${addresses.Marketplace} |
| ReferralSystem | ${addresses.ReferralSystem} |
| RewardDistributor | ${addresses.RewardDistributor} |

## Block Explorer Links

- [KIKTokenV3](https://amoy.polygonscan.com/address/${addresses.KIKTokenV3})
- [CollectiblesNFT](https://amoy.polygonscan.com/address/${addresses.CollectiblesNFT})
- [Marketplace](https://amoy.polygonscan.com/address/${addresses.Marketplace})
- [ReferralSystem](https://amoy.polygonscan.com/address/${addresses.ReferralSystem})
- [RewardDistributor](https://amoy.polygonscan.com/address/${addresses.RewardDistributor})

## Next Steps

1. ✅ Contracts deployed
2. ✅ Configuration files updated
3. 📋 Test token transfers:
   \`\`\`bash
   npx hardhat run scripts/check-balance.js --network amoy
   \`\`\`
4. 🚀 Deploy Telegram bot
5. 🌐 Deploy wallet app
`;

try {
  fs.writeFileSync(summaryPath, summaryContent);
  console.log(`✅ Created: DEPLOYMENT_SUMMARY.md`);
} catch (error) {
  console.error(`❌ Failed to create DEPLOYMENT_SUMMARY.md:`, error.message);
}

console.log('\n✨ Post-deployment configuration complete!');
console.log('\nReminder to update:');
console.log('  - [ ] Telegram Bot Token via @BotFather');
console.log('  - [ ] Backend private key in telegram-bot/.env');
console.log('  - [ ] API keys for AI image generation');
console.log('  - [ ] IPFS/Pinata credentials');
console.log('  - [ ] Ad network tokens (if enabled)');
