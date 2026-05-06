export type RiskLevel = "very-low" | "low" | "medium" | "elevated" | "high" | "liquidation";

export type RiskFactor = {
  label: string;
  score: number;
  weight: number;
  explanation: string;
  private: boolean;
};

export type RiskResult = {
  creditScore: number;
  collateralRatio: number;
  riskLevel: RiskLevel;
  riskLabel: string;
  riskExplanation: string;
  defaultProbability: string;
  approved: boolean;
  factors: {
    collateralRatio: RiskFactor;
    yieldAbility: RiskFactor;
    strategyRisk: RiskFactor;
    marketVolatility: RiskFactor;
  };
  aiReason: string;
  lenderVisibleReason: string;
};

export type Loan = {
  id: string;
  borrower: string;
  amount: number;
  collateral: number;
  risk: RiskResult;
  expectedYield: string;
  currentYield: number;
  repaid: number;
  borrowerEarnings: number;
  lenderEarnings: number;
  createdAt: string;
  funded: boolean;
  vaultStatus: "pending" | "funded" | "strategy";
};

export type YieldPoint = {
  day: string;
  yield: number;
  repaid: number;
};
