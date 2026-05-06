import type { NextApiRequest, NextApiResponse } from "next";
import { calculateRisk } from "@/lib/mock";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const amount = Number(req.query.amount ?? 500);
  const collateral = Number(req.query.collateral ?? 800);
  const risk = calculateRisk(amount, collateral);

  res.status(200).json({
    creditScore: risk.creditScore,
    collateralRatio: risk.collateralRatio,
    riskLevel: risk.riskLevel,
    riskLabel: risk.riskLabel,
    defaultProbability: risk.defaultProbability,
    approved: risk.approved,
    lenderVisibleReason: risk.lenderVisibleReason
  });
}
