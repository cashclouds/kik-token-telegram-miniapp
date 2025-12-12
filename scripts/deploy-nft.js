const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function quickDeploy() {
  console.log("🚀 Quick Deployment - CollectiblesNFT Only\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  
  let balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "MATIC\n");

  // Load existing deployment
  const deploymentPath = path.join(__dirname, "../deployments/amoy-deployment.json");
  let deployment = {};
  if (fs.existsSync(deploymentPath)) {
    const data = fs.readFileSync(deploymentPath, "utf8");
    deployment = JSON.parse(data);
  }

  const kikTokenAddress = deployment.KIKTokenV3 || "0x1Dab8E237D2Be84AB02127282B42d4009Bf81cC0";
  const rewardPool = deployer.address;

  console.log("📦 Deploying CollectiblesNFT...\n");
  
  const CollectiblesNFT = await hre.ethers.getContractFactory("CollectiblesNFT");
  console.log("✓ Contract factory created");
  
  const tx = await CollectiblesNFT.deploy(kikTokenAddress, rewardPool);
  console.log("✓ Transaction sent:", tx.deploymentTransaction().hash);
  
  console.log("⏳ Waiting for confirmation (blocks needed: 2)...");
  const receipt = await tx.deploymentTransaction().wait(2);
  console.log("✓ Confirmed in block:", receipt.blockNumber);
  
  const address = await tx.getAddress();
  console.log("\n✅ CollectiblesNFT deployed to:", address);
  
  // Save
  deployment.CollectiblesNFT = address;
  deployment.timestamp = new Date().toISOString();
  deployment.deployer = deployer.address;
  deployment.network = "amoy";
  deployment.chainId = 80002;
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("✓ Saved to deployments/amoy-deployment.json");
  
  balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("\n💰 Remaining balance:", hre.ethers.formatEther(balance), "MATIC");
}

quickDeploy()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  });
