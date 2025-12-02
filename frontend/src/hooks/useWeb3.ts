import { useEffect, useState } from "react";
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";

/// Simple hook to connect to MetaMask and expose:
///  - the currently selected account
///  - the viem wallet client
///
/// For a production app you would normally use wagmi or similar libraries,
/// but this is enough to demonstrate the full flow for this project.
export function useWeb3() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [walletClient, setWalletClient] = useState<ReturnType<typeof createWalletClient> | null>(null);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) {
      console.warn("No injected provider found (MetaMask not installed?)");
      return;
    }

    // Create a viem wallet client using the injected provider (MetaMask).
    const wallet = createWalletClient({
      chain: sepolia,        // Adjust chain here if you use another testnet/mainnet
      transport: custom(eth) // Use the injected provider as transport
    });

    setWalletClient(wallet);

    // Ask MetaMask for accounts. This will trigger the connection popup.
    eth
      .request({ method: "eth_requestAccounts" })
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0] as `0x${string}`);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to get accounts from MetaMask:", error);
      });
  }, []);

  return { account, walletClient };
}
