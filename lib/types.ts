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
  interestDue: number;
  repaymentTarget: number;
  currentYield: number;
  currentCollateral: number;
  lenderProfitLocked: number;
  strategyReinvestPool: number;
  vaultUsdc: number;
  vaultSol: number;
  solPrice: number;
  vaultNav: number;
  unrealizedPnl: number;
  lastPnl: number;
  lastEvent: "none" | "profit" | "loss" | "liquidated" | "repaid" | "withdrawn";
  repaid: number;
  borrowerEarnings: number;
  lenderEarnings: number;
  excessProfitToBorrower: number;
  pnlHistory: YieldPoint[];
  createdAt: string;
  borrowerApprovalStatus: "pending" | "approved" | "rejected";
  lenderApprovalStatus: "not-started" | "pending" | "approved" | "rejected";
  funded: boolean;
  vaultStatus: "pending" | "funded" | "strategy" | "loss" | "liquidated" | "repaid" | "withdrawn";
};

export type YieldPoint = {
  day: string;
  pnl: number;
  yield: number;
  repaid: number;
  collateral: number;
};
