import type { Loan, RiskLevel, RiskResult, YieldPoint } from "./types";

export function calculateRisk(amount: number, collateral: number): RiskResult {
  const collateralRatio = Math.round((collateral / Math.max(amount, 1)) * 100);
  const collateralBand = getCollateralBand(collateralRatio);
  const yieldAbilityScore = getYieldAbilityScore(amount, collateralRatio);
  const strategyRiskScore = getStrategySafetyScore(amount);
  const marketVolatilityScore = getMarketVolatilityScore(collateralRatio);
  const creditScore = Math.round(
    collateralBand.score * 0.4 +
      yieldAbilityScore * 0.3 +
      strategyRiskScore * 0.2 +
      marketVolatilityScore * 0.1
  );

  let riskLevel: RiskLevel = "liquidation";
  if (collateralRatio >= 180) riskLevel = "very-low";
  else if (collateralRatio >= 160) riskLevel = "low";
  else if (collateralRatio >= 140) riskLevel = "medium";
  else if (collateralRatio >= 120) riskLevel = "elevated";
  else if (collateralRatio >= 100) riskLevel = "high";

  const defaultRate = getDefaultProbability(riskLevel);
  const approved = collateralRatio >= 100 && creditScore >= 40;
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
    riskLevel,
    riskLabel: collateralBand.label,
    riskExplanation: collateralBand.explanation,
    defaultProbability: defaultRate,
    approved,
    factors: {
      collateralRatio: {
        label: "抵押率",
        score: collateralBand.score,
        weight: 40,
        explanation: collateralBand.explanation,
        private: false
      },
      yieldAbility: {
        label: "收益能力",
        score: yieldAbilityScore,
        weight: 30,
        explanation: getYieldExplanation(yieldAbilityScore),
        private: true
      },
      strategyRisk: {
        label: "策略风险",
        score: strategyRiskScore,
        weight: 20,
        explanation: getStrategyExplanation(strategyRiskScore),
        private: true
      },
      marketVolatility: {
        label: "市场波动",
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

function getCollateralBand(ratio: number) {
  if (ratio >= 180) return { score: 95, label: "低风险", explanation: "抵押率达到 180% 以上，安全垫非常充足。" };
  if (ratio >= 160) return { score: 82, label: "较低风险", explanation: "抵押率位于 160%-180%，抵押资产覆盖较安全。" };
  if (ratio >= 140) return { score: 68, label: "中风险", explanation: "抵押率位于 140%-160%，可接受但需要关注收益表现。" };
  if (ratio >= 120) return { score: 50, label: "较高风险", explanation: "抵押率位于 120%-140%，接近危险区间。" };
  if (ratio >= 100) return { score: 30, label: "高风险", explanation: "抵押率位于 100%-120%，价格波动时容易触发清算。" };
  return { score: 10, label: "爆仓区", explanation: "抵押率低于 100%，抵押不足，不允许借款。" };
}

function getYieldAbilityScore(amount: number, ratio: number) {
  const base = ratio >= 160 ? 82 : ratio >= 140 ? 68 : ratio >= 120 ? 52 : 35;
  const amountPenalty = amount > 2000 ? 14 : amount > 1000 ? 8 : 0;
  return Math.max(20, Math.min(95, base - amountPenalty));
}

function getStrategySafetyScore(amount: number) {
  if (amount <= 600) return 86;
  if (amount <= 1200) return 76;
  if (amount <= 2200) return 64;
  return 52;
}

function getMarketVolatilityScore(ratio: number) {
  if (ratio >= 180) return 82;
  if (ratio >= 150) return 72;
  if (ratio >= 120) return 58;
  return 38;
}

function getDefaultProbability(level: RiskLevel) {
  const rates: Record<RiskLevel, string> = {
    "very-low": "3%",
    low: "6%",
    medium: "12%",
    elevated: "22%",
    high: "35%",
    liquidation: "60%+"
  };
  return rates[level];
}

export function getLenderApr(level: RiskLevel) {
  if (level === "very-low" || level === "low") return "8% APR";
  if (level === "medium") return "15% APR";
  return "25% APR";
}

function getYieldExplanation(score: number) {
  if (score >= 80) return "模拟收益能力较强，预计 Vault 策略现金流可以覆盖还款节奏。";
  if (score >= 60) return "模拟收益能力中等，能支持自动还款但需要持续监控。";
  return "模拟收益能力偏弱，还款主要依赖抵押安全垫。";
}

function getStrategyExplanation(score: number) {
  if (score >= 80) return "策略规模较小，mock 策略风险较低。";
  if (score >= 65) return "策略风险中等，适合受控 Vault 执行。";
  return "策略风险偏高，应限制资金使用范围。";
}

function getMarketExplanation(score: number) {
  if (score >= 75) return "当前抵押安全垫可吸收较大市场波动。";
  if (score >= 55) return "市场波动对头寸有影响，需要保留预警。";
  return "市场波动可能快速压缩抵押率。";
}

function buildAiReason(
  ratio: number,
  label: string,
  yieldScore: number,
  strategyScore: number,
  marketScore: number,
  approved: boolean
) {
  const decision = approved ? "因此该申请可以进入放款列表。" : "因此该申请暂不允许借款。";
  return `AI 风控判断为${label}：抵押率为 ${ratio}%，抵押覆盖是主要依据；收益能力评分 ${yieldScore}/100，决定自动还款的可持续性；策略风险评分 ${strategyScore}/100，说明资金进入 Vault 后的策略安全边界；市场波动评分 ${marketScore}/100，用于判断清算压力。${decision}`;
}

function buildLenderReason(
  ratio: number,
  label: string,
  yieldScore: number,
  strategyScore: number,
  approved: boolean
) {
  const decision = approved ? "因此该申请可以进入放款列表。" : "因此该申请暂不允许借款。";
  return `AI 风控判断为${label}：抵押率为 ${ratio}%，抵押覆盖是核心依据；收益能力评分 ${yieldScore}/100，表示 Vault 策略收益对自动还款的支持程度；策略风险评分 ${strategyScore}/100，说明资金受控进入策略后的安全边界；市场波动已通过 ZK 风控计算，但明细仅后台可见。${decision}`;
}

export function buildLoan(amount: number, collateral: number, borrower: string): Loan {
  const risk = calculateRisk(amount, collateral);
  const riskYield = getLenderApr(risk.riskLevel);

  return {
    id: `loan-${Date.now()}`,
    borrower,
    amount,
    collateral,
    risk,
    expectedYield: riskYield,
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
  if (loan.vaultStatus === "liquidated") return loan;

  const dailyPnl = Math.round((Math.random() * 200 - 100) * 100) / 100;
  const currentCollateral = loan.currentCollateral ?? loan.collateral;
  const history = loan.pnlHistory ?? [];
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
    const nextRepaid = Math.min(loan.amount, loan.repaid + repayShare);
    const nextLoan = {
      ...baseLoan,
      vaultStatus: "strategy" as const,
      lastEvent: "profit" as const,
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

export function createYieldSeries(loan: Loan): YieldPoint[] {
  if (loan.pnlHistory?.length) return loan.pnlHistory;

  return Array.from({ length: 7 }, (_, index) => {
    const dayYield = Math.min(loan.currentYield || 2, (index + 1) * 2);
    return {
      day: `D${index + 1}`,
      pnl: index === 0 ? loan.lastPnl ?? 0 : 0,
      yield: dayYield,
      repaid: Math.min(loan.amount, dayYield * 0.5),
      collateral: loan.currentCollateral ?? loan.collateral
    };
  });
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
    id: "seed-1",
    borrower: "8fQe...2a91",
    amount: 500,
    collateral: 800,
    risk: calculateRisk(500, 800),
    expectedYield: getLenderApr(calculateRisk(500, 800).riskLevel),
    currentYield: 18,
    currentCollateral: 800,
    lastPnl: 18,
    lastEvent: "profit",
    repaid: 9,
    borrowerEarnings: 5.4,
    lenderEarnings: 3.6,
    pnlHistory: [
      { day: "D1", pnl: 18, yield: 18, repaid: 9, collateral: 800 }
    ],
    createdAt: new Date().toISOString(),
    funded: false,
    vaultStatus: "pending"
  },
  {
    id: "seed-2",
    borrower: "D4kP...93de",
    amount: 1200,
    collateral: 1450,
    risk: calculateRisk(1200, 1450),
    expectedYield: getLenderApr(calculateRisk(1200, 1450).riskLevel),
    currentYield: 10,
    currentCollateral: 1450,
    lastPnl: 10,
    lastEvent: "profit",
    repaid: 5,
    borrowerEarnings: 3,
    lenderEarnings: 2,
    pnlHistory: [
      { day: "D1", pnl: 10, yield: 10, repaid: 5, collateral: 1450 }
    ],
    createdAt: new Date().toISOString(),
    funded: false,
    vaultStatus: "pending"
  }
];
