# Angel Share Smart Contracts

Smart contracts for tokenizing whisky cask ownership on Polygon blockchain.

## Contracts

### CaskNFT.sol
ERC-721 NFT contract representing individual cask ownership.

**Features:**
- Unique NFT for each cask
- Metadata stored on-chain and IPFS
- Distillery tracking for royalties
- Safe minting with validation
- **Rarity attributes for collectibility:**
  - `ageYears`: Current age of the cask
  - `rarityTier`: 1-5 scale (Common to Legendary)
  - `caskType`: Type of cask (Ex-Bourbon, Sherry, Port, etc.)
  - `specialFinish`: Special finishing (Sauternes, Rum Cask, etc.)
  - `region`: Production region (Speyside, Islay, Highland, etc.)
  - `isSingleBarrel`: Whether it's a single barrel cask

### CaskMarketplace.sol
Marketplace contract for buying and selling cask NFTs.

**Fee Structure:**
- Platform Fee: 8.5% on all sales
- Distillery Royalty: 3% on secondary sales
- Seller Receives: 88.5% (primary) or 85.5% (secondary)

**Features:**
- Automated royalty distribution
- Primary and secondary sale tracking
- Reentrancy protection
- Sales history on-chain

## Setup

1. **Install dependencies:**
```bash
cd supabase/contracts
npm install
```

2. **Configure environment:**
Create `.env` file:
```env
POLYGON_PRIVATE_KEY=your_private_key_here
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PLATFORM_WALLET=your_platform_wallet_address
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

3. **Compile contracts:**
```bash
npm run compile
```

## Deployment

### Mumbai Testnet (Testing)
```bash
npm run deploy:mumbai
```

### Polygon Mainnet (Production)
```bash
npm run deploy:polygon
```

### Local Development
```bash
npm run deploy:local
```

## After Deployment

1. **Save contract addresses** from deployment output

2. **Add to Supabase Edge Function secrets:**
```bash
CASK_NFT_CONTRACT_ADDRESS=<deployed_address>
MARKETPLACE_CONTRACT_ADDRESS=<deployed_address>
PLATFORM_WALLET_ADDRESS=<wallet_address>
```

3. **Verify contracts on PolygonScan:**
```bash
npm run verify:mumbai <contract_address> <constructor_args>
```

4. **Update database migration** to add contract tracking columns

## Contract ABIs

After compilation, ABIs are available in:
```
artifacts/CaskNFT.sol/CaskNFT.json
artifacts/CaskMarketplace.sol/CaskMarketplace.json
```

Copy these to your edge functions for interaction.

## Testing

Run contract tests:
```bash
npm test
```

## Gas Estimates

### Polygon Mumbai (Testnet)
- Mint Cask NFT: ~150,000 gas (~0.0045 MATIC at 30 gwei)
- List for Sale: ~80,000 gas (~0.0024 MATIC)
- Purchase: ~120,000 gas (~0.0036 MATIC)

### Polygon Mainnet
Gas costs vary with network congestion. Monitor at: https://polygonscan.com/gastracker

## Security Considerations

1. **Private Key Security**: Never commit private keys to version control
2. **Multi-sig Wallet**: Use multi-sig for contract ownership in production
3. **Audit**: Get contracts audited before mainnet deployment
4. **Testing**: Thoroughly test on Mumbai testnet first
5. **Upgradability**: Consider proxy patterns for future upgrades

## Integration with Edge Functions

The `blockchain-logger` edge function needs to be updated to:
1. Import contract ABIs
2. Use `ethers.Contract` instead of raw transactions
3. Call `mintCask()` for minting
4. Call marketplace functions for sales

## Support

For issues or questions, contact the development team or open an issue in the repository.

## License

MIT License - See LICENSE file for details
