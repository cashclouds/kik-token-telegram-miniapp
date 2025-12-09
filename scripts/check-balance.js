const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Deployer address:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "MATIC");

  if (balance === 0n) {
    console.log("\n❌ No MATIC! Get test MATIC from:");
    console.log("   https://faucet.polygon.technology/");
  } else {
    console.log("\n✅ Balance OK! Ready to deploy.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
