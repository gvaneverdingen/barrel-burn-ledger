# Angel Share Blockchain Deployment Guide

Complete guide for deploying and integrating smart contracts with the Angel Share platform.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Smart Contract Architecture](#smart-contract-architecture)
4. [Deployment Steps](#deployment-steps)
5. [Integration with Backend](#integration-with-backend)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Angel Share platform uses Polygon blockchain to tokenize whisky cask ownership as ERC-721 NFTs with automated royalty distribution through smart contracts.

**Current Status:**
- ✅ Smart contracts written (CaskNFT, CaskMarketplace)
- ✅ Database schema updated for blockchain tracking
- ✅ Edge function updated to support both logging and smart contracts
- ⏳ Contracts need to be deployed
- ⏳ ABIs need to be integrated

---

## 📦 Prerequisites

### Required Tools
```bash
# Node.js 18+ and npm
node --version

# Hardhat (installed via npm in contracts directory)
cd supabase/contracts
npm install
```

### Required Accounts/Keys

1. **Polygon Wallet**
   - Private key with MATIC for gas fees
   - For Mumbai testnet: Get free MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
   - For Mainnet: Purchase MATIC from exchanges

2. **PolygonScan API Key** (optional, for contract verification)
   - Register at [PolygonScan](https://polygonscan.com/register)
   - Generate API key

3. **IPFS/Pinata** (for metadata storage)
   - Sign up at [Pinata](https://pinata.cloud/)
   - Get API keys

---

## 🏗️ Smart Contract Architecture

### CaskNFT.sol
ERC-721 token representing cask ownership

**Key Features:**
- Unique NFT per cask
- On-chain metadata storage
- Distillery tracking for royalties
- Token ID to Cask ID mapping

**Main Functions:**
```solidity
function mintCask(
  address to,
  string caskId,
  address distillery,
  string spiritName,
  string caskNumber,
  uint256 volumeLiters,
  uint256 alcoholPercentage,
  uint256 distillationDate,
  string tokenURI
) returns (uint256 tokenId)

function getTokenIdByCaskId(string caskId) returns (uint256)
function getCaskMetadata(uint256 tokenId) returns (CaskMetadata)
```

### CaskMarketplace.sol
Handles buying/selling with automated fee distribution

**Fee Structure:**
```
Primary Sale (Distillery → Buyer):
- Seller (Distillery): 91.5%
- Platform: 8.5%

Secondary Sale (Investor → Buyer):
- Seller: 88.5%
- Platform: 8.5%
- Original Distillery: 3% (royalty)
```

**Main Functions:**
```solidity
function listCask(uint256 tokenId, uint256 price, bool isPrimarySale)
function purchaseCask(uint256 tokenId) payable
function unlistCask(uint256 tokenId)
function calculateFees(uint256 price, bool isPrimarySale) 
  returns (uint256 platformFee, uint256 distilleryRoyalty, uint256 sellerAmount)
```

---

## 🚀 Deployment Steps

### Step 1: Configure Environment

Create `.env` file in `supabase/contracts/`:

```env
# Network Configuration
POLYGON_PRIVATE_KEY=your_private_key_without_0x
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com

# Platform Configuration
PLATFORM_WALLET=0x_your_platform_wallet_address

# PolygonScan API (for verification)
POLYGONSCAN_API_KEY=your_api_key_here

# Network Selection
NETWORK=mumbai
```

### Step 2: Compile Contracts

```bash
cd supabase/contracts
npm run compile
```

This generates:
- Contract bytecode
- ABIs in `artifacts/` directory

### Step 3: Deploy to Mumbai Testnet

```bash
npm run deploy:mumbai
```

**Expected Output:**
```
Deploying contracts with account: 0x...
Account balance: 1000000000000000000

1. Deploying CaskNFT...
✅ CaskNFT deployed to: 0x1234...

2. Deploying CaskMarketplace...
✅ CaskMarketplace deployed to: 0x5678...

3. Setting up permissions...
✅ Keeping CaskNFT ownership with deployer

📄 Deployment info saved to: deployments/mumbai-1234567890.json

🔧 Add these to your Supabase Edge Function secrets:
CASK_NFT_CONTRACT_ADDRESS=0x1234...
MARKETPLACE_CONTRACT_ADDRESS=0x5678...
PLATFORM_WALLET_ADDRESS=0xabcd...
```

### Step 4: Verify Contracts (Optional but Recommended)

```bash
npx hardhat verify --network mumbai 0x1234... # CaskNFT address
npx hardhat verify --network mumbai 0x5678... "0x1234..." "0xabcd..." # Marketplace
```

Verified contracts appear on PolygonScan with readable source code.

---

## 🔗 Integration with Backend

### Step 5: Update Supabase Edge Function Secrets

In your Supabase dashboard:

1. Go to **Settings** → **Edge Functions**
2. Add these secrets:

```
CASK_NFT_CONTRACT_ADDRESS=0x1234... (from deployment)
MARKETPLACE_CONTRACT_ADDRESS=0x5678... (from deployment)
PLATFORM_WALLET_ADDRESS=0xabcd... (your platform wallet)
```

### Step 6: Extract Contract ABIs

```bash
cd supabase/contracts
node -e "console.log(JSON.stringify(require('./artifacts/CaskNFT.sol/CaskNFT.json').abi, null, 2))" > CaskNFT.abi.json
node -e "console.log(JSON.stringify(require('./artifacts/CaskMarketplace.sol/CaskMarketplace.json').abi, null, 2))" > CaskMarketplace.abi.json
```

### Step 7: Update blockchain-logger Function

The function is already prepared to use smart contracts! It will:
- Check if `CASK_NFT_CONTRACT_ADDRESS` exists
- If yes: Use smart contracts for minting/transfers
- If no: Fall back to logging-only mode

**No code changes needed** - just deploy contracts and add secrets.

---

## 🧪 Testing

### Test on Mumbai Testnet

1. **Test Cask Minting:**
```bash
# Through your app's distillery interface
# Or use BlockchainTesting page
```

2. **Test Marketplace Listing:**
   - List a cask from portfolio
   - Verify listing appears on-chain

3. **Test Purchase:**
   - Buy a listed cask
   - Verify NFT transfer
   - Check fee distribution

4. **Verify on PolygonScan:**
```
https://mumbai.polygonscan.com/address/0x1234... # Your NFT contract
https://mumbai.polygonscan.com/tx/0xabcd... # Specific transaction
```

### Automated Testing

```bash
cd supabase/contracts
npm test
```

---

## 🌐 Production Deployment

### Prerequisites for Mainnet

1. ✅ Extensive testing on Mumbai
2. ✅ Security audit of contracts (recommended)
3. ✅ Sufficient MATIC in deployer wallet
4. ✅ Platform wallet configured
5. ✅ IPFS metadata storage ready

### Deploy to Polygon Mainnet

```bash
# Update .env
NETWORK=polygon
POLYGON_RPC_URL=https://polygon-rpc.com

# Deploy
npm run deploy:polygon
```

### Post-Deployment Checklist

- [ ] Verify contracts on PolygonScan
- [ ] Update Supabase secrets with mainnet addresses
- [ ] Test with small transaction
- [ ] Monitor gas costs
- [ ] Set up contract monitoring/alerts
- [ ] Document all contract addresses
- [ ] Consider multi-sig for contract ownership

---

## ⚙️ Gas Cost Estimates

### Mumbai Testnet (30 gwei)
- Mint Cask NFT: ~150,000 gas (~0.0045 MATIC)
- List for Sale: ~80,000 gas (~0.0024 MATIC)
- Purchase: ~120,000 gas (~0.0036 MATIC)

### Polygon Mainnet
Gas costs vary with network congestion. Monitor at:
https://polygonscan.com/gastracker

**Typical Range:**
- Low traffic: 30-50 gwei
- Medium traffic: 50-100 gwei
- High traffic: 100-500 gwei

---

## 🔧 Troubleshooting

### Common Issues

**1. "Insufficient funds for gas"**
```bash
# Check wallet balance
cast balance 0xyour_wallet_address --rpc-url $POLYGON_RPC_URL

# Get testnet MATIC
https://faucet.polygon.technology/
```

**2. "Transaction reverted"**
- Check contract is deployed: View on PolygonScan
- Verify function parameters match types
- Check edge function logs in Supabase

**3. "Contract not found"**
- Ensure `CASK_NFT_CONTRACT_ADDRESS` secret is set
- Verify address is correct (starts with 0x)
- Check you're using correct network

**4. "Nonce too low"**
```bash
# Reset nonce in MetaMask or wallet
# Or wait for pending transactions to clear
```

### Debug Edge Function

1. Go to Supabase Dashboard → Edge Functions
2. Select `blockchain-logger`
3. View logs in real-time
4. Look for errors in contract interaction

### View Blockchain Logs Table

```sql
-- Check recent blockchain transactions
SELECT * FROM blockchain_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for failed transactions
SELECT * FROM blockchain_logs 
WHERE blockchain_hash = '' 
OR gas_used IS NULL;
```

---

## 📚 Additional Resources

- [Polygon Documentation](https://docs.polygon.technology/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)

---

## 🆘 Support

For issues or questions:
1. Check edge function logs
2. View blockchain_logs table
3. Verify on PolygonScan
4. Review contract deployment info
5. Contact development team

---

## ⚠️ Security Reminders

1. **Never commit private keys** to version control
2. **Use multi-sig** for contract ownership in production
3. **Audit contracts** before mainnet deployment
4. **Test thoroughly** on Mumbai testnet
5. **Monitor transactions** for anomalies
6. **Keep backups** of deployment info
7. **Rotate keys** regularly

---

**Last Updated:** 2025-01-21
**Version:** 1.0.0
