-- Clear fake blockchain data from cask 25f6b0f8 so it can be properly re-minted
UPDATE casks
SET blockchain_hash = NULL,
    nft_token_id = NULL,
    nft_contract_address = NULL,
    nft_minted_at = NULL
WHERE id = '25f6b0f8-5683-487c-8bc8-19a60c8e6c0f'
  AND blockchain_hash = '0xspg06000000000000000000000000000000000000';