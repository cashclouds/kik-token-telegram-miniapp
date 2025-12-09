const hre = require("hardhat");

async function main() {
  console.log("📦 Step 1/4: Deploying CollectiblesNFT...\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Deployer:", deployer.address);
  console.log("Balance BEFORE:", hre.ethers.formatEther(balance), "MATIC\n");

  if (balance < hre.ethers.parseEther("0.02")) {
    console.log("⚠️  WARNING: Low balance! This might fail.");
    console.log("   Need ~0.02 MATIC for CollectiblesNFT\n");
  }

  const kikTokenAddress = "0x6B03Ff41cE23dE82241792a19E3464A304e12F97";
  const rewardPoolAddress = deployer.address;

  const CollectiblesNFT = await hre.ethers.getContractFactory("CollectiblesNFT");
  const collectiblesNFT = await CollectiblesNFT.deploy(kikTokenAddress, rewardPoolAddress);
  await collectiblesNFT.waitForDeployment();
  const address = await collectiblesNFT.getAddress();

  const balanceAfter = await hre.ethers.provider.getBalance(deployer.address);
  const spent = balance - balanceAfter;

  console.log("\n✅ CollectiblesNFT deployed!");
  console.log("   Address:", address);
  console.log("   Gas spent:", hre.ethers.formatEther(spent), "MATIC");
  console.log("   Balance AFTER:", hre.ethers.formatEther(balanceAfter), "MATIC");
  console.log("\n📝 Save this address for next step!");
  console.log("\nNext: npm run deploy:step2");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:", error.message);
    process.exit(1);
  });
