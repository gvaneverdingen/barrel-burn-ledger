# Polygon Mumbai Testnet Deployment Guide

This guide will walk you through deploying the Angel Share smart contracts to Polygon Mumbai testnet.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] MetaMask or another Web3 wallet
- [ ] Polygon Mumbai testnet configured in your wallet

---

## Step 1: Install Dependencies

```bash
cd supabase/contracts
npm install
```

---

## Step 2: Configure Environment Variables

Create a `.env` file in the `supabase/contracts` directory:

```bash
cp .env.example .env
```

Then edit `.env` and fill in the following:

### Required Variables:

1. **POLYGON_PRIVATE_KEY**
   - Your wallet's private key (WITHOUT the 0x prefix)
   - ⚠️ **NEVER commit this to version control**
   - To export from MetaMask: Account Details → Export Private Key

2. **POLYGON_RPC_URL**
   - Default: `https://rpc-mumbai.maticvigil.com`
   - Alternative: Get free RPC from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)

3. **PLATFORM_WALLET**
   - Your wallet address that will receive platform fees
   - Format: `0x...` (full address with 0x prefix)
   - Can be the same as the deployer wallet

### Optional Variables:

4. **ETHERSCAN_API_KEY**
   - Single Etherscan API V2 key used by Hardhat Verify for Polygon Amoy and Polygon mainnet
   - Get from: https://etherscan.io/apis
   - Not required but recommended

---

## Step 3: Get Test MATIC

You need MATIC on Mumbai testnet to pay for gas fees.

### Faucet Options:

1. **Polygon Faucet** (Official)
   - https://faucet.polygon.technology/
   - Requires social media account
   - Provides 0.2 MATIC

2. **Alchemy Faucet**
   - https://mumbaifaucet.com/
   - Requires Alchemy account
   - Provides 0.5 MATIC

3. **QuickNode Faucet**
   - https://faucet.quicknode.com/polygon/mumbai
   - No signup required
   - Provides 0.1 MATIC

### Verify Your Balance:

Check your wallet address on Mumbai Explorer:
https://mumbai.polygonscan.com/address/YOUR_WALLET_ADDRESS

You should have at least **0.1 MATIC** for deployment.

---

## Step 4: Compile Contracts

Before deploying, compile the contracts to ensure everything is correct:

```bash
npm run compile
```

Expected output:
```
Compiled 15 Solidity files successfully
```

---

## Step 5: Deploy to Mumbai Testnet

Run the deployment script:

```bash
npm run deploy:mumbai
```

### Expected Output:

```
Deploying contracts with account: 0x...
Account balance: 200000000000000000

1. Deploying CaskNFT...
✅ CaskNFT deployed to: 0x...

2. Deploying CaskMarketplace...
✅ CaskMarketplace deployed to: 0x...

3. Setting up permissions...
✅ Keeping CaskNFT ownership with deployer for backend minting

📄 Deployment info saved to: deployments/mumbai-1234567890.json

🔧 Add these to your Supabase Edge Function secrets:
CASK_NFT_CONTRACT_ADDRESS=0x...
MARKETPLACE_CONTRACT_ADDRESS=0x...
PLATFORM_WALLET_ADDRESS=0x...
```

**⚠️ SAVE THESE CONTRACT ADDRESSES!** You'll need them for the next step.

---

## Step 6: Add Contract Addresses to Supabase Secrets

The deployment will output the contract addresses. Add them to your Supabase project:

1. Go to: https://supabase.com/dashboard/project/vnmmjmxhtbplfkdughxu/settings/functions

2. Add these secrets:
   - `CASK_NFT_CONTRACT_ADDRESS` - The CaskNFT contract address
   - `MARKETPLACE_CONTRACT_ADDRESS` - The CaskMarketplace contract address
   - `PLATFORM_WALLET_ADDRESS` - Your platform wallet address

---

## Step 7: Verify Contracts (Optional but Recommended)

Contract verification makes your contracts readable on PolygonScan:

```bash
npx hardhat verify --network mumbai CASK_NFT_CONTRACT_ADDRESS

npx hardhat verify --network mumbai MARKETPLACE_CONTRACT_ADDRESS "CASK_NFT_CONTRACT_ADDRESS" "PLATFORM_WALLET_ADDRESS"
```

Replace the addresses with your actual deployed addresses.

---

## Step 8: Test Your Deployment

### Check on Mumbai Explorer:

1. **CaskNFT Contract**: https://mumbai.polygonscan.com/address/YOUR_CASK_NFT_ADDRESS
2. **Marketplace Contract**: https://mumbai.polygonscan.com/address/YOUR_MARKETPLACE_ADDRESS

### Test Minting (via Edge Function):

The `blockchain-logger` edge function will automatically interact with your deployed contracts when transactions occur in your application.

---

## Troubleshooting

### Error: "Insufficient funds"
- **Solution**: Get more test MATIC from faucets listed in Step 3

### Error: "Nonce too high"
- **Solution**: Reset your MetaMask account (Settings → Advanced → Reset Account)

### Error: "Cannot read properties of undefined"
- **Solution**: Check your `.env` file - ensure POLYGON_PRIVATE_KEY has no spaces or 0x prefix

### Error: "Invalid API Key"
- **Solution**: Verify your ETHERSCAN_API_KEY or skip verification step

### Gas Price Too Low
- **Solution**: Increase `gasPrice` in `hardhat.config.js` (currently 30 gwei)

---

## Post-Deployment Checklist

- [ ] Contract addresses saved
- [ ] Supabase secrets updated
- [ ] Contracts verified on PolygonScan (optional)
- [ ] Test transaction attempted
- [ ] Deployment info backed up

---

## Gas Cost Estimates

- **CaskNFT Deployment**: ~150,000 gas (~0.0045 MATIC at 30 gwei)
- **Marketplace Deployment**: ~250,000 gas (~0.0075 MATIC at 30 gwei)
- **Total**: ~0.015 MATIC + buffer = **0.05 MATIC recommended**

---

## Security Reminders

⚠️ **CRITICAL**:
- NEVER commit your `.env` file
- NEVER share your private key
- Keep deployment addresses documented securely
- Use a separate wallet for testnet vs mainnet

---

## Next Steps

After successful deployment:

1. Test minting a cask NFT through your application
2. Test marketplace listing functionality
3. Monitor transactions on Mumbai Explorer
4. When ready for mainnet, follow the same process with `npm run deploy:polygon`

---

## Support Resources

- **Polygon Docs**: https://docs.polygon.technology/
- **Hardhat Docs**: https://hardhat.org/docs
- **Mumbai Explorer**: https://mumbai.polygonscan.com/
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/

---

## Emergency Contacts

If you encounter issues during deployment, check:
1. Edge function logs: https://supabase.com/dashboard/project/vnmmjmxhtbplfkdughxu/functions/blockchain-logger/logs
2. Hardhat console output
3. Mumbai PolygonScan for transaction details
