const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Remaining Contracts Deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no MATIC! Please fund the account.");
  }

  // Load existing deployments
  const deploymentPath = path.join(__dirname, "../deployments/amoy-deployment.json");
  let deployment = {};
  
  if (fs.existsSync(deploymentPath)) {
    const data = fs.readFileSync(deploymentPath, "utf8");
    deployment = JSON.parse(data);
    console.log("📖 Loaded existing deployment data\n");
  }

  // Use existing KIKTokenV3 address
  const kikTokenAddress = deployment.KIKTokenV3 || "0x1Dab8E237D2Be84AB02127282B42d4009Bf81cC0";
  const rewardPoolAddress = deployer.address;
  const treasuryAddress = deployer.address;

  console.log("🔗 Using KIKTokenV3 at:", kikTokenAddress);
  console.log("");

  // ============================================
  // STEP 1: Deploy CollectiblesNFT
  // ============================================
  console.log("📦 Step 1/4: Deploying CollectiblesNFT...");

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
    treasuryAddress,
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
    deployer.address
  );
  await rewardDistributor.waitForDeployment();
  const rewardDistributorAddress = await rewardDistributor.getAddress();

  console.log("✅ RewardDistributor deployed to:", rewardDistributorAddress);

  // ============================================
  // SAVE DEPLOYMENT DATA
  // ============================================
  console.log("\n💾 Saving deployment data...");

  const finalDeployment = {
    ...deployment,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    network: "amoy",
    chainId: 80002,
    
    // Existing contracts
    KIKTokenV3: deployment.KIKTokenV3 || kikTokenAddress,
    
    // New contracts
    CollectiblesNFT: collectiblesNFTAddress,
    Marketplace: marketplaceAddress,
    ReferralSystem: referralSystemAddress,
    RewardDistributor: rewardDistributorAddress,
    
    // Config
    RewardPool: rewardPoolAddress,
    Treasury: treasuryAddress
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(finalDeployment, null, 2)
  );

  console.log("✅ Deployment data saved to deployments/amoy-deployment.json");

  // ============================================
  // PRINT SUMMARY
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📋 Deployed Contracts:");
  console.log(`  • KIKTokenV3:       ${deployment.KIKTokenV3 || kikTokenAddress}`);
  console.log(`  • CollectiblesNFT:  ${collectiblesNFTAddress}`);
  console.log(`  • Marketplace:      ${marketplaceAddress}`);
  console.log(`  • ReferralSystem:   ${referralSystemAddress}`);
  console.log(`  • RewardDistributor: ${rewardDistributorAddress}`);
  console.log("\n🔗 Network: Polygon Amoy Testnet");
  console.log("📊 ChainId: 80002");
  console.log("👤 Deployer:", deployer.address);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
