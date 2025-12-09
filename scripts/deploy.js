const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying KIK Token to", hre.network.name);
  console.log("============================================");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC");

  if (balance === 0n) {
    console.log("⚠️  Warning: Account has no MATIC for gas fees!");
    console.log("   Get MATIC from: https://faucet.polygon.technology/ (testnet)");
    console.log("   Or buy MATIC on exchange for mainnet");
    return;
  }

  // Deploy the contract
  console.log("\n📄 Deploying KIK Token contract...");
  const KIKToken = await hre.ethers.getContractFactory("KIKToken");
  const kikToken = await KIKToken.deploy();

  await kikToken.waitForDeployment();
  const tokenAddress = await kikToken.getAddress();

  console.log("\n✅ KIK Token deployed successfully!");
  console.log("============================================");
  console.log("📍 Contract Address:", tokenAddress);
  console.log("🔗 Network:", hre.network.name);
  console.log("👤 Owner:", deployer.address);
  
  // Get token info
  const name = await kikToken.name();
  const symbol = await kikToken.symbol();
  const decimals = await kikToken.decimals();
  const totalSupply = await kikToken.totalSupply();
  
  console.log("\n📊 Token Information:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals.toString());
  console.log("   Total Supply:", hre.ethers.formatEther(totalSupply), symbol);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contractAddress: tokenAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    tokenInfo: {
      name,
      symbol,
      decimals: decimals.toString(),
      totalSupply: hre.ethers.formatEther(totalSupply)
    }
  };

  const fs = require('fs');
  const path = require('path');
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save deployment info
  const filename = `${hre.network.name}-deployment.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to:", `deployments/${filename}`);

  // Verify contract on Polygonscan (only for mainnet/testnet)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      console.log("🔍 Verifying contract on Polygonscan...");
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Polygonscan!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("   You can verify manually later using:");
      console.log(`   npx hardhat verify --network ${hre.network.name} ${tokenAddress}`);
    }
  }

  console.log("\n🎉 Deployment complete!");
  console.log("============================================");
  
  // Next steps
  console.log("\n📝 Next Steps:");
  console.log("1. Add MATIC to your wallet for gas fees");
  console.log("2. Add KIK token to MetaMask:");
  console.log("   - Token Address:", tokenAddress);
  console.log("   - Token Symbol: KIK");
  console.log("   - Token Decimals: 18");
  console.log("3. View on Polygonscan:");
  
  if (hre.network.name === "polygon") {
    console.log(`   https://polygonscan.com/address/${tokenAddress}`);
  } else if (hre.network.name === "mumbai") {
    console.log(`   https://mumbai.polygonscan.com/address/${tokenAddress}`);
  } else if (hre.network.name === "amoy") {
    console.log(`   https://amoy.polygonscan.com/address/${tokenAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
