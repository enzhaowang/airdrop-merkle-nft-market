import { useState } from "react";
import { MYNFT_CONTRACT_ADDRESS, TOKEN_ADDRESS } from "../config";
import { parseUnits, formatUnits } from "viem";
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import MyTokenABI from "../../contracts/MyToken.json";
import MyNFTABI from "../../contracts/MyNFT.json";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function Profile() {
  const { address: account } = useAccount();
  const [status, setStatus] = useState<string>("");
  const { writeContractAsync } = useWriteContract();

  // State for forms
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [mintTo, setMintTo] = useState("");
  const [approveSpender, setApproveSpender] = useState("");
  const [approveTokenId, setApproveTokenId] = useState("");

  // ----------------------------------------------------------------
  // READS
  // ----------------------------------------------------------------

  // 1. MyToken Balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: MyTokenABI,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: {
      enabled: !!account,
    }
  });

  // ----------------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------------

  // --- MyToken: Transfer ---
  const handleTransfer = async () => {
    if (!account || !transferTo || !transferAmount) return;
    try {
      setStatus("Transferring tokens...");
      const hash = await writeContractAsync({
        address: TOKEN_ADDRESS as `0x${string}`,
        abi: MyTokenABI,
        functionName: "transfer",
        args: [transferTo, parseUnits(transferAmount, 18)],
      });
      setStatus(`Transfer successful: ${hash}`);
      refetchBalance();
    } catch (e: any) {
      console.error(e);
      setStatus(`Transfer failed: ${e.message}`);
    }
  };

  // --- MyNFT: Mint ---
  const handleMint = async () => {
    if (!account || !mintTo) return;
    try {
      setStatus("Minting NFT...");
      const hash = await writeContractAsync({
        address: MYNFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: MyNFTABI,
        functionName: "mint",
        args: [mintTo],
      });
      setStatus(`Mint successful: ${hash}`);
    } catch (e: any) {
      console.error(e);
      setStatus(`Mint failed: ${e.message}`);
    }
  };

  // --- MyNFT: Approve ---
  const handleApprove = async () => {
    if (!account || !approveSpender || !approveTokenId) return;
    try {
      setStatus("Approving NFT...");
      const hash = await writeContractAsync({
        address: MYNFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: MyNFTABI,
        functionName: "approve",
        args: [approveSpender, BigInt(approveTokenId)],
      });
      setStatus(`Approve successful: ${hash}`);
    } catch (e: any) {
      console.error(e);
      setStatus(`Approve failed: ${e.message}`);
    }
  };

  if (!account) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Connect Wallet</h2>
          <p className="text-wagmi-text-muted">Connect your wallet to view your profile and manage assets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {status && (
        <div className="bg-wagmi-card border border-wagmi-border p-4 rounded-lg text-sm font-mono break-all">
          <span className="text-wagmi-primary font-bold">Status:</span> {status}
        </div>
      )}

      {/* --- MyToken Section --- */}
      <Card title="MyToken (Payment Token)">
        <div className="mb-6">
          <div className="text-3xl font-bold text-white">
            {tokenBalance ? formatUnits(tokenBalance as bigint, 18) : "0"} <span className="text-wagmi-primary text-xl">MTK</span>
          </div>
          <p className="text-sm text-wagmi-text-muted mt-1">Your current balance</p>
        </div>
        
        <div className="border-t border-wagmi-border pt-6">
          <h4 className="text-lg font-medium mb-4 text-white">Transfer Tokens</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input
              label="Recipient Address"
              placeholder="0x..."
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              className="md:col-span-1"
            />
            <Input
              label="Amount"
              placeholder="0.0"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
            <Button onClick={handleTransfer} disabled={!account || !transferTo || !transferAmount}>
              Transfer
            </Button>
          </div>
        </div>
      </Card>

      {/* --- MyNFT Section --- */}
      <Card title="MyNFT Management">
        <div className="space-y-8">
          {/* Mint */}
          <div>
            <h4 className="text-lg font-medium mb-4 text-white">Mint New NFT</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Input
                label="To Address"
                placeholder="0x..."
                value={mintTo}
                onChange={(e) => setMintTo(e.target.value)}
                className="md:col-span-2"
              />
              <Button onClick={handleMint} disabled={!account || !mintTo}>
                Mint
              </Button>
            </div>
          </div>

          <div className="border-t border-wagmi-border my-6"></div>

          {/* Approve */}
          <div>
            <div className="flex justify-between items-baseline mb-4">
              <h4 className="text-lg font-medium text-white">Approve Market</h4>
              <p className="text-xs text-wagmi-text-muted">Allow the market to sell your NFT</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Input
                label="Spender Address"
                placeholder="0x..."
                value={approveSpender}
                onChange={(e) => setApproveSpender(e.target.value)}
              />
              <Input
                label="Token ID"
                placeholder="e.g. 1"
                value={approveTokenId}
                onChange={(e) => setApproveTokenId(e.target.value)}
              />
              <Button onClick={handleApprove} disabled={!account || !approveSpender || !approveTokenId}>
                Approve
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
