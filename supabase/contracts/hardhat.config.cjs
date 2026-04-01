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
