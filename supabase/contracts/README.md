# Angel Share Smart Contracts

Smart contracts for tokenizing whisky cask ownership on Polygon.

## Contracts

### CaskNFT.sol
ERC-721 NFT contract representing individual cask ownership.

**Features:**
- Unique NFT for each cask
- Metadata stored on-chain and IPFS
- Distillery tracking for royalties
- Safe minting with validation
- Rarity attributes for collectibility

### CaskMarketplace.sol
Marketplace contract for buying and selling cask NFTs.

**Fee Structure:**
- Platform fee: 8.5% on all sales
- Distillery royalty: 3% on secondary sales
- Seller receives: 88.5% (primary) or 85.5% (secondary)

**Features:**
- Automated royalty distribution
- Primary and secondary sale tracking
- Reentrancy protection
- Sales history on-chain

## Setup

1. **Install dependencies**
```bash
cd supabase/contracts
npm install
```

2. **Configure environment**
Create `.env` in `supabase/contracts`:
```env
POLYGON_PRIVATE_KEY=your_private_key_here
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com
PLATFORM_WALLET=your_platform_wallet_address
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

> `POLYGON_PRIVATE_KEY` can be provided with or without the `0x` prefix.

3. **Compile contracts**
```bash
npm run compile
```

## Deployment

### Polygon Amoy Testnet
```bash
npm run deploy:amoy
```

### Polygon Mainnet
```bash
npm run deploy:polygon
```

### Local Development
```bash
npm run deploy:local
```

## Verification

### Verify CaskNFT on Amoy
```bash
npm run verify:amoy -- 0x4350D374a9Eebc813bFE1e9548A4A5cF39922EDe
```

### Verify CaskMarketplace on Amoy
```bash
npm run verify:amoy -- 0x689672524DA7F415573A18369FAB3198b9652eFd "0x4350D374a9Eebc813bFE1e9548A4A5cF39922EDe" "0xfDd95A56e68C7236bA6d8047D51eB235B4dB94D8"
```

If you prefer the network alias, `--network amoy` still works via the custom chain config, but `polygonAmoy` is the native Hardhat network name.

## After Deployment

1. Save the deployed contract addresses
2. Update Supabase Edge Function secrets:
```bash
CASK_NFT_CONTRACT_ADDRESS=<deployed_address>
MARKETPLACE_CONTRACT_ADDRESS=<deployed_address>
PLATFORM_WALLET_ADDRESS=<wallet_address>
```
3. Copy compiled ABIs from `artifacts/`

## Contract ABIs

After compilation, ABIs are available in:
```text
artifacts/contracts/CaskNFT.sol/CaskNFT.json
artifacts/contracts/CaskMarketplace.sol/CaskMarketplace.json
```

## Testing

Run contract tests:
```bash
npm test
```

## Security Notes

1. Never commit real private keys
2. Use a dedicated deployer wallet
3. Audit contracts before mainnet deployment
4. Test thoroughly on Amoy before mainnet

## Support

For issues or questions, contact the development team or open an issue in the repository.

## License

MIT License - See LICENSE file for details.
