import type { NextApiRequest, NextApiResponse } from "next";
import { verifyProof, ZKProofData } from "@/lib/zk";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const proofData = req.body as ZKProofData;

  if (!proofData?.proof || !proofData?.publicSignals) {
    res.status(400).json({ error: "Invalid proof data: missing proof or publicSignals" });
    return;
  }

  try {
    const result = await verifyProof(proofData);
    res.status(200).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed";
    res.status(500).json({ valid: false, error: message });
  }
}
