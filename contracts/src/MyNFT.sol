// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "openzeppelin-contracts/token/ERC721/ERC721.sol";
import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";

/// @title MyNFT - Simple ERC721 collection
/// @notice The NFT that will be traded on the AirdropMerkleNFTMarket.
contract MyNFT is ERC721, Ownable {
    /// @notice Incremental token id counter.
    uint256 public nextId;

    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {}

    /// @notice Mint a new NFT to a given address.
    /// @dev Only the owner (e.g. the project admin) can mint.
    /// @param to The recipient of the newly minted NFT.
    /// @return tokenId The id of the minted token.
    function mint(address to) external onlyOwner returns (uint256 tokenId) {
        tokenId = ++nextId;
        _safeMint(to, tokenId);
    }
}
