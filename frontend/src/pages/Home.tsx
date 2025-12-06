import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
        Airdrop Merkle NFT Market
      </h1>
      <p className="text-xl text-wagmi-text-muted max-w-2xl mb-12">
        Buy, sell, and trade NFTs with whitelist verification powered by Merkle trees. 
        Secure, transparent, and efficient.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Card className="hover:border-wagmi-primary/50 transition-colors">
          <h2 className="text-2xl font-semibold mb-4 text-white">Explore Market</h2>
          <p className="text-wagmi-text-muted mb-6">
            Browse available NFTs and purchase using your whitelist proof.
          </p>
          <Link to="/market">
            <Button fullWidth>Go to Market</Button>
          </Link>
        </Card>

        <Card className="hover:border-wagmi-primary/50 transition-colors">
          <h2 className="text-2xl font-semibold mb-4 text-white">Manage Assets</h2>
          <p className="text-wagmi-text-muted mb-6">
            View your tokens, mint new NFTs, and manage approvals.
          </p>
          <Link to="/profile">
            <Button variant="secondary" fullWidth>Go to Profile</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
