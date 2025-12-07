// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AirdropMerkleNFTMarketUpgradeable} from "../src/AirdropMerkleNFTMarketUpgradeable.sol";
import {ERC1967Proxy} from "openzeppelin-contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {MyToken} from "../src/MyToken.sol";
import {MyNFT} from "../src/MyNFT.sol";
import {MerkleProof} from "openzeppelin-contracts/utils/cryptography/MerkleProof.sol";

// Mock V2 contract for upgrade testing
contract AirdropMerkleNFTMarketUpgradeableV2 is AirdropMerkleNFTMarketUpgradeable {
    function version() public pure returns (string memory) {
        return "V2";
    }
}

contract AirdropMerkleNFTMarketUpgradeableTest is Test {
    AirdropMerkleNFTMarketUpgradeable public market;
    AirdropMerkleNFTMarketUpgradeable public implementation;
    ERC1967Proxy public proxy;
    MyToken public token;
    MyNFT public nft;

    address public owner;
    address public user1;
    address public user2;

    bytes32 public merkleRoot;
    bytes32[] public proof;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy Token and NFT
        token = new MyToken();
        nft = new MyNFT();

        // Setup Merkle Root
        // We will just whitelist user1 for simplicity
        bytes32 leaf = keccak256(abi.encodePacked(user1));
        merkleRoot = leaf; // Simplified for single leaf tree: root == leaf
        
        // Deploy Implementation
        implementation = new AirdropMerkleNFTMarketUpgradeable();

        // Encode init data
        bytes memory initData = abi.encodeCall(
            AirdropMerkleNFTMarketUpgradeable.initialize,
            (address(token), address(nft), merkleRoot)
        );

        // Deploy Proxy
        proxy = new ERC1967Proxy(address(implementation), initData);

        // Cast proxy to interface
        market = AirdropMerkleNFTMarketUpgradeable(address(proxy));

        // Setup tokens
        token.mint(user1, 1000 ether);
        nft.mint(owner); // Mint tokenId 1 to owner
        nft.approve(address(market), 1);
    }

    function test_Initialize() public view {
        assertEq(address(market.token()), address(token));
        assertEq(address(market.nft()), address(nft));
        assertEq(market.owner(), owner);
    }

    function test_Upgrade() public {
        // Deploy V2
        AirdropMerkleNFTMarketUpgradeableV2 implementationV2 = new AirdropMerkleNFTMarketUpgradeableV2();

        // Upgrade
        market.upgradeToAndCall(address(implementationV2), "");

        // Verify Upgrade
        AirdropMerkleNFTMarketUpgradeableV2 marketV2 = AirdropMerkleNFTMarketUpgradeableV2(address(market));
        assertEq(marketV2.version(), "V2");
        
        // Verify State Preserved
        assertEq(address(market.token()), address(token));
    }

    function test_ListAndBuy() public {
        // 1. List
        market.list(1, 100 ether);
        (address seller, uint256 tokenId, uint256 price, bool active) = market.listings(1);
        assertEq(seller, owner);
        assertEq(tokenId, 1);
        assertEq(price, 100 ether);
        assertEq(active, true);

        // 2. Buy
        vm.startPrank(user1);
        token.approve(address(market), 50 ether); // 50% discount
        
        bytes32[] memory emptyProof = new bytes32[](0);
        
        market.claimNFT(1, emptyProof);
        
        vm.stopPrank();

        // Verify purchase
        assertEq(nft.ownerOf(1), user1);
        (, , , bool activeAfter) = market.listings(1);
        assertEq(activeAfter, false);
    }
}
