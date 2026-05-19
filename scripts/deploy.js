const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying KatangaVaultFactory with:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("KatangaVaultFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log("KatangaVaultFactory deployed to:", address);
  console.log("Base USDC:", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");

  if (hre.network.name === "base" && process.env.BASESCAN_API_KEY) {
    console.log("Waiting for block confirmations before verification...");
    await factory.deploymentTransaction().wait(5);

    await hre.run("verify:verify", {
      address,
      constructorArguments: [],
    });
    console.log("Verified on Basescan.");
  } else if (hre.network.name === "base") {
    console.log("Skipping verify: BASESCAN_API_KEY not set.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
