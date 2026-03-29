/**
 * Deployment script for Angel Share smart contracts
 * 
 * This script deploys:
 * 1. CaskNFT contract
 * 2. CaskMarketplace contract
 * 
 * Usage:
 * node deploy.js --network <network> --platform-wallet <address>
 * 
 * Networks:
 * - mumbai (Polygon Mumbai testnet)
 * - polygon (Polygon mainnet)
 * - hardhat (Local development)
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Get platform wallet from command line or use deployer
  const platformWallet = process.env.PLATFORM_WALLET || deployer.address;
  console.log("Platform wallet:", platformWallet);
  
  // Deploy CaskNFT
  console.log("\n1. Deploying CaskNFT...");
  const CaskNFT = await hre.ethers.getContractFactory("CaskNFT");
  const caskNFT = await CaskNFT.deploy();
  await caskNFT.deployed();
  console.log("✅ CaskNFT deployed to:", caskNFT.address);
  
  // Deploy CaskMarketplace
  console.log("\n2. Deploying CaskMarketplace...");
  const CaskMarketplace = await hre.ethers.getContractFactory("CaskMarketplace");
  const marketplace = await CaskMarketplace.deploy(caskNFT.address, platformWallet);
  await marketplace.deployed();
  console.log("✅ CaskMarketplace deployed to:", marketplace.address);
  
  // Grant marketplace permissions
  console.log("\n3. Setting up permissions...");
  // Note: The marketplace needs to be able to call mintCask, so we could either:
  // a) Transfer ownership of CaskNFT to the marketplace, or
  // b) Keep backend control and mint through edge functions
  // For security, we'll keep backend control
  console.log("✅ Keeping CaskNFT ownership with deployer for backend minting");
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    platformWallet: platformWallet,
    contracts: {
      CaskNFT: {
        address: caskNFT.address,
        blockNumber: caskNFT.deployTransaction.blockNumber
      },
      CaskMarketplace: {
        address: marketplace.address,
        blockNumber: marketplace.deployTransaction.blockNumber
      }
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
  
  // Environment variables for edge functions
  console.log("\n🔧 Add these to your Supabase Edge Function secrets:");
  console.log("CASK_NFT_CONTRACT_ADDRESS=" + caskNFT.address);
  console.log("MARKETPLACE_CONTRACT_ADDRESS=" + marketplace.address);
  console.log("PLATFORM_WALLET_ADDRESS=" + platformWallet);
  
  // Verification info
  if (hre.network.name !== "hardhat") {
    console.log("\n🔍 Verify contracts on PolygonScan:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${caskNFT.address}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${marketplace.address} "${caskNFT.address}" "${platformWallet}"`);
  }
  
  console.log("\n✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
