// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MyToken.sol";
import "../src/MyNFT.sol";
import "../src/AirdropMerkleNFTMarket.sol";

/// @title AirdropMerkleNFTMarketTest
/// @notice Tests the full flow:
///   - Merkle whitelist with a single whitelisted buyer
///   - permit signature (EIP-2612)
///   - multicall(delegatecall) calling permitPrePay + claimNFT in one tx
contract AirdropMerkleNFTMarketTest is Test {
    MyToken token;
    MyNFT nft;
    AirdropMerkleNFTMarket market;

    address seller;
    uint256 sellerPk;

    address buyer;
    uint256 buyerPk;

    bytes32 merkleRoot;
    bytes32[] buyerProof; // single-leaf tree => empty proof

    function setUp() public {
        // Create two deterministic addresses for seller and buyer using private keys
        sellerPk = 0x1234;
        seller = vm.addr(sellerPk);
        buyerPk = 0x5678;
        buyer = vm.addr(buyerPk);

        // Deploy the token and NFT contracts
        token = new MyToken();
        nft = new MyNFT();

        // Mint some tokens to the buyer so he can pay
        token.mint(buyer, 1_000 ether);

        // Build a very simple Merkle tree with a single whitelisted address: buyer
        // leaf = keccak256(abi.encodePacked(buyer))
        bytes32 leaf = keccak256(abi.encodePacked(buyer));
        merkleRoot = leaf;
        delete buyerProof; // For a single-leaf tree, the proof is an empty array.

        // Deploy the market with the computed Merkle root
        market = new AirdropMerkleNFTMarket(address(token), address(nft), merkleRoot);

        // Mint an NFT to the seller and list it on the market
        vm.prank(nft.owner());
        uint256 tokenId = nft.mint(seller);

        vm.startPrank(seller);
        nft.approve(address(market), tokenId);
        market.list(tokenId, 100 ether); // full price = 100 MTK
        vm.stopPrank();
    }

    function testBuyWithPermitAndMulticall() public {
        uint256 listingId = 1;
        uint256 value = 100 ether; // allowance for the market
        uint256 deadline = block.timestamp + 1 days;

        // ---------------------------------------------------------------------
        // 1) Build the EIP-2612 permit digest and sign it with buyer's key
        // ---------------------------------------------------------------------

        bytes32 DOMAIN_SEPARATOR = token.DOMAIN_SEPARATOR();
        uint256 nonce = token.nonces(buyer);

        // This struct hash mirrors the EIP-2612 Permit type used by OpenZeppelin
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
                ),
                buyer,
                address(market),
                value,
                nonce,
                deadline
            )
        );

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(buyerPk, digest);

        // ---------------------------------------------------------------------
        // 2) Encode calls for permitPrePay() and claimNFT() and pack into multicall()
        // ---------------------------------------------------------------------

        bytes[] memory data = new bytes[](2);

        data[0] = abi.encodeWithSelector(
            market.permitPrePay.selector,
            value,
            deadline,
            v,
            r,
            s
        );

        data[1] = abi.encodeWithSelector(
            market.claimNFT.selector,
            listingId,
            buyerProof
        );

        // ---------------------------------------------------------------------
        // 3) Call multicall() from the buyer address
        // ---------------------------------------------------------------------

        vm.startPrank(buyer);
        uint256 buyerBalanceBefore = token.balanceOf(buyer);
        market.multicall(data);
        vm.stopPrank();

        // ---------------------------------------------------------------------
        // 4) Verify results: buyer owns NFT and paid only 50% of the full price
        // ---------------------------------------------------------------------

        uint256 buyerBalanceAfter = token.balanceOf(buyer);
        // Discounted price is 100 / 2 = 50
        assertEq(
            buyerBalanceBefore - buyerBalanceAfter,
            50 ether,
            "buyer should spend 50 MTK"
        );
        assertEq(nft.ownerOf(1), buyer, "buyer should own the NFT");
    }
}
