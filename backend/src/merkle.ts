import { MerkleTree } from "merkletreejs";
import { toHex, encodePacked, keccak256 } from 'viem';

/// Build a Merkle tree using keccak256(address) as leaf.
/// In Solidity we use keccak256(abi.encodePacked(address)), which matches
/// keccak256 of the 20-byte address.
export function buildWhitelistTree(addresses: string[]) {
  // Normalize all addresses to lowercase to avoid case issues
  const leaves = addresses.map((addr) => keccak256(encodePacked(['address'],[addr as `0x${string}`])));

  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  const root = tree.getHexRoot();

  return {
    tree,
    root,
    /// Get the hex Merkle proof for a specific address
    getProof: (address: string) => {
      const leaf = keccak256(encodePacked(['address'],[address as `0x${string}`]));
      const proof = tree.getHexProof(leaf);
      return proof;
    },
  };
}
