// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {AirdropMerkleNFTMarketUpgradeable} from "../src/AirdropMerkleNFTMarketUpgradeable.sol";
import {ERC1967Proxy} from "openzeppelin-contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract AirdropMerkleNFTMarketUpgradeableDeploy is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address token = 0xA3753E6fE53fa9565e3704ed4A0286842ff00f6d;
        address nft = 0x9EE394a0282c23f97bc66d0e327bc0CbFbA4C03F;
        bytes32 merkleRoot = 0x3fd552bb2fcf5472643f1a82d9844b4c20207d68f9718727d6ecee2e5c59656f;

        // 1. Deploy Implementation
        AirdropMerkleNFTMarketUpgradeable implementation = new AirdropMerkleNFTMarketUpgradeable();

        // 2. Encode initialization data
        bytes memory initData = abi.encodeCall(
            AirdropMerkleNFTMarketUpgradeable.initialize,
            (token, nft, merkleRoot)
        );

        // 3. Deploy Proxy
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);

        vm.stopBroadcast();
    }
}
