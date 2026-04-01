require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const normalizePrivateKey = (privateKey) => {
  if (!privateKey) return [];
  return [privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`];
};

const polygonAmoyRpcUrl =
  process.env.POLYGON_AMOY_RPC_URL ||
  process.env.POLYGON_RPC_URL ||
  "https://rpc-amoy.polygon.technology";

const polygonMainnetRpcUrl =
  process.env.POLYGON_MAINNET_RPC_URL ||
  "https://polygon-rpc.com";

const accounts = normalizePrivateKey(process.env.POLYGON_PRIVATE_KEY);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      evmVersion: "cancun",
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    polygonAmoy: {
      url: polygonAmoyRpcUrl,
      accounts,
      chainId: 80002,
      gasPrice: 30000000000,
    },
    amoy: {
      url: polygonAmoyRpcUrl,
      accounts,
      chainId: 80002,
      gasPrice: 30000000000,
    },
    polygon: {
      url: polygonMainnetRpcUrl,
      accounts,
      chainId: 137,
      gasPrice: 50000000000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "PMVWKJI1HDPKSHUAJ7ZXUA2K5XC4H7JM7P",
  },
  sourcify: {
    enabled: false,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

{
  "name": "angel-share-contracts",
  "version": "1.0.0",
  "description": "Smart contracts for Angel Share cask NFT marketplace",
  "scripts": {
    "compile": "hardhat compile",
    "deploy:amoy": "hardhat run deploy.cjs --network polygonAmoy",
    "deploy:polygon": "hardhat run deploy.cjs --network polygon",
    "deploy:local": "hardhat run deploy.cjs --network hardhat",
    "test": "hardhat test",
    "verify:amoy": "hardhat verify --network polygonAmoy",
    "verify:polygon": "hardhat verify --network polygon"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-ethers": "^3.1.0",
    "@nomicfoundation/hardhat-verify": "2.1.3",
    "ethers": "^6.4.0",
    "hardhat": "^2.22.8"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.0",
    "dotenv": "^16.3.1"
  }
}