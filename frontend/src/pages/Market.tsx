import { useState, useMemo } from "react";
import { BACKEND_URL, MARKET_ADDRESS, TOKEN_ADDRESS } from "../config";
import { encodeFunctionData, parseUnits, formatUnits } from "viem";
import { useAccount, useSignTypedData, useWriteContract, useReadContract, useReadContracts } from 'wagmi';
import MarketABI from "../../contracts/AirdropMerkleNFTMarket.json";
import MyTokenABI from "../../contracts/MyToken.json";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function Market() {
  const { address: account, chain } = useAccount();
  const [status, setStatus] = useState<string>("");
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();

  // State for forms
  const [listTokenId, setListTokenId] = useState("");
  const [listPrice, setListPrice] = useState("");

  // ----------------------------------------------------------------
  // READS
  // ----------------------------------------------------------------

  // 2. Market nextListingId
  const { data: nextListingId, refetch: refetchNextListingId } = useReadContract({
    address: MARKET_ADDRESS as `0x${string}`,
    abi: MarketABI,
    functionName: "nextListingId",
  });

  // 3. Fetch all listings
  const listingCalls = useMemo(() => {
    if (!nextListingId) return [];
    const count = Number(nextListingId);
    const calls = [];
    for (let i = 1; i <= count; i++) {
      calls.push({
        address: MARKET_ADDRESS as `0x${string}`,
        abi: MarketABI as any,
        functionName: "listings",
        args: [BigInt(i)],
      });
    }
    return calls;
  }, [nextListingId]);

  const { data: listingsData, refetch: refetchListings } = useReadContracts({
    contracts: listingCalls,
    query: {
      enabled: listingCalls.length > 0,
    }
  });

  // Token Name & Nonce (for Permit)
  const { data: tokenName } = useReadContract({
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: MyTokenABI,
    functionName: "name",
  });

  const { refetch: refetchNonce } = useReadContract({
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: MyTokenABI,
    functionName: "nonces",
    args: account ? [account] : undefined,
    query: {
      enabled: !!account,
    }
  });

  // ----------------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------------

  // --- Market: List ---
  const handleList = async () => {
    if (!account || !listTokenId || !listPrice) return;
    try {
      setStatus("Listing NFT...");
      const hash = await writeContractAsync({
        address: MARKET_ADDRESS as `0x${string}`,
        abi: MarketABI,
        functionName: "list",
        args: [BigInt(listTokenId), parseUnits(listPrice, 18)],
      });
      setStatus(`Listing successful: ${hash}`);
      refetchNextListingId();
      refetchListings();
    } catch (e: any) {
      console.error(e);
      setStatus(`Listing failed: ${e.message}`);
    }
  };

  // --- Market: Buy (Permit + Claim) ---
  const handleBuy = async (listingId: bigint, price: bigint) => {
    if (!account) {
      setStatus("Please connect your wallet first.");
      return;
    }

    try {
      // 1) Fetch Merkle proof
      setStatus("Fetching Merkle proof from backend...");
      const res = await fetch(`${BACKEND_URL}/proof/${account}`);
      if (!res.ok) {
        setStatus("You are not in the whitelist or backend returned an error.");
        return;
      }
      const { proof } = await res.json();

      // 2) Sign Permit
      const permitValue = price; // Approve full price
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24); // +1 day

      // Refetch nonce
      const { data: currentNonce } = await refetchNonce();
      
      const domain = {
        name: tokenName as string,
        version: "1",
        chainId: chain?.id,
        verifyingContract: TOKEN_ADDRESS as `0x${string}`
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      } as const;

      const message = {
        owner: account,
        spender: MARKET_ADDRESS as `0x${string}`,
        value: permitValue,
        nonce: (currentNonce as bigint) ?? 0n,
        deadline
      };

      setStatus("Please sign the permit message...");
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: "Permit",
        message
      });

      const sig = signature.slice(2);
      const r = `0x${sig.slice(0, 64)}` as `0x${string}`;
      const s = `0x${sig.slice(64, 128)}` as `0x${string}`;
      const v = parseInt(sig.slice(128, 130), 16);

      // 3) Multicall
      const permitData = encodeFunctionData({
        abi: MarketABI,
        functionName: "permitPrePay",
        args: [permitValue, deadline, Number(v), r, s]
      });

      const claimData = encodeFunctionData({
        abi: MarketABI,
        functionName: "claimNFT",
        args: [listingId, proof as `0x${string}`[]]
      });

      setStatus("Sending multicall transaction...");
      const txHash = await writeContractAsync({
        address: MARKET_ADDRESS as `0x${string}`,
        abi: MarketABI,
        functionName: "multicall",
        args: [[permitData, claimData]],
      });

      setStatus(`Purchase successful: ${txHash}`);
      refetchListings();
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error?.message ?? String(error)}`);
    }
  };

  return (
    <div className="space-y-8">
      {status && (
        <div className="bg-wagmi-card border border-wagmi-border p-4 rounded-lg text-sm font-mono break-all">
          <span className="text-wagmi-primary font-bold">Status:</span> {status}
        </div>
      )}

      {/* List NFT Section */}
      <Card title="List NFT for Sale">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            label="Token ID"
            placeholder="e.g. 1"
            value={listTokenId}
            onChange={(e) => setListTokenId(e.target.value)}
          />
          <Input
            label="Price (MTK)"
            placeholder="e.g. 100"
            value={listPrice}
            onChange={(e) => setListPrice(e.target.value)}
          />
          <Button onClick={handleList} disabled={!account || !listTokenId || !listPrice}>
            List NFT
          </Button>
        </div>
      </Card>

      {/* Active Listings Section */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-6">Active Listings</h2>
        {!listingsData || listingsData.length === 0 ? (
          <p className="text-wagmi-text-muted">No listings found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listingsData.map((item, index) => {
              const listingId = BigInt(index + 1);
              if (item.status !== "success" || !item.result) return null;
              
              const [seller, tokenId, price, active] = item.result as [string, bigint, bigint, boolean];
              
              if (!active) return null;

              return (
                <Card key={listingId.toString()} className="hover:border-wagmi-border/80 transition-colors">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-wagmi-text-muted">Listing #{listingId.toString()}</p>
                        <h3 className="text-xl font-bold text-white mt-1">Token ID: {tokenId.toString()}</h3>
                      </div>
                      <div className="bg-wagmi-bg px-3 py-1 rounded-full border border-wagmi-border">
                        <span className="text-wagmi-primary font-medium">{formatUnits(price, 18)} MTK</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-wagmi-text-muted mb-1">Seller</p>
                      <p className="text-sm font-mono bg-wagmi-bg p-2 rounded truncate">{seller}</p>
                    </div>

                    <Button
                      onClick={() => handleBuy(listingId, price)}
                      disabled={!account}
                      fullWidth
                    >
                      Buy (Whitelist)
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
