import type { NextApiRequest, NextApiResponse } from "next";
import { buildLoan } from "@/lib/mock";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const amount = Number(req.body.amount);
  const collateral = Number(req.body.collateral);

  if (!amount || !collateral) {
    res.status(400).json({ error: "amount and collateral are required" });
    return;
  }

  res.status(200).json(buildLoan(amount, collateral, req.body.borrower ?? "Demo Wallet"));
}
