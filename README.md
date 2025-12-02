# AirdropMerkle NFT Market

A full-stack Web3 application implementing a discounted NFT marketplace with  
**Merkle whitelist verification**, **EIP-2612 permit**, and **single-transaction multicall** purchase flow.

This project includes smart contracts, backend Merkle tree generation, and a complete React frontend.

---

## Tech Stack

- **Solidity + Foundry** — contracts, tests, deployment  
- **ERC20 Permit + ERC721** — OpenZeppelin based  
- **Merkle Tree** — whitelist validation  
- **Multicall (delegatecall)** — permit + purchase in one transaction  
- **Node.js + TypeScript** — backend API for Merkle root & proofs  
- **React + TypeScript + Vite (Rolldown) + viem** — frontend dApp  

---

## Project Structure

airdrop-merkle-nft-market/
├── contracts/ # Foundry contracts and tests
├── backend/ # Merkle tree & proof API
└── frontend/ # React dApp using viem



---

## Run Locally

### Contracts (Foundry)
```bash
cd contracts
forge install
forge test
```

### Backend (Merkle API)
```bash
cd backend
npm install
npm run dev
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

Overview

- Backend generates a Merkle root and proofs for whitelisted addresses.

- Users sign an EIP-2612 permit instead of sending an approval transaction.

- The marketplace contract performs permit + claim using a single multicall.

- Whitelisted users receive a 50% discount when purchasing NFTs.

This project demonstrates end-to-end Web3 development across smart contracts, backend infrastructure, and a production-ready frontend.
