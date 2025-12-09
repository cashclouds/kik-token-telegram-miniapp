const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting KIK Token V2 Deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no MATIC! Please fund the account.");
  }

  // Set fee collector (can be changed later)
  // For now, use deployer address
  const feeCollectorAddress = deployer.address;
  console.log("💼 Fee collector address:", feeCollectorAddress);

  // Deploy KIKTokenV2
  console.log("\n📦 Deploying KIKTokenV2...");
  const KIKTokenV2 = await hre.ethers.getContractFactory("KIKTokenV2");
  const kikToken = await KIKTokenV2.deploy(feeCollectorAddress);

  await kikToken.waitForDeployment();
  const tokenAddress = await kikToken.getAddress();

  console.log("✅ KIKTokenV2 deployed to:", tokenAddress);

  // Get deployment info
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("\n📊 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);
  console.log("Contract Address:", tokenAddress);
  console.log("Deployer:", deployer.address);
  console.log("Fee Collector:", feeCollectorAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Fetch token info
  console.log("\n🔍 Verifying contract state...");
  const name = await kikToken.name();
  const symbol = await kikToken.symbol();
  const decimals = await kikToken.decimals();
  const totalSupply = await kikToken.totalSupply();
  const baseFeeRate = await kikToken.baseFeeRate();
  const pauseFee = await kikToken.pauseFee();

  console.log("Token Name:", name);
  console.log("Token Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Total Supply:", hre.ethers.formatEther(totalSupply), "KIK");
  console.log("Base Fee Rate:", Number(baseFeeRate) / 100, "%");
  console.log("Pause Fee:", hre.ethers.formatEther(pauseFee), "MATIC");

  // Save deployment info to JSON
  const deploymentInfo = {
    network: network.name,
    chainId: chainId,
    contractAddress: tokenAddress,
    deployer: deployer.address,
    feeCollector: feeCollectorAddress,
    timestamp: new Date().toISOString(),
    tokenInfo: {
      name: name,
      symbol: symbol,
      decimals: decimals.toString(),
      totalSupply: hre.ethers.formatEther(totalSupply),
      baseFeeRate: Number(baseFeeRate) / 100 + "%",
      pauseFee: hre.ethers.formatEther(pauseFee) + " MATIC",
    },
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save to file
  const deploymentFile = path.join(
    deploymentsDir,
    `${network.name}-v2-deployment.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Update wallet-app config
  console.log("\n🔧 Updating wallet-app configuration...");
  const walletConfigPath = path.join(
    __dirname,
    "..",
    "wallet-app",
    "lib",
    "kikToken.ts"
  );

  if (fs.existsSync(walletConfigPath)) {
    let configContent = fs.readFileSync(walletConfigPath, "utf8");

    // Update contract address (simple string replacement)
    configContent = configContent.replace(
      /address: '0x[a-fA-F0-9]{40}'/,
      `address: '${tokenAddress}'`
    );

    fs.writeFileSync(walletConfigPath, configContent);
    console.log("✅ Updated wallet-app config with new contract address");
  } else {
    console.log("⚠️  wallet-app config not found at:", walletConfigPath);
  }

  // Verification instructions
  console.log("\n📋 Next Steps:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. Verify contract on Polygonscan:");
  console.log(
    `   npx hardhat verify --network ${network.name} ${tokenAddress} ${feeCollectorAddress}`
  );
  console.log("\n2. Set anonymous pool address (after pool deployment):");
  console.log("   await kikToken.setAnonymousPool(poolAddress)");
  console.log("\n3. Test the contract:");
  console.log("   - Try transferring tokens");
  console.log("   - Check fee calculation");
  console.log("   - Test pause/unpause mechanism");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Polygonscan link
  if (chainId === 80002) {
    console.log(
      "\n🔗 View on Amoy Polygonscan:",
      `https://amoy.polygonscan.com/address/${tokenAddress}`
    );
  } else if (chainId === 137) {
    console.log(
      "\n🔗 View on Polygonscan:",
      `https://polygonscan.com/address/${tokenAddress}`
    );
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
