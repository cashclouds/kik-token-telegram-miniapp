const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function deployOneByOne() {
  console.log("🚀 Deploying contracts ONE BY ONE...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  let balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "MATIC\n");

  const deployment = {};
  const rewardPool = deployer.address;
  const treasury = deployer.address;

  // Load existing deployment
  const deploymentPath = path.join(__dirname, "../deployments/amoy-deployment.json");
  if (fs.existsSync(deploymentPath)) {
    const data = fs.readFileSync(deploymentPath, "utf8");
    Object.assign(deployment, JSON.parse(data));
  }

  const kikTokenAddress = deployment.KIKTokenV3 || "0x1Dab8E237D2Be84AB02127282B42d4009Bf81cC0";
  console.log("🔗 Using KIKTokenV3:", kikTokenAddress, "\n");

  // Contract 1: CollectiblesNFT
  console.log("📦 [1/4] Deploying CollectiblesNFT...");
  try {
    const CollectiblesNFT = await hre.ethers.getContractFactory("CollectiblesNFT");
    const collectiblesNFT = await CollectiblesNFT.deploy(kikTokenAddress, rewardPool);
    await collectiblesNFT.deploymentTransaction().wait(2);
    const collectiblesNFTAddress = await collectiblesNFT.getAddress();
    deployment.CollectiblesNFT = collectiblesNFTAddress;
    console.log("✅ CollectiblesNFT:", collectiblesNFTAddress);
    
    balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Remaining:", hre.ethers.formatEther(balance), "MATIC\n");
  } catch (err) {
    console.error("❌ CollectiblesNFT failed:", err.message);
    process.exit(1);
  }

  // Contract 2: Marketplace
  console.log("📦 [2/4] Deploying Marketplace...");
  try {
    const Marketplace = await hre.ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(
      kikTokenAddress,
      deployment.CollectiblesNFT,
      treasury,
      rewardPool
    );
    await marketplace.deploymentTransaction().wait(2);
    const marketplaceAddress = await marketplace.getAddress();
    deployment.Marketplace = marketplaceAddress;
    console.log("✅ Marketplace:", marketplaceAddress);
    
    balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Remaining:", hre.ethers.formatEther(balance), "MATIC\n");
  } catch (err) {
    console.error("❌ Marketplace failed:", err.message);
    process.exit(1);
  }

  // Contract 3: ReferralSystem
  console.log("📦 [3/4] Deploying ReferralSystem...");
  try {
    const ReferralSystem = await hre.ethers.getContractFactory("ReferralSystem");
    const referralSystem = await ReferralSystem.deploy(kikTokenAddress, rewardPool);
    await referralSystem.deploymentTransaction().wait(2);
    const referralSystemAddress = await referralSystem.getAddress();
    deployment.ReferralSystem = referralSystemAddress;
    console.log("✅ ReferralSystem:", referralSystemAddress);
    
    balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Remaining:", hre.ethers.formatEther(balance), "MATIC\n");
  } catch (err) {
    console.error("❌ ReferralSystem failed:", err.message);
    process.exit(1);
  }

  // Contract 4: RewardDistributor
  console.log("📦 [4/4] Deploying RewardDistributor...");
  try {
    const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
    const rewardDistributor = await RewardDistributor.deploy(
      kikTokenAddress,
      deployment.ReferralSystem,
      rewardPool,
      deployer.address
    );
    await rewardDistributor.deploymentTransaction().wait(2);
    const rewardDistributorAddress = await rewardDistributor.getAddress();
    deployment.RewardDistributor = rewardDistributorAddress;
    console.log("✅ RewardDistributor:", rewardDistributorAddress);
    
    balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Remaining:", hre.ethers.formatEther(balance), "MATIC\n");
  } catch (err) {
    console.error("❌ RewardDistributor failed:", err.message);
    process.exit(1);
  }

  // Save deployment
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const finalDeployment = {
    ...deployment,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    network: "amoy",
    chainId: 80002
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(finalDeployment, null, 2));

  // Print summary
  console.log("=".repeat(70));
  console.log("✅ ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
  console.log("=".repeat(70));
  console.log("\n📋 Deployed Addresses:");
  console.log(`  KIKTokenV3:       ${deployment.KIKTokenV3}`);
  console.log(`  CollectiblesNFT:  ${deployment.CollectiblesNFT}`);
  console.log(`  Marketplace:      ${deployment.Marketplace}`);
  console.log(`  ReferralSystem:   ${deployment.ReferralSystem}`);
  console.log(`  RewardDistributor: ${deployment.RewardDistributor}`);
  console.log("\n📁 Saved to: deployments/amoy-deployment.json");
  console.log("=".repeat(70));
}

deployOneByOne()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
