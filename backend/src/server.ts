import express, { Request, Response } from "express";
import { buildWhitelistTree } from "./merkle";

/// Demo whitelist for testing.
/// In a real project you would probably load this from a database.
const WHITELIST = [
  "0x0000000000000000000000000000000000000001",
  "0x0000000000000000000000000000000000000002"
];

const { root, getProof } = buildWhitelistTree(WHITELIST);

const app = express();
app.use(express.json());

/// GET /root
/// Returns the current Merkle root that should be configured in the contract.
app.get("/root", (_: Request, res: Response) => {
  res.json({ root });
});

/// GET /proof/:address
/// Returns the Merkle proof for a specific address if it is in the whitelist.
app.get("/proof/:address", (req: Request, res: Response) => {
  const address = req.params.address;

  const normalizedWhitelist = WHITELIST.map((a) => a.toLowerCase());
  if (!normalizedWhitelist.includes(address.toLowerCase())) {
    return res.status(404).json({ error: "address not in whitelist" });
  }

  const proof = getProof(address);
  res.json({ proof });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log("Merkle root:", root);
});
