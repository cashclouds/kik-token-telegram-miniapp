const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting KIK Collectibles LITE Deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "MATIC\n");

  // Use existing KIKTokenV3 address
  const kikTokenAddress = "0x6B03Ff41cE23dE82241792a19E3464A304e12F97";
  console.log("✅ Using existing KIKTokenV3:", kikTokenAddress);

  const rewardPoolAddress = deployer.address; // Temporary

  // ============================================
  // STEP 1: Deploy CollectiblesNFT
  // ============================================
  console.log("\n📦 Step 1/4: Deploying CollectiblesNFT...");

  const CollectiblesNFT = await hre.ethers.getContractFactory("CollectiblesNFT");
  const collectiblesNFT = await CollectiblesNFT.deploy(kikTokenAddress, rewardPoolAddress);
  await collectiblesNFT.waitForDeployment();
  const collectiblesNFTAddress = await collectiblesNFT.getAddress();

  console.log("✅ CollectiblesNFT deployed to:", collectiblesNFTAddress);

  // ============================================
  // STEP 2: Deploy Marketplace
  // ============================================
  console.log("\n📦 Step 2/4: Deploying Marketplace...");

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
  // STEP 3: Deploy ReferralSystem
  // ============================================
  console.log("\n📦 Step 3/4: Deploying ReferralSystem...");

  const ReferralSystem = await hre.ethers.getContractFactory("ReferralSystem");
  const referralSystem = await ReferralSystem.deploy(kikTokenAddress, rewardPoolAddress);
  await referralSystem.waitForDeployment();
  const referralSystemAddress = await referralSystem.getAddress();

  console.log("✅ ReferralSystem deployed to:", referralSystemAddress);

  // ============================================
  // STEP 4: Deploy RewardDistributor
  // ============================================
  console.log("\n📦 Step 4/4: Deploying RewardDistributor...");

  const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
  const rewardDistributor = await RewardDistributor.deploy(
    kikTokenAddress,
    referralSystemAddress,
    rewardPoolAddress,
    deployer.address // backend signer
  );
  await rewardDistributor.waitForDeployment();
  const rewardDistributorAddress = await rewardDistributor.getAddress();

  console.log("✅ RewardDistributor deployed to:", rewardDistributorAddress);

  // ============================================
  // STEP 5: Save Deployment Info
  // ============================================
  console.log("\n💾 Saving deployment info...");

  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  const deploymentInfo = {
    network: network.name,
    chainId: chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      kikTokenV3: {
        address: kikTokenAddress,
        note: "Pre-deployed"
      },
      collectiblesNFT: {
        address: collectiblesNFTAddress,
      },
      marketplace: {
        address: marketplaceAddress,
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
    `${network.name}-collectibles-lite.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("✅ Deployment info saved to:", deploymentFile);

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n📊 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);
  console.log("\nContracts:");
  console.log("  KIKTokenV3:         ", kikTokenAddress, "(existing)");
  console.log("  CollectiblesNFT:    ", collectiblesNFTAddress);
  console.log("  Marketplace:        ", marketplaceAddress);
  console.log("  ReferralSystem:     ", referralSystemAddress);
  console.log("  RewardDistributor:  ", rewardDistributorAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (chainId === 80002) {
    console.log("\n🔗 View on Amoy Polygonscan:");
    console.log("  KIKTokenV3:        ", `https://amoy.polygonscan.com/address/${kikTokenAddress}`);
    console.log("  CollectiblesNFT:   ", `https://amoy.polygonscan.com/address/${collectiblesNFTAddress}`);
    console.log("  Marketplace:       ", `https://amoy.polygonscan.com/address/${marketplaceAddress}`);
    console.log("  ReferralSystem:    ", `https://amoy.polygonscan.com/address/${referralSystemAddress}`);
    console.log("  RewardDistributor: ", `https://amoy.polygonscan.com/address/${rewardDistributorAddress}`);
  }

  console.log("\n✨ Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
