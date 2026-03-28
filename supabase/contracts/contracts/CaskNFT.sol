// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CaskNFT
 * @dev ERC-721 token representing ownership of whisky casks
 * Each cask is a unique NFT with metadata stored on IPFS
 */
contract CaskNFT is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Mapping from cask ID (UUID) to token ID
    mapping(string => uint256) public caskIdToTokenId;
    
    // Mapping from token ID to cask ID
    mapping(uint256 => string) public tokenIdToCaskId;
    
    // Mapping from token ID to distillery address
    mapping(uint256 => address) public tokenIdToDistillery;
    
    // Cask metadata structure
    struct CaskMetadata {
        string caskId;
        address distillery;
        string spiritName;
        string caskNumber;
        uint256 volumeLiters;
        uint256 alcoholPercentage;
        uint256 distillationDate;
        uint256 mintedAt;
        // Rarity attributes
        uint8 ageYears;
        uint8 rarityTier; // 1=Common, 2=Uncommon, 3=Rare, 4=Epic, 5=Legendary
        string caskType; // Ex-Bourbon, Sherry, Port, etc.
        string specialFinish; // Sauternes Finish, Rum Cask, etc.
        string region; // Speyside, Islay, Highland, etc.
        bool isSingleBarrel;
        bool exists;
    }
    
    // Mapping from token ID to cask metadata
    mapping(uint256 => CaskMetadata) public caskMetadata;
    
    // Events
    event CaskMinted(
        uint256 indexed tokenId,
        string caskId,
        address indexed distillery,
        address indexed owner,
        string spiritName,
        string caskNumber,
        uint8 rarityTier
    );
    
    event CaskTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 price
    );
    
    constructor() ERC721("Angel Share Cask", "ASCASK") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new cask NFT
     * @param to Address to mint the NFT to
     * @param caskId Unique cask identifier from database
     * @param distillery Address of the distillery
     * @param spiritName Name of the spirit
     * @param caskNumber Cask number
     * @param volumeLiters Volume in liters
     * @param alcoholPercentage Alcohol percentage (scaled by 100, e.g., 6350 = 63.5%)
     * @param distillationDate Unix timestamp of distillation
     * @param ageYears Current age in years
     * @param rarityTier Rarity tier (1-5)
     * @param caskType Type of cask
     * @param specialFinish Special finishing info
     * @param region Production region
     * @param isSingleBarrel Whether this is single barrel
     * @param tokenURI IPFS URI for metadata
     */
    function mintCask(
        address to,
        string memory caskId,
        address distillery,
        string memory spiritName,
        string memory caskNumber,
        uint256 volumeLiters,
        uint256 alcoholPercentage,
        uint256 distillationDate,
        uint8 ageYears,
        uint8 rarityTier,
        string memory caskType,
        string memory specialFinish,
        string memory region,
        bool isSingleBarrel,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        require(bytes(caskId).length > 0, "CaskNFT: Cask ID cannot be empty");
        require(caskIdToTokenId[caskId] == 0, "CaskNFT: Cask already minted");
        require(to != address(0), "CaskNFT: Cannot mint to zero address");
        require(distillery != address(0), "CaskNFT: Invalid distillery address");
        require(rarityTier >= 1 && rarityTier <= 5, "CaskNFT: Invalid rarity tier");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Store mappings
        caskIdToTokenId[caskId] = tokenId;
        tokenIdToCaskId[tokenId] = caskId;
        tokenIdToDistillery[tokenId] = distillery;
        
        // Store metadata
        caskMetadata[tokenId] = CaskMetadata({
            caskId: caskId,
            distillery: distillery,
            spiritName: spiritName,
            caskNumber: caskNumber,
            volumeLiters: volumeLiters,
            alcoholPercentage: alcoholPercentage,
            distillationDate: distillationDate,
            mintedAt: block.timestamp,
            ageYears: ageYears,
            rarityTier: rarityTier,
            caskType: caskType,
            specialFinish: specialFinish,
            region: region,
            isSingleBarrel: isSingleBarrel,
            exists: true
        });
        
        emit CaskMinted(tokenId, caskId, distillery, to, spiritName, caskNumber, rarityTier);
        
        return tokenId;
    }
    
    /**
     * @dev Get token ID for a cask ID
     */
    function getTokenIdByCaskId(string memory caskId) public view returns (uint256) {
        uint256 tokenId = caskIdToTokenId[caskId];
        require(tokenId != 0 || _ownerOf(0) != address(0), "CaskNFT: Cask not minted");
        return tokenId;
    }
    
    /**
     * @dev Get cask metadata
     */
    function getCaskMetadata(uint256 tokenId) public view returns (CaskMetadata memory) {
        require(caskMetadata[tokenId].exists, "CaskNFT: Token does not exist");
        return caskMetadata[tokenId];
    }
    
    /**
     * @dev Get distillery for a token
     */
    function getDistillery(uint256 tokenId) public view returns (address) {
        return tokenIdToDistillery[tokenId];
    }
    
    /**
     * @dev Override transfer to emit custom event with price
     */
    function safeTransferFromWithPrice(
        address from,
        address to,
        uint256 tokenId,
        uint256 price
    ) public {
        safeTransferFrom(from, to, tokenId);
        emit CaskTransferred(tokenId, from, to, price);
    }
    
    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
