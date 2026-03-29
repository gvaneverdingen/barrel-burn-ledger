const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", balance.toString());
  
  const platformWallet = process.env.PLATFORM_WALLET || deployer.address;
  console.log("Platform wallet:", platformWallet);
  
  // Deploy CaskNFT
  console.log("\n1. Deploying CaskNFT...");
  const CaskNFT = await hre.ethers.getContractFactory("CaskNFT");
  const caskNFT = await CaskNFT.deploy();
  await caskNFT.waitForDeployment();
  const caskNFTAddress = await caskNFT.getAddress();
  console.log("✅ CaskNFT deployed to:", caskNFTAddress);
  
  // Deploy CaskMarketplace
  console.log("\n2. Deploying CaskMarketplace...");
  const CaskMarketplace = await hre.ethers.getContractFactory("CaskMarketplace");
  const marketplace = await CaskMarketplace.deploy(caskNFTAddress, platformWallet);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ CaskMarketplace deployed to:", marketplaceAddress);
  
  console.log("\n3. Setting up permissions...");
  console.log("✅ Keeping CaskNFT ownership with deployer for backend minting");
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    platformWallet: platformWallet,
    contracts: {
      CaskNFT: { address: caskNFTAddress },
      CaskMarketplace: { address: marketplaceAddress }
    },
    timestamp: new Date().toISOString()
  };
  
  const deploymentsDir = path.join(__dirname, 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const filename = path.join(deploymentsDir, `${hre.network.name}-${Date.now()}.json`);
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment info saved to:", filename);
  
  console.log("\n🔧 Add these to your Supabase Edge Function secrets:");
  console.log("CASK_NFT_CONTRACT_ADDRESS=" + caskNFTAddress);
  console.log("MARKETPLACE_CONTRACT_ADDRESS=" + marketplaceAddress);
  console.log("PLATFORM_WALLET_ADDRESS=" + platformWallet);
  
  if (hre.network.name !== "hardhat") {
    console.log("\n🔍 Verify contracts on PolygonScan:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${caskNFTAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${marketplaceAddress} "${caskNFTAddress}" "${platformWallet}"`);
  }
  
  console.log("\n✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
