// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "openzeppelin-contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "openzeppelin-contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";

/// @title MyToken - ERC20 token supporting EIP-2612 permit
/// @notice This token is used as the payment token in the NFT market.
contract MyToken is ERC20, ERC20Permit, Ownable {
    /// @notice Mint initial supply to the deployer.
    /// For demo purposes we just mint 1,000,000 tokens to the owner.
    constructor() ERC20("MyToken", "MTK") ERC20Permit("MyToken") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 ether);
    }

    /// @notice Optional mint function for the owner to mint additional tokens.
    /// @param to The address that will receive minted tokens.
    /// @param amount The amount of tokens to mint (in wei).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
