import type { NextApiRequest, NextApiResponse } from "next";
import { generateProof } from "@/lib/zk";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const collateralRatio = Number(req.query.collateralRatio ?? req.body?.collateralRatio ?? 160);
  const creditScore = Number(req.query.creditScore ?? req.body?.creditScore ?? 72);
  const minRatio = Number(req.query.minRatio ?? req.body?.minRatio ?? 120);
  const minScore = Number(req.query.minScore ?? req.body?.minScore ?? 40);

  try {
    const proofData = await generateProof({
      collateralRatio,
      creditScore,
      minRatio,
      minScore
    });

    res.status(200).json({
      success: true,
      proofData,
      message: "ZK proof generated: collateralRatio >= minRatio AND creditScore >= minScore verified without revealing private values"
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Proof generation failed";
    res.status(400).json({
      success: false,
      error: message,
      message: "Cannot generate ZK proof: risk conditions not satisfied"
    });
  }
}
