import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Button } from './ui/Button';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-wagmi-text-muted hidden sm:inline-block">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <Button onClick={() => disconnect()} variant="secondary" className="text-sm py-1.5 h-9">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => connect({ connector: injected() })} className="text-sm py-1.5 h-9">
      Connect Wallet
    </Button>
  );
}
