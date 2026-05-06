import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    dailyYield: 2,
    repaid: 20,
    split: {
      repayLoan: "50%",
      borrower: "30%",
      lender: "20%"
    }
  });
}
