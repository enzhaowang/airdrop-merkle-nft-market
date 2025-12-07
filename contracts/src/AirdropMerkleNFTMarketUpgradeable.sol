// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "openzeppelin-contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "openzeppelin-contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/utils/ReentrancyGuard.sol";
import {UUPSUpgradeable} from "openzeppelin-contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {MerkleProof} from "openzeppelin-contracts/utils/cryptography/MerkleProof.sol";
import {IERC721} from "openzeppelin-contracts/token/ERC721/IERC721.sol";

/// @notice Minimal interface for an ERC20 token supporting EIP-2612 permit.
interface IPermitERC20 {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);
}

/// @title AirdropMerkleNFTMarketUpgradeable
/// @notice Upgradeable NFT marketplace with:
///  - Merkle-tree based whitelist
///  - 50% discount for whitelisted addresses
///  - Single-transaction purchase using permit + multicall (delegatecall)
contract AirdropMerkleNFTMarketUpgradeable is Initializable, OwnableUpgradeable, ReentrancyGuard, UUPSUpgradeable {
    /// @notice Listing info for a single NFT listing.
    struct Listing {
        address seller; // original NFT owner who wants to sell
        uint256 tokenId; // NFT id
        uint256 price; // full price in payment token (before discount)
        bool active; // whether the listing is still available
    }

    /// @notice ERC20 payment token (supports EIP-2612 permit).
    IPermitERC20 public token;

    /// @notice NFT contract traded on this market.
    IERC721 public nft;

    /// @notice Merkle root representing the whitelist of addresses.
    /// leaf = keccak256(abi.encodePacked(address))
    bytes32 public merkleRoot;

    /// @notice Auto-incremental id for new listings.
    uint256 public nextListingId;

    /// @notice Mapping from listing id to Listing struct.
    mapping(uint256 => Listing) public listings;

    /// @notice Optional: track addresses that have already claimed the discount.
    /// If you want "one discounted purchase per address", uncomment related checks.
    mapping(address => bool) public hasClaimed;

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 tokenId,
        uint256 price
    );

    event Purchased(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 discountedPrice
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the contract.
    /// @param _token Address of the ERC20 payment token.
    /// @param _nft Address of the ERC721 NFT contract.
    /// @param _merkleRoot Initial Merkle root for the whitelist.
    function initialize(
        address _token,
        address _nft,
        bytes32 _merkleRoot
    ) public initializer {
        __Ownable_init(msg.sender);


        token = IPermitERC20(_token);
        nft = IERC721(_nft);
        merkleRoot = _merkleRoot;
    }

    /// @notice Update the Merkle root for the whitelist.
    /// @dev Only the owner can update the root. This allows running the campaign in multiple phases.
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    /// @notice List an NFT for sale at a full price.
    /// @dev The NFT is transferred into the market contract (escrow).
    /// @param tokenId NFT id to be listed.
    /// @param price Full price in payment token.
    /// @return listingId Id of the created listing.
    function list(uint256 tokenId, uint256 price) external returns (uint256 listingId) {
        require(price > 0, "price = 0");
        require(nft.ownerOf(tokenId) == msg.sender, "not owner");

        // Transfer the NFT from seller to the market as escrow
        nft.transferFrom(msg.sender, address(this), tokenId);

        listingId = ++nextListingId;
        listings[listingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            active: true
        });

        emit Listed(listingId, msg.sender, tokenId, price);
    }

    // -------------------------------------------------------------------------
    // Permit + Claim flow (both will be called via multicall with delegatecall)
    // -------------------------------------------------------------------------

    /// @notice Perform EIP-2612 permit for this contract as spender.
    /// @dev This function only calls token.permit so we can later pull tokens
    ///      from the buyer within the same transaction.
    /// @param value Allowance amount approved for the market contract.
    /// @param deadline Permit expiration timestamp.
    /// @param v ECDSA v value from the signature.
    /// @param r ECDSA r value from the signature.
    /// @param s ECDSA s value from the signature.
    function permitPrePay(
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        // owner is msg.sender (the buyer), spender is this market contract
        token.permit(msg.sender, address(this), value, deadline, v, r, s);
    }

    /// @notice Claim an NFT at 50% discount if the caller is whitelisted.
    /// @dev Requires:
    ///   - valid Merkle proof for msg.sender
    ///   - valid token allowance from permitPrePay() (or any prior approval)
    /// @param listingId The id of the listing to purchase.
    /// @param merkleProof The Merkle proof to verify whitelist membership.
    function claimNFT(
        uint256 listingId,
        bytes32[] calldata merkleProof
    ) external nonReentrant {
        Listing memory listing = listings[listingId];
        require(listing.active, "not active");

        // Verify that msg.sender is in the whitelist via Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(merkleProof, merkleRoot, leaf),
            "not whitelisted"
        );

        // If you want one discounted purchase per address, uncomment this block:
        // require(!hasClaimed[msg.sender], "already claimed");
        // hasClaimed[msg.sender] = true;

        // 50% discount: buyer pays half of the full price
        uint256 discountedPrice = listing.price / 2;

        // Pull payment tokens from buyer to seller
        bool ok = token.transferFrom(msg.sender, listing.seller, discountedPrice);
        require(ok, "token transfer failed");

        // Transfer NFT from market to buyer
        nft.safeTransferFrom(address(this), msg.sender, listing.tokenId);

        // Mark listing as inactive
        listings[listingId].active = false;

        emit Purchased(listingId, msg.sender, discountedPrice);
    }

    // -------------------------------------------------------------------------
    // Multicall (delegatecall-based)
    // -------------------------------------------------------------------------

    /// @notice Execute multiple function calls in a single transaction using delegatecall.
    /// @dev This is used to call `permitPrePay()` and `claimNFT()` in one go.
    /// @param data An array of encoded function calls.
    /// @return results An array containing the returned data from each call.
    function multicall(bytes[] calldata data) external payable returns (bytes[] memory results) {
        results = new bytes[](data.length);

        for (uint256 i = 0; i < data.length; i++) {
            // delegatecall keeps the same msg.sender and msg.value
            (bool success, bytes memory result) = address(this).delegatecall(data[i]);
            if (!success) {
                // Bubble up the revert reason from the inner call
                assembly {
                    revert(add(result, 32), mload(result))
                }
            }
            results[i] = result;
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
