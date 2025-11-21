// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./CaskNFT.sol";

/**
 * @title CaskMarketplace
 * @dev Marketplace for buying and selling cask NFTs with automatic royalty distribution
 * Fee structure:
 * - Platform fee: 8.5%
 * - Distillery royalty on resales: 3%
 * - Seller receives: 88.5% (primary) or 85.5% (secondary)
 */
contract CaskMarketplace is ReentrancyGuard, Ownable {
    using Address for address payable;
    
    CaskNFT public caskNFT;
    
    // Fee percentages (basis points: 100 = 1%)
    uint256 public constant PLATFORM_FEE_BP = 850; // 8.5%
    uint256 public constant DISTILLERY_ROYALTY_BP = 300; // 3%
    uint256 public constant BASIS_POINTS = 10000; // 100%
    
    address payable public platformWallet;
    
    // Listing structure
    struct Listing {
        address seller;
        uint256 price;
        bool active;
        bool isPrimarySale;
    }
    
    // Mapping from token ID to listing
    mapping(uint256 => Listing) public listings;
    
    // Sales history
    struct Sale {
        uint256 tokenId;
        address seller;
        address buyer;
        uint256 price;
        uint256 timestamp;
        bool isPrimarySale;
    }
    
    Sale[] public salesHistory;
    
    // Events
    event Listed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        bool isPrimarySale
    );
    
    event Unlisted(uint256 indexed tokenId, address indexed seller);
    
    event Sold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 platformFee,
        uint256 distilleryRoyalty,
        bool isPrimarySale
    );
    
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);
    
    constructor(address _caskNFT, address payable _platformWallet) Ownable(msg.sender) {
        require(_caskNFT != address(0), "Marketplace: Invalid NFT contract");
        require(_platformWallet != address(0), "Marketplace: Invalid platform wallet");
        
        caskNFT = CaskNFT(_caskNFT);
        platformWallet = _platformWallet;
    }
    
    /**
     * @dev List a cask for sale
     * @param tokenId Token ID to list
     * @param price Price in wei
     * @param isPrimarySale Whether this is a primary sale from distillery
     */
    function listCask(
        uint256 tokenId,
        uint256 price,
        bool isPrimarySale
    ) external nonReentrant {
        require(caskNFT.ownerOf(tokenId) == msg.sender, "Marketplace: Not token owner");
        require(price > 0, "Marketplace: Price must be greater than zero");
        require(!listings[tokenId].active, "Marketplace: Already listed");
        
        // Transfer NFT to marketplace
        caskNFT.transferFrom(msg.sender, address(this), tokenId);
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true,
            isPrimarySale: isPrimarySale
        });
        
        emit Listed(tokenId, msg.sender, price, isPrimarySale);
    }
    
    /**
     * @dev Cancel a listing
     */
    function unlistCask(uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Marketplace: Not listed");
        require(listing.seller == msg.sender, "Marketplace: Not seller");
        
        // Return NFT to seller
        caskNFT.transferFrom(address(this), msg.sender, tokenId);
        
        delete listings[tokenId];
        
        emit Unlisted(tokenId, msg.sender);
    }
    
    /**
     * @dev Purchase a listed cask
     * @param tokenId Token ID to purchase
     */
    function purchaseCask(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Marketplace: Not listed");
        require(msg.value >= listing.price, "Marketplace: Insufficient payment");
        
        uint256 price = listing.price;
        address seller = listing.seller;
        bool isPrimary = listing.isPrimarySale;
        
        // Calculate fees
        uint256 platformFee = (price * PLATFORM_FEE_BP) / BASIS_POINTS;
        uint256 distilleryRoyalty = 0;
        uint256 sellerAmount = 0;
        
        if (isPrimary) {
            // Primary sale: Seller (distillery) gets 91.5%, platform gets 8.5%
            sellerAmount = price - platformFee;
        } else {
            // Secondary sale: Platform 8.5%, Distillery 3%, Seller 88.5%
            distilleryRoyalty = (price * DISTILLERY_ROYALTY_BP) / BASIS_POINTS;
            sellerAmount = price - platformFee - distilleryRoyalty;
        }
        
        // Transfer NFT to buyer
        caskNFT.transferFrom(address(this), msg.sender, tokenId);
        
        // Transfer payments
        platformWallet.sendValue(platformFee);
        payable(seller).sendValue(sellerAmount);
        
        // Pay distillery royalty if secondary sale
        if (!isPrimary && distilleryRoyalty > 0) {
            address distillery = caskNFT.getDistillery(tokenId);
            require(distillery != address(0), "Marketplace: Invalid distillery");
            payable(distillery).sendValue(distilleryRoyalty);
        }
        
        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).sendValue(msg.value - price);
        }
        
        // Record sale
        salesHistory.push(Sale({
            tokenId: tokenId,
            seller: seller,
            buyer: msg.sender,
            price: price,
            timestamp: block.timestamp,
            isPrimarySale: isPrimary
        }));
        
        // Remove listing
        delete listings[tokenId];
        
        emit Sold(tokenId, seller, msg.sender, price, platformFee, distilleryRoyalty, isPrimary);
    }
    
    /**
     * @dev Update platform wallet
     */
    function updatePlatformWallet(address payable _platformWallet) external onlyOwner {
        require(_platformWallet != address(0), "Marketplace: Invalid wallet");
        address oldWallet = platformWallet;
        platformWallet = _platformWallet;
        emit PlatformWalletUpdated(oldWallet, _platformWallet);
    }
    
    /**
     * @dev Get listing details
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }
    
    /**
     * @dev Get sales history count
     */
    function getSalesCount() external view returns (uint256) {
        return salesHistory.length;
    }
    
    /**
     * @dev Get sale details
     */
    function getSale(uint256 index) external view returns (Sale memory) {
        require(index < salesHistory.length, "Marketplace: Invalid index");
        return salesHistory[index];
    }
    
    /**
     * @dev Calculate fees for a price
     */
    function calculateFees(uint256 price, bool isPrimarySale) 
        external 
        pure 
        returns (uint256 platformFee, uint256 distilleryRoyalty, uint256 sellerAmount) 
    {
        platformFee = (price * PLATFORM_FEE_BP) / BASIS_POINTS;
        
        if (isPrimarySale) {
            distilleryRoyalty = 0;
            sellerAmount = price - platformFee;
        } else {
            distilleryRoyalty = (price * DISTILLERY_ROYALTY_BP) / BASIS_POINTS;
            sellerAmount = price - platformFee - distilleryRoyalty;
        }
        
        return (platformFee, distilleryRoyalty, sellerAmount);
    }
}
