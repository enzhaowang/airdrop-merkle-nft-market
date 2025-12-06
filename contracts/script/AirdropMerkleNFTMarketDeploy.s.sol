// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {AirdropMerkleNFTMarket} from "../src/AirdropMerkleNFTMarket.sol";

contract AirdropMerkleNFTMarketDeploy is Script {
    function run() public {
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        new AirdropMerkleNFTMarket(0xA3753E6fE53fa9565e3704ed4A0286842ff00f6d, 0x9EE394a0282c23f97bc66d0e327bc0CbFbA4C03F, 0x3fd552bb2fcf5472643f1a82d9844b4c20207d68f9718727d6ecee2e5c59656f);
        vm.stopBroadcast();
    }
}
