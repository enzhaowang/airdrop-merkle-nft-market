import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

/// Build a Merkle tree using keccak256(address) as leaf.
/// In Solidity we use keccak256(abi.encodePacked(address)), which matches
/// keccak256 of the 20-byte address.
export function buildWhitelistTree(addresses: string[]) {
  // Normalize all addresses to lowercase to avoid case issues
  const normalized = addresses.map((addr) => addr.toLowerCase());

  const leaves = normalized.map((addr) => keccak256(addr));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  const root = tree.getHexRoot();

  return {
    tree,
    root,
    /// Get the hex Merkle proof for a specific address
    getProof: (address: string) => {
      const leaf = keccak256(address.toLowerCase());
      const proof = tree.getHexProof(leaf);
      return proof;
    },
  };
}
