import type { Loan, RiskLevel, RiskResult, YieldPoint } from "./types";

type RiskBand = {
  level: RiskLevel;
  score: number;
  label: string;
  explanation: string;
};

export function calculateRisk(amount: number, collateral: number): RiskResult {
  const collateralRatio = Math.round((collateral / Math.max(amount, 1)) * 100);
  const collateralBand = getCollateralBand(collateralRatio);
  const yieldAbilityScore = getYieldAbilityScore(amount, collateralRatio);
  const strategyRiskScore = getStrategySafetyScore(collateralRatio);
  const marketVolatilityScore = getMarketVolatilityScore(collateralRatio);
  const creditScore = Math.round(
    collateralBand.score * 0.4 +
      yieldAbilityScore * 0.3 +
      strategyRiskScore * 0.2 +
      marketVolatilityScore * 0.1
  );
  const approved = collateralRatio >= 120 && creditScore >= 40;
  const defaultRate = getDefaultProbability(collateralBand.level);
  const aiReason = buildAiReason(
    collateralRatio,
    collateralBand.label,
    yieldAbilityScore,
    strategyRiskScore,
    marketVolatilityScore,
    approved
  );
  const lenderVisibleReason = buildLenderReason(
    collateralRatio,
    collateralBand.label,
    yieldAbilityScore,
    strategyRiskScore,
    approved
  );

  return {
    creditScore,
    collateralRatio,
    riskLevel: collateralBand.level,
    riskLabel: collateralBand.label,
    riskExplanation: collateralBand.explanation,
    defaultProbability: defaultRate,
    approved,
    factors: {
      collateralRatio: {
        label: "Collateral Ratio",
        score: collateralBand.score,
        weight: 40,
        explanation: collateralBand.explanation,
        private: false
      },
      yieldAbility: {
        label: "Yield Ability",
        score: yieldAbilityScore,
        weight: 30,
        explanation: getYieldExplanation(yieldAbilityScore),
        private: true
      },
      strategyRisk: {
        label: "Strategy Risk",
        score: strategyRiskScore,
        weight: 20,
        explanation: getStrategyExplanation(strategyRiskScore),
        private: true
      },
      marketVolatility: {
        label: "Market Volatility",
        score: marketVolatilityScore,
        weight: 10,
        explanation: getMarketExplanation(marketVolatilityScore),
        private: true
      }
    },
    aiReason,
    lenderVisibleReason
  };
}

function getCollateralBand(ratio: number): RiskBand {
  if (ratio >= 180) {
    return {
      level: "very-low",
      score: 95,
      label: "Low Risk",
      explanation: "Collateral ratio is 180%+, strategy is stable staking, and volatility is low."
    };
  }
  if (ratio >= 150) {
    return {
      level: "medium",
      score: 72,
      label: "Medium Risk",
      explanation: "Collateral ratio is 150%-180%, strategy risk is moderate, and market volatility is normal."
    };
  }
  if (ratio >= 130) {
    return {
      level: "high",
      score: 48,
      label: "High Risk",
      explanation: "Collateral ratio is 130%-150%; high-volatility strategies like LP, high-frequency, or meme exposure need higher APR."
    };
  }
  if (ratio >= 120) {
    return {
      level: "high",
      score: 35,
      label: "High Risk",
      explanation: "Collateral ratio is close to liquidation. Borrower collateral is still first-loss, but lender APR must be high."
    };
  }
  return {
    level: "liquidation",
    score: 10,
    label: "Liquidation Zone",
    explanation: "Collateral ratio is below 120%, so the strategy should stop and the loan cannot continue."
  };
}

function getYieldAbilityScore(amount: number, ratio: number) {
  const base = ratio >= 180 ? 92 : ratio >= 150 ? 72 : ratio >= 130 ? 52 : 35;
  const amountPenalty = amount > 2000 ? 14 : amount > 1000 ? 8 : 0;
  return Math.max(20, Math.min(95, base - amountPenalty));
}

function getStrategySafetyScore(ratio: number) {
  if (ratio >= 180) return 92;
  if (ratio >= 150) return 72;
  if (ratio >= 130) return 48;
  return 35;
}

function getMarketVolatilityScore(ratio: number) {
  if (ratio >= 180) return 88;
  if (ratio >= 150) return 70;
  if (ratio >= 130) return 45;
  return 30;
}

function getDefaultProbability(level: RiskLevel) {
  const rates: Record<RiskLevel, string> = {
    "very-low": "3%",
    low: "5%",
    medium: "12%",
    elevated: "22%",
    high: "35%",
    liquidation: "60%+"
  };
  return rates[level];
}

export function getLenderApr(level: RiskLevel) {
  if (level === "very-low" || level === "low") return "8% - 12% APR";
  if (level === "medium") return "12% - 20% APR";
  return "20% - 35% APR";
}

export function getLenderAprRate(level: RiskLevel) {
  if (level === "very-low" || level === "low") return 0.1;
  if (level === "medium") return 0.16;
  return 0.275;
}

function getYieldExplanation(score: number) {
  if (score >= 80) return "Yield ability is strong enough to support automatic repayment.";
  if (score >= 60) return "Yield ability is moderate and should be monitored.";
  return "Yield ability is weak; repayment relies more on collateral safety.";
}

function getStrategyExplanation(score: number) {
  if (score >= 80) return "Strategy is stable, staking-like, and suitable for low-risk financing.";
  if (score >= 60) return "Strategy risk is moderate.";
  return "Strategy is high volatility and needs strict vault control.";
}

function getMarketExplanation(score: number) {
  if (score >= 80) return "Market volatility is low.";
  if (score >= 60) return "Market volatility is normal.";
  return "Market volatility can quickly pressure collateral ratio.";
}

function buildAiReason(
  ratio: number,
  label: string,
  yieldScore: number,
  strategyScore: number,
  marketScore: number,
  approved: boolean
) {
  const decision = approved ? "The application can enter the lending list." : "The application should not continue.";
  return `AI risk assessment: ${label}. Collateral ratio is ${ratio}%; yield ability is ${yieldScore}/100; strategy safety is ${strategyScore}/100; market stability is ${marketScore}/100. ${decision}`;
}

function buildLenderReason(
  ratio: number,
  label: string,
  yieldScore: number,
  strategyScore: number,
  approved: boolean
) {
  const decision = approved ? "The loan can be funded under the recommended APR range." : "The loan should not be funded.";
  return `AI risk assessment: ${label}. Collateral ratio is ${ratio}%, yield ability is ${yieldScore}/100, and strategy safety is ${strategyScore}/100. Market volatility was included in the ZK risk calculation, but detailed data is only visible to back-office staff. ${decision}`;
}

export function buildLoan(amount: number, collateral: number, borrower: string): Loan {
  const risk = calculateRisk(amount, collateral);
  const interestDue = Math.round(amount * getLenderAprRate(risk.riskLevel) * 100) / 100;

  return {
    id: `loan-${Date.now()}`,
    borrower,
    amount,
    collateral,
    risk,
    expectedYield: getLenderApr(risk.riskLevel),
    interestDue,
    repaymentTarget: amount + interestDue,
    currentYield: 0,
    currentCollateral: collateral,
    lastPnl: 0,
    lastEvent: "none",
    repaid: 0,
    borrowerEarnings: 0,
    lenderEarnings: 0,
    pnlHistory: [],
    createdAt: new Date().toISOString(),
    funded: false,
    vaultStatus: "pending"
  };
}

export function simulateYield(loan: Loan, days = 1): Loan {
  if (loan.vaultStatus === "liquidated" || loan.vaultStatus === "repaid" || loan.vaultStatus === "withdrawn") {
    return loan;
  }

  const dailyPnl = Math.round((Math.random() * 200 - 100) * 100) / 100;
  const currentCollateral = loan.currentCollateral ?? loan.collateral;
  const history = loan.pnlHistory ?? [];
  const repaymentTarget = loan.repaymentTarget ?? loan.amount;
  const baseLoan = {
    ...loan,
    funded: true,
    lastPnl: dailyPnl,
    currentYield: loan.currentYield + dailyPnl
  };

  if (dailyPnl >= 0) {
    const repayShare = dailyPnl * 0.5 * days;
    const borrowerShare = dailyPnl * 0.3 * days;
    const lenderShare = dailyPnl * 0.2 * days;
    const nextRepaid = Math.min(repaymentTarget, loan.repaid + repayShare);
    const repaidInFull = nextRepaid >= repaymentTarget;
    const nextLoan = {
      ...baseLoan,
      vaultStatus: repaidInFull ? ("repaid" as const) : ("strategy" as const),
      lastEvent: repaidInFull ? ("repaid" as const) : ("profit" as const),
      repaid: nextRepaid,
      borrowerEarnings: loan.borrowerEarnings + borrowerShare,
      lenderEarnings: loan.lenderEarnings + lenderShare,
      currentCollateral
    };

    return {
      ...nextLoan,
      pnlHistory: appendPnlPoint(nextLoan, history)
    };
  }

  const lossAmount = Math.abs(dailyPnl) * days;
  const nextCollateral = Math.max(0, currentCollateral - lossAmount);
  const nextRatio = (nextCollateral / Math.max(loan.amount, 1)) * 100;
  const liquidated = nextRatio < 120;
  const nextLoan = {
    ...baseLoan,
    vaultStatus: liquidated ? ("liquidated" as const) : ("loss" as const),
    lastEvent: liquidated ? ("liquidated" as const) : ("loss" as const),
    currentCollateral: nextCollateral
  };

  return {
    ...nextLoan,
    pnlHistory: appendPnlPoint(nextLoan, history)
  };
}

export function continueBorrowing(loan: Loan): Loan {
  if (loan.vaultStatus !== "repaid") return loan;
  return {
    ...loan,
    repaid: 0,
    currentYield: 0,
    borrowerEarnings: 0,
    lenderEarnings: 0,
    lastPnl: 0,
    lastEvent: "none",
    pnlHistory: [],
    vaultStatus: "strategy"
  };
}

export function withdrawAfterRepayment(loan: Loan): Loan {
  if (loan.vaultStatus !== "repaid") return loan;
  return {
    ...loan,
    lastEvent: "withdrawn",
    vaultStatus: "withdrawn"
  };
}

export function createYieldSeries(loan: Loan): YieldPoint[] {
  if (loan.pnlHistory?.length) return loan.pnlHistory;

  return [
    {
      day: "D1",
      pnl: loan.lastPnl ?? 0,
      yield: loan.currentYield ?? 0,
      repaid: loan.repaid ?? 0,
      collateral: loan.currentCollateral ?? loan.collateral
    }
  ];
}

function appendPnlPoint(loan: Loan, history: YieldPoint[]) {
  return [
    ...history,
    {
      day: `D${history.length + 1}`,
      pnl: loan.lastPnl,
      yield: loan.currentYield,
      repaid: loan.repaid,
      collateral: loan.currentCollateral
    }
  ].slice(-14);
}

export const seedLoans: Loan[] = [
  {
    ...buildLoan(500, 920, "8fQe...2a91"),
    id: "seed-low",
    vaultStatus: "strategy",
    funded: true
  },
  {
    ...buildLoan(1200, 1900, "D4kP...93de"),
    id: "seed-medium"
  }
];
