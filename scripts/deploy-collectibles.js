const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting KIK Collectibles Deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no MATIC! Please fund the account.");
  }

  // ============================================
  // STEP 1: Deploy KIKTokenV3
  // ============================================
  console.log("📦 Step 1/5: Deploying KIKTokenV3...");

  const feeCollector = deployer.address;
  const rewardPoolAddress = deployer.address; // Temporary, will update later

  const KIKTokenV3 = await hre.ethers.getContractFactory("KIKTokenV3");
  const kikToken = await KIKTokenV3.deploy(feeCollector, rewardPoolAddress);
  await kikToken.waitForDeployment();
  const kikTokenAddress = await kikToken.getAddress();

  console.log("✅ KIKTokenV3 deployed to:", kikTokenAddress);

  // ============================================
  // STEP 2: Deploy CollectiblesNFT
  // ============================================
  console.log("\n📦 Step 2/5: Deploying CollectiblesNFT...");

  const CollectiblesNFT = await hre.ethers.getContractFactory("CollectiblesNFT");
  const collectiblesNFT = await CollectiblesNFT.deploy(kikTokenAddress, rewardPoolAddress);
  await collectiblesNFT.waitForDeployment();
  const collectiblesNFTAddress = await collectiblesNFT.getAddress();

  console.log("✅ CollectiblesNFT deployed to:", collectiblesNFTAddress);

  // ============================================
  // STEP 3: Deploy Marketplace
  // ============================================
  console.log("\n📦 Step 3/5: Deploying Marketplace...");

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(
    kikTokenAddress,
    collectiblesNFTAddress,
    deployer.address, // treasury
    rewardPoolAddress
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();

  console.log("✅ Marketplace deployed to:", marketplaceAddress);

  // ============================================
  // STEP 4: Deploy ReferralSystem
  // ============================================
  console.log("\n📦 Step 4/5: Deploying ReferralSystem...");

  const ReferralSystem = await hre.ethers.getContractFactory("ReferralSystem");
  const referralSystem = await ReferralSystem.deploy(kikTokenAddress, rewardPoolAddress);
  await referralSystem.waitForDeployment();
  const referralSystemAddress = await referralSystem.getAddress();

  console.log("✅ ReferralSystem deployed to:", referralSystemAddress);

  // ============================================
  // STEP 5: Deploy RewardDistributor
  // ============================================
  console.log("\n📦 Step 5/5: Deploying RewardDistributor...");

  const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
  const rewardDistributor = await RewardDistributor.deploy(
    kikTokenAddress,
    referralSystemAddress,
    rewardPoolAddress,
    deployer.address // backend signer (temporary)
  );
  await rewardDistributor.waitForDeployment();
  const rewardDistributorAddress = await rewardDistributor.getAddress();

  console.log("✅ RewardDistributor deployed to:", rewardDistributorAddress);

  // ============================================
  // STEP 6: Verify Deployment
  // ============================================
  console.log("\n🔍 Verifying deployment...");

  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  // Verify KIKTokenV3
  const tokenName = await kikToken.name();
  const tokenSymbol = await kikToken.symbol();
  const totalSupply = await kikToken.totalSupply();

  console.log("\nKIKTokenV3 Status:");
  console.log("  Name:", tokenName);
  console.log("  Symbol:", tokenSymbol);
  console.log("  Total Supply:", hre.ethers.formatEther(totalSupply), "KIK");
  console.log("  Fee Collector:", await kikToken.feeCollector());
  console.log("  Reward Pool:", await kikToken.rewardPool());

  // Verify CollectiblesNFT
  const nftName = await collectiblesNFT.name();
  const nftSymbol = await collectiblesNFT.symbol();
  const totalNFTs = await collectiblesNFT.totalSupply();

  console.log("\nCollectiblesNFT Status:");
  console.log("  Name:", nftName);
  console.log("  Symbol:", nftSymbol);
  console.log("  Total Minted:", totalNFTs.toString());
  console.log("  Daily Limit:", await collectiblesNFT.dailyCreationLimit());

  // Verify Marketplace
  const marketplaceFee = await marketplace.marketplaceFee();
  const treasury = await marketplace.treasury();

  console.log("\nMarketplace Status:");
  console.log("  Fee:", (Number(marketplaceFee) / 100).toFixed(2) + "%");
  console.log("  Treasury:", treasury);
  console.log("  Reward Pool:", await marketplace.rewardPool());

  // Verify ReferralSystem
  const minClaim = await referralSystem.minClaimAmount();

  console.log("\nReferralSystem Status:");
  console.log("  Min Claim:", hre.ethers.formatEther(minClaim), "KIK");
  console.log("  Total Rewards:", hre.ethers.formatEther(await referralSystem.totalReferralRewards()));

  // Verify RewardDistributor
  const dailyLimit = await rewardDistributor.dailyClaimLimit();
  const monthlyLimit = await rewardDistributor.monthlyClaimLimit();

  console.log("\nRewardDistributor Status:");
  console.log("  Daily Limit:", hre.ethers.formatEther(dailyLimit), "KIK");
  console.log("  Monthly Limit:", hre.ethers.formatEther(monthlyLimit), "KIK");
  console.log("  Backend Signer:", await rewardDistributor.backendSigner());

  // ============================================
  // STEP 7: Save Deployment Info
  // ============================================
  console.log("\n💾 Saving deployment info...");

  const deploymentInfo = {
    network: network.name,
    chainId: chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      kikTokenV3: {
        address: kikTokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        totalSupply: totalSupply.toString(),
      },
      collectiblesNFT: {
        address: collectiblesNFTAddress,
        name: nftName,
        symbol: nftSymbol,
      },
      marketplace: {
        address: marketplaceAddress,
        fee: marketplaceFee.toString(),
      },
      referralSystem: {
        address: referralSystemAddress,
      },
      rewardDistributor: {
        address: rewardDistributorAddress,
      },
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `${network.name}-collectibles-deployment.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("✅ Deployment info saved to:", deploymentFile);

  // ============================================
  // STEP 8: Summary
  // ============================================
  console.log("\n📊 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);
  console.log("Deployer:", deployer.address);
  console.log("\nContracts:");
  console.log("  KIKTokenV3:         ", kikTokenAddress);
  console.log("  CollectiblesNFT:    ", collectiblesNFTAddress);
  console.log("  Marketplace:        ", marketplaceAddress);
  console.log("  ReferralSystem:     ", referralSystemAddress);
  console.log("  RewardDistributor:  ", rewardDistributorAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Polygonscan links
  if (chainId === 80002) {
    console.log("\n🔗 View on Amoy Polygonscan:");
    console.log("  KIKTokenV3:        ", `https://amoy.polygonscan.com/address/${kikTokenAddress}`);
    console.log("  CollectiblesNFT:   ", `https://amoy.polygonscan.com/address/${collectiblesNFTAddress}`);
    console.log("  Marketplace:       ", `https://amoy.polygonscan.com/address/${marketplaceAddress}`);
    console.log("  ReferralSystem:    ", `https://amoy.polygonscan.com/address/${referralSystemAddress}`);
    console.log("  RewardDistributor: ", `https://amoy.polygonscan.com/address/${rewardDistributorAddress}`);
  } else if (chainId === 137) {
    console.log("\n🔗 View on Polygon Polygonscan:");
    console.log("  KIKTokenV3:        ", `https://polygonscan.com/address/${kikTokenAddress}`);
    console.log("  CollectiblesNFT:   ", `https://polygonscan.com/address/${collectiblesNFTAddress}`);
    console.log("  Marketplace:       ", `https://polygonscan.com/address/${marketplaceAddress}`);
    console.log("  ReferralSystem:    ", `https://polygonscan.com/address/${referralSystemAddress}`);
    console.log("  RewardDistributor: ", `https://polygonscan.com/address/${rewardDistributorAddress}`);
  }

  console.log("\n✨ Deployment complete!\n");
  console.log("📝 Next steps:");
  console.log("  1. Allocate tokens to reward pool");
  console.log("  2. Setup Telegram bot backend");
  console.log("  3. Configure backend signer for RewardDistributor");
  console.log("  4. Test NFT creation and marketplace");
  console.log("  5. Launch to users!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
