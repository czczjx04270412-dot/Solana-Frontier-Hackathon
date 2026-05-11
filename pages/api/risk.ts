import type { NextApiRequest, NextApiResponse } from "next";
import { aiCalculateRisk } from "@/lib/deepseek";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const amount = Number(req.query.amount ?? req.body?.amount ?? 500);
  const collateral = Number(req.query.collateral ?? req.body?.collateral ?? 800);
  const risk = await aiCalculateRisk(amount, collateral);

  res.status(200).json({
    creditScore: risk.creditScore,
    collateralRatio: risk.collateralRatio,
    riskLevel: risk.riskLevel,
    riskLabel: risk.riskLabel,
    riskExplanation: risk.riskExplanation,
    defaultProbability: risk.defaultProbability,
    approved: risk.approved,
    factors: risk.factors,
    aiReason: risk.aiReason,
    lenderVisibleReason: risk.lenderVisibleReason
  });
}
