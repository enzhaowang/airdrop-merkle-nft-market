import { Link, Outlet, useLocation } from "react-router-dom";
import { ConnectButton } from "./ConnectButton";

export function Layout() {
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Market", path: "/market" },
    { label: "Profile", path: "/profile" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-wagmi-bg text-wagmi-text">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-wagmi-border bg-wagmi-bg/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              NFT Market
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors hover:text-white ${
                    location.pathname === item.path
                      ? "text-white"
                      : "text-wagmi-text-muted"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-wagmi-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-wagmi-text-muted">
          <p>© 2024 NFT Market. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
