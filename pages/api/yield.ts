import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    dailyMoveRange: "-10% to +10%",
    lenderProfitLocked: 2.5,
    strategyReinvestPool: 47.5,
    split: {
      lenderProfitLock: "5%",
      strategyReinvest: "95%"
    }
  });
}
