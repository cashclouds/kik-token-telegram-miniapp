const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔥 Deploying BurningSystem...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

  // Load existing deployment addresses
  const deploymentPath = path.join(__dirname, "../deployments/amoy-merkle-deployment.json");

  let kikTokenAddress, merkleTreeAddress, anonymousPoolAddress;

  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    merkleTreeAddress = deployment.MerkleTreeManager;
    console.log("✅ Using existing MerkleTreeManager:", merkleTreeAddress);
  } else {
    throw new Error("❌ MerkleTreeManager not deployed. Run deploy-merkle.js first");
  }

  // Check for KIKTokenV2 and AnonymousPool
  const poolDeploymentPath = path.join(__dirname, "../deployments/amoy-pool-deployment.json");

  if (fs.existsSync(poolDeploymentPath)) {
    const poolDeployment = JSON.parse(fs.readFileSync(poolDeploymentPath, "utf8"));
    kikTokenAddress = poolDeployment.KIKTokenV2;
    anonymousPoolAddress = poolDeployment.AnonymousPool;
    console.log("✅ Using existing KIKTokenV2:", kikTokenAddress);
    console.log("✅ Using existing AnonymousPool:", anonymousPoolAddress);
  } else {
    console.log("\n⚠️  WARNING: KIKTokenV2 and AnonymousPool not found.");
    console.log("Please deploy them first with: npm run deploy:amoy:pool:lite");
    console.log("\nOr provide addresses manually:");

    // For testing, you can hardcode addresses here:
    // kikTokenAddress = "0x...";
    // anonymousPoolAddress = "0x...";

    throw new Error("Missing required contract addresses");
  }

  console.log("\n📦 Deploying BurningSystem...");

  // Deploy BurningSystem
  const BurningSystem = await hre.ethers.getContractFactory("BurningSystem");
  const burningSystem = await BurningSystem.deploy(
    anonymousPoolAddress,
    merkleTreeAddress,
    kikTokenAddress
  );

  await burningSystem.waitForDeployment();
  const burningSystemAddress = await burningSystem.getAddress();

  console.log("✅ BurningSystem deployed to:", burningSystemAddress);

  // Setup: Set burning system in AnonymousPool
  console.log("\n⚙️  Configuring AnonymousPool...");

  const AnonymousPool = await hre.ethers.getContractFactory("AnonymousPool");
  const pool = AnonymousPool.attach(anonymousPoolAddress);

  const tx = await pool.setBurningSystem(burningSystemAddress);
  await tx.wait();

  console.log("✅ BurningSystem address set in AnonymousPool");

  // Fund BurningSystem with KIK for keeper rewards
  console.log("\n💰 Funding BurningSystem with keeper rewards...");

  const KIKTokenV2 = await hre.ethers.getContractFactory("KIKTokenV2");
  const kikToken = KIKTokenV2.attach(kikTokenAddress);

  const rewardFund = hre.ethers.parseEther("1000"); // 1000 KIK for rewards

  const approveTx = await kikToken.approve(burningSystemAddress, rewardFund);
  await approveTx.wait();

  const fundTx = await burningSystem.fundRewards(rewardFund);
  await fundTx.wait();

  console.log("✅ Funded with 1000 KIK for keeper rewards");

  // Get statistics
  const stats = await burningSystem.getStats();
  console.log("\n📊 BurningSystem Stats:");
  console.log("   Expired commitments:", stats._expiredCount.toString());
  console.log("   Total burned:", stats._totalBurned.toString());
  console.log("   Reward balance:", hre.ethers.formatEther(stats._rewardBalance), "KIK");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      KIKTokenV2: kikTokenAddress,
      MerkleTreeManager: merkleTreeAddress,
      AnonymousPool: anonymousPoolAddress,
      BurningSystem: burningSystemAddress
    },
    constants: {
      KEEPER_REWARD: "0.01",
      SOFT_EXPIRY_DAYS: 91,
      HARD_EXPIRY_DAYS: 105,
      MAX_BURN_BATCH: 10
    }
  };

  const outputPath = path.join(__dirname, "../deployments/amoy-burning-deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment info saved to:", outputPath);

  // Verification command
  console.log("\n🔍 To verify on Polygonscan, run:");
  console.log(`npx hardhat verify --network amoy ${burningSystemAddress} "${anonymousPoolAddress}" "${merkleTreeAddress}" "${kikTokenAddress}"`);

  console.log("\n✅ BurningSystem deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
