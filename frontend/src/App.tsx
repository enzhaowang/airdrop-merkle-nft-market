import { useState } from "react";
import { BACKEND_URL, MARKET_ADDRESS, TOKEN_ADDRESS } from "./config";
import { useWeb3 } from "./hooks/useWeb3";
import {
  createPublicClient,
  encodeFunctionData,
  http,
  parseAbi,
  parseUnits,
} from "viem";
import { sepolia } from "viem/chains";

/// ABI fragment for the market contract (only the functions we need).
const marketAbi = parseAbi([
  "function multicall(bytes[] data) payable returns (bytes[] results)",
  "function permitPrePay(uint256 value,uint256 deadline,uint8 v,bytes32 r,bytes32 s)",
  "function claimNFT(uint256 listingId,bytes32[] merkleProof)"
]);

/// ABI fragment for the token contract (only the functions we need for permit).
const tokenAbi = parseAbi([
  "function nonces(address owner) view returns (uint256)",
  "function name() view returns (string)"
]);

function App() {
  const { account, walletClient } = useWeb3();
  const [status, setStatus] = useState<string>("");

  /// Main handler to perform the discounted purchase flow:
  ///  1. Fetch Merkle proof from backend
  ///  2. Build EIP-2612 permit typed data and sign it with MetaMask
  ///  3. Encode permitPrePay + claimNFT into one multicall
  ///  4. Send the transaction via viem wallet client
  const handleBuy = async () => {
    if (!account || !walletClient) {
      setStatus("Please connect your wallet first.");
      return;
    }

    try {
      // -------------------------------------------------
      // 1) Fetch Merkle proof from backend for this user
      // -------------------------------------------------
      setStatus("Fetching Merkle proof from backend...");

      const res = await fetch(`${BACKEND_URL}/proof/${account}`);
      if (!res.ok) {
        setStatus("You are not in the whitelist or backend returned an error.");
        return;
      }

      const { proof } = await res.json();

      // Demo values: assuming listingId = 1 and full price = 100 MTK.
      // In a real dApp you would fetch listing data from an API or from chain.
      const listingId = 1n;
      const fullPrice = parseUnits("100", 18); // 100 * 10^18 (assuming 18 decimals)
      const discountedPrice = fullPrice / 2n;  // Not strictly needed here, but good for clarity
      const permitValue = fullPrice;           // Approve at least the full price
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24); // +1 day

      // -------------------------------------------------
      // 2) Build EIP-2612 typed data for permit
      // -------------------------------------------------
      const chain = sepolia;

      // Public client is used to read on-chain data (token name, nonce, etc.).
      const publicClient = createPublicClient({
        chain,
        transport: http()
      });

      const [tokenName, nonce, chainId] = await Promise.all([
        publicClient.readContract({
          address: TOKEN_ADDRESS as `0x${string}`,
          abi: tokenAbi,
          functionName: "name"
        }),
        publicClient.readContract({
          address: TOKEN_ADDRESS as `0x${string}`,
          abi: tokenAbi,
          functionName: "nonces",
          args: [account]
        }),
        walletClient.getChainId()
      ]);

      // EIP-712 domain for the EIP-2612 permit. This must match the
      // parameters used by the ERC20Permit implementation in the token.
      const domain = {
        name: tokenName as string,
        version: "1",
        chainId,
        verifyingContract: TOKEN_ADDRESS as `0x${string}`
      };

      // EIP-2612 typed data definition.
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      } as const;

      // The actual Permit message that the user will sign.
      const message = {
        owner: account,
        spender: MARKET_ADDRESS as `0x${string}`,
        value: permitValue,
        nonce,
        deadline
      };

      setStatus("Please sign the permit message in your wallet...");

      // Ask the wallet (MetaMask) to sign the typed data using EIP-712.
      const signature = await walletClient.signTypedData({
        account,
        domain,
        types,
        primaryType: "Permit",
        message
      });

      // -------------------------------------------------
      // 3) Split signature into v, r, s for the permitPrePay() call
      // -------------------------------------------------
      const sig = signature.slice(2); // remove "0x"
      const r = `0x${sig.slice(0, 64)}` as `0x${string}`;
      const s = `0x${sig.slice(64, 128)}` as `0x${string}`;
      const v = parseInt(sig.slice(128, 130), 16);

      // -------------------------------------------------
      // 4) Encode permitPrePay and claimNFT, then wrap into multicall
      // -------------------------------------------------
      // Encode the permitPrePay call
      const permitData = encodeFunctionData({
        abi: marketAbi,
        functionName: "permitPrePay",
        args: [permitValue, deadline, Number(v), r, s]
      });

      // Encode the claimNFT call
      const claimData = encodeFunctionData({
        abi: marketAbi,
        functionName: "claimNFT",
        args: [listingId, proof as `0x${string}`[]]
      });

      setStatus(
        `Sending multicall transaction...
(Full price: 100 MTK, you will actually pay 50 MTK if whitelisted.)`
      );

      // Send a single transaction that calls multicall([permitData, claimData])
      const txHash = await walletClient.writeContract({
        address: MARKET_ADDRESS as `0x${string}`,
        abi: marketAbi,
        functionName: "multicall",
        args: [[permitData, claimData]],
        account,
        chain
      });

      setStatus(`Transaction sent: ${txHash}`);
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error?.message ?? String(error)}`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      <h1>Airdrop Merkle NFT Market</h1>

      <p>
        Connected address:{" "}
        <strong>{account ?? "Not connected (open MetaMask and refresh)"}</strong>
      </p>

      <button
        onClick={handleBuy}
        disabled={!account}
        style={{
          padding: "10px 16px",
          fontSize: "16px",
          cursor: account ? "pointer" : "not-allowed",
          marginTop: "12px"
        }}
      >
        Buy NFT with 50% discount (whitelist only)
      </button>

      <p style={{ marginTop: "16px", whiteSpace: "pre-line" }}>{status}</p>

      <hr style={{ margin: "24px 0" }} />

      <h2>How this demo works</h2>
      <ul>
        <li>The backend exposes a Merkle whitelist and proofs.</li>
        <li>
          The frontend fetches a Merkle proof for your address from{" "}
          <code>/proof/:address</code>.
        </li>
        <li>
          You sign an EIP-2612 permit so the market can spend your tokens.
        </li>
        <li>
          The market contract verifies the whitelist and uses multicall +
          delegatecall to perform both permit + purchase in a single
          transaction.
        </li>
      </ul>
    </div>
  );
}

export default App;
