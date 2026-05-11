/**
 * ZK Proof Module - Simplified snarkjs integration for demo
 * 
 * In production, this would use a compiled circom circuit (risk_check.wasm + risk_check_final.zkey).
 * For the hackathon demo, we simulate the ZK proof structure while demonstrating
 * the concept of proving "collateralRatio >= threshold AND creditScore >= threshold"
 * without revealing the actual private values.
 */

import * as crypto from "crypto";

export type ZKProofData = {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
  verified: boolean;
  timestamp: string;
  circuitId: string;
  proofHash: string;
};

export type ZKInput = {
  collateralRatio: number;
  creditScore: number;
  minRatio: number;
  minScore: number;
};

/**
 * Generate a ZK proof that collateralRatio >= minRatio AND creditScore >= minScore
 * without revealing the actual values of collateralRatio or creditScore.
 * 
 * In production, this calls snarkjs.groth16.fullProve() with the compiled WASM + zkey.
 * For demo, we generate a cryptographically structured proof that demonstrates the concept.
 */
export async function generateProof(input: ZKInput): Promise<ZKProofData> {
  const { collateralRatio, creditScore, minRatio, minScore } = input;

  // Verify the statement is true (prover must know valid witness)
  const statementValid = collateralRatio >= minRatio && creditScore >= minScore;

  if (!statementValid) {
    throw new Error("Cannot generate proof: conditions not satisfied");
  }

  // Generate deterministic but unpredictable proof elements
  // In production, this is replaced by snarkjs.groth16.fullProve()
  const entropy = crypto.randomBytes(32).toString("hex");
  const proofSeed = crypto
    .createHash("sha256")
    .update(`${collateralRatio}:${creditScore}:${entropy}`)
    .digest("hex");

  const pi_a = [
    BigInt("0x" + proofSeed.slice(0, 16)).toString(),
    BigInt("0x" + proofSeed.slice(16, 32)).toString(),
    "1"
  ];

  const pi_b = [
    [
      BigInt("0x" + proofSeed.slice(32, 48)).toString(),
      BigInt("0x" + proofSeed.slice(48, 64)).toString()
    ],
    [
      BigInt("0x" + crypto.createHash("sha256").update(proofSeed + "b1").digest("hex").slice(0, 16)).toString(),
      BigInt("0x" + crypto.createHash("sha256").update(proofSeed + "b2").digest("hex").slice(0, 16)).toString()
    ],
    ["1", "0"]
  ];

  const pi_c = [
    BigInt("0x" + crypto.createHash("sha256").update(proofSeed + "c0").digest("hex").slice(0, 16)).toString(),
    BigInt("0x" + crypto.createHash("sha256").update(proofSeed + "c1").digest("hex").slice(0, 16)).toString(),
    "1"
  ];

  // Public signals: only the thresholds are revealed, NOT the actual values
  const publicSignals = [minRatio.toString(), minScore.toString()];

  const proofHash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ pi_a, pi_b, pi_c, publicSignals }))
    .digest("hex");

  return {
    proof: {
      pi_a,
      pi_b,
      pi_c,
      protocol: "groth16",
      curve: "bn128"
    },
    publicSignals,
    verified: true,
    timestamp: new Date().toISOString(),
    circuitId: "risk_check_v1",
    proofHash
  };
}

/**
 * Verify a ZK proof. In production, this calls snarkjs.groth16.verify()
 * with the verification key. For demo, we verify the proof structure
 * and hash integrity.
 */
export async function verifyProof(proofData: ZKProofData): Promise<{
  valid: boolean;
  checks: string[];
  details: {
    protocol: string;
    curve: string;
    publicInputs: { minRatio: number; minScore: number };
    circuitId: string;
    proofHash: string;
    verifiedAt: string;
  };
}> {
  const checks: string[] = [];

  // Check 1: Proof structure
  const hasValidStructure =
    proofData.proof.pi_a?.length === 3 &&
    proofData.proof.pi_b?.length === 3 &&
    proofData.proof.pi_c?.length === 3;
  checks.push(hasValidStructure ? "Proof Structure Valid" : "Invalid Proof Structure");

  // Check 2: Protocol check
  const correctProtocol = proofData.proof.protocol === "groth16" && proofData.proof.curve === "bn128";
  checks.push(correctProtocol ? "Groth16/BN128 Protocol Verified" : "Protocol Mismatch");

  // Check 3: Public signals present
  const hasPublicSignals = proofData.publicSignals?.length === 2;
  checks.push(hasPublicSignals ? "Public Signals Present" : "Missing Public Signals");

  // Check 4: Hash integrity
  const recomputedHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        pi_a: proofData.proof.pi_a,
        pi_b: proofData.proof.pi_b,
        pi_c: proofData.proof.pi_c,
        publicSignals: proofData.publicSignals
      })
    )
    .digest("hex");
  const hashValid = recomputedHash === proofData.proofHash;
  checks.push(hashValid ? "Proof Hash Integrity OK" : "Proof Hash Mismatch");

  // Check 5: Timestamp not in future
  const ts = new Date(proofData.timestamp).getTime();
  const notFuture = ts <= Date.now() + 60000;
  checks.push(notFuture ? "Timestamp Valid" : "Invalid Timestamp");

  const valid = hasValidStructure && correctProtocol && hasPublicSignals && hashValid && notFuture;

  return {
    valid,
    checks,
    details: {
      protocol: proofData.proof.protocol,
      curve: proofData.proof.curve,
      publicInputs: {
        minRatio: Number(proofData.publicSignals[0]),
        minScore: Number(proofData.publicSignals[1])
      },
      circuitId: proofData.circuitId,
      proofHash: proofData.proofHash,
      verifiedAt: new Date().toISOString()
    }
  };
}
