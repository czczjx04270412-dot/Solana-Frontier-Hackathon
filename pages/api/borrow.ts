import type { NextApiRequest, NextApiResponse } from "next";
import { buildLoan, getLenderApr, getLenderAprRate } from "@/lib/mock";
import { aiCalculateRisk } from "@/lib/deepseek";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  const risk = await aiCalculateRisk(amount, collateral);
  const interestDue = Math.round(amount * getLenderAprRate(risk.riskLevel) * 100) / 100;
  const loan = {
    ...buildLoan(amount, collateral, req.body.borrower ?? "Demo Wallet"),
    risk,
    expectedYield: getLenderApr(risk.riskLevel),
    interestDue,
    repaymentTarget: interestDue
  };

  res.status(200).json(loan);
}
