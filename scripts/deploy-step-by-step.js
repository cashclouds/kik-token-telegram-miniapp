const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function deployContract(name, factory, args = []) {
  console.log(`\n📦 Deploying ${name}...`);
  
  try {
    const contract = await factory.deploy(...args);
    console.log(`⏳ Waiting for ${name} confirmation...`);
    const receipt = await contract.deploymentTransaction().wait(5); // Wait for 5 confirmations
    
    const address = await contract.getAddress();
    console.log(`✅ ${name} deployed to: ${address}`);
    return address;
  } catch (error) {
    console.error(`❌ Failed to deploy ${name}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting Smart Contracts Deployment...\n");

  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Balance:", hre.ethers.formatEther(balance), "MATIC\n");

    const deployment = {};
    const rewardPool = deployer.address;
    const treasury = deployer.address;

    // Step 1: Get KIKTokenV3 or deploy it
    const kikTokenAddress = "0x1Dab8E237D2Be84AB02127282B42d4009Bf81cC0";
    console.log("🔗 Using KIKTokenV3:", kikTokenAddress);
    deployment.KIKTokenV3 = kikTokenAddress;

    // Step 2: Deploy CollectiblesNFT
    const CollectiblesNFT = await hre.ethers.getContractFactory("CollectiblesNFT");
    const collectiblesNFTAddress = await deployContract(
      "CollectiblesNFT",
      CollectiblesNFT,
      [kikTokenAddress, rewardPool]
    );
    deployment.CollectiblesNFT = collectiblesNFTAddress;

    // Step 3: Deploy Marketplace
    const Marketplace = await hre.ethers.getContractFactory("Marketplace");
    const marketplaceAddress = await deployContract(
      "Marketplace",
      Marketplace,
      [kikTokenAddress, collectiblesNFTAddress, treasury, rewardPool]
    );
    deployment.Marketplace = marketplaceAddress;

    // Step 4: Deploy ReferralSystem
    const ReferralSystem = await hre.ethers.getContractFactory("ReferralSystem");
    const referralSystemAddress = await deployContract(
      "ReferralSystem",
      ReferralSystem,
      [kikTokenAddress, rewardPool]
    );
    deployment.ReferralSystem = referralSystemAddress;

    // Step 5: Deploy RewardDistributor
    const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
    const rewardDistributorAddress = await deployContract(
      "RewardDistributor",
      RewardDistributor,
      [kikTokenAddress, referralSystemAddress, rewardPool, deployer.address]
    );
    deployment.RewardDistributor = rewardDistributorAddress;

    // Save deployment
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentPath = path.join(deploymentsDir, "amoy-deployment.json");
    const finalDeployment = {
      network: "amoy",
      chainId: 80002,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      rewardPool,
      treasury,
      ...deployment
    };

    fs.writeFileSync(deploymentPath, JSON.stringify(finalDeployment, null, 2));

    // Print summary
    console.log("\n" + "=".repeat(70));
    console.log("✅ ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log("\n📋 Deployed Addresses:");
    Object.entries(deployment).forEach(([name, address]) => {
      console.log(`  ${name.padEnd(20)}: ${address}`);
    });
    console.log("\n📊 Network: Polygon Amoy Testnet (Chain ID: 80002)");
    console.log("📁 Data saved to: deployments/amoy-deployment.json");
    console.log("=".repeat(70));

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

main();
