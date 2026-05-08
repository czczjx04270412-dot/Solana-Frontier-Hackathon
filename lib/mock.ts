import type { Loan, RiskLevel, RiskResult, YieldPoint } from "./types";

type RiskBand = {
  level: RiskLevel;
  score: number;
  label: string;
  explanation: string;
};

const lenderProfitShare = 0.05;
const dailyStrategyMoveMin = -0.1;
const dailyStrategyMoveMax = 0.1;

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

  return {
    creditScore,
    collateralRatio,
    riskLevel: collateralBand.level,
    riskLabel: collateralBand.label,
    riskExplanation: collateralBand.explanation,
    defaultProbability: getDefaultProbability(collateralBand.level),
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
    aiReason: buildAiReason(collateralRatio, collateralBand.label, yieldAbilityScore, strategyRiskScore, marketVolatilityScore, approved),
    lenderVisibleReason: buildLenderReason(collateralRatio, collateralBand.label, yieldAbilityScore, strategyRiskScore, approved)
  };
}

function getCollateralBand(ratio: number): RiskBand {
  if (ratio >= 180) return { level: "very-low", score: 95, label: "低风险", explanation: "抵押率达到 180% 以上，安全垫充足。" };
  if (ratio >= 150) return { level: "medium", score: 72, label: "中风险", explanation: "抵押率位于 150%-180%，策略风险中等。" };
  if (ratio >= 130) return { level: "high", score: 48, label: "高风险", explanation: "抵押率位于 130%-150%，需要更高目标收益补偿风险。" };
  if (ratio >= 120) return { level: "high", score: 35, label: "高风险", explanation: "抵押率接近清算线，借方抵押承担主要亏损风险。" };
  return { level: "liquidation", score: 10, label: "清算区", explanation: "抵押率低于 120%，策略应停止。" };
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
  if (level === "very-low" || level === "low") return "8% - 12% 目标收益";
  if (level === "medium") return "12% - 20% 目标收益";
  return "20% - 35% 目标收益";
}

export function getLenderAprRate(level: RiskLevel) {
  if (level === "very-low" || level === "low") return 0.1;
  if (level === "medium") return 0.16;
  return 0.275;
}

function getYieldExplanation(score: number) {
  if (score >= 80) return "收益能力较强，可以更快累积贷方利润锁定池。";
  if (score >= 60) return "收益能力中等，需要持续观察策略表现。";
  return "收益能力偏弱，更依赖抵押安全垫。";
}

function getStrategyExplanation(score: number) {
  if (score >= 80) return "策略较稳定，适合低风险融资。";
  if (score >= 60) return "策略风险中等。";
  return "策略波动较高，需要严格资金库控制。";
}

function getMarketExplanation(score: number) {
  if (score >= 80) return "市场波动较小。";
  if (score >= 60) return "市场波动正常。";
  return "市场波动可能快速压缩抵押安全垫。";
}

function buildAiReason(ratio: number, label: string, yieldScore: number, strategyScore: number, marketScore: number, approved: boolean) {
  const decision = approved ? "该申请可以进入放款列表。" : "该申请不应继续。";
  return `AI 风控评估：${label}。抵押率为 ${ratio}%，收益能力 ${yieldScore}/100，策略安全性 ${strategyScore}/100，市场稳定性 ${marketScore}/100。${decision}`;
}

function buildLenderReason(ratio: number, label: string, yieldScore: number, strategyScore: number, approved: boolean) {
  const decision = approved ? "该贷款可以按风险等级设置目标收益。" : "该贷款不建议放款。";
  return `AI 风控评估：${label}。公开抵押率为 ${ratio}%，贷方可据此定价。ZK 用于证明收益能力（${yieldScore}/100）、策略暴露（${strategyScore}/100）、违约历史和资产来源检查通过。${decision}`;
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
    repaymentTarget: interestDue,
    currentYield: 0,
    currentCollateral: collateral,
    lenderProfitLocked: 0,
    strategyReinvestPool: 0,
    vaultUsdc: amount + collateral,
    vaultSol: 0,
    solPrice: 200,
    vaultNav: amount + collateral,
    unrealizedPnl: 0,
    lastPnl: 0,
    lastEvent: "none",
    repaid: 0,
    borrowerEarnings: 0,
    lenderEarnings: 0,
    excessProfitToBorrower: 0,
    pnlHistory: [],
    createdAt: new Date().toISOString(),
    funded: false,
    vaultStatus: "pending"
  };
}

export function simulateYield(loan: Loan, days = 1, pnlOverride?: number): Loan {
  if (loan.vaultStatus === "liquidated" || loan.vaultStatus === "repaid" || loan.vaultStatus === "withdrawn") return loan;

  const history = loan.pnlHistory ?? [];
  const currentCollateral = loan.currentCollateral ?? loan.collateral;
  const lockedBefore = loan.lenderProfitLocked ?? loan.repaid ?? 0;
  const strategyPoolBefore = loan.strategyReinvestPool ?? Math.max(0, loan.borrowerEarnings ?? 0);
  const profitTarget = loan.interestDue;
  const vaultNavBefore = loan.vaultNav ?? loan.amount + currentCollateral + lockedBefore + strategyPoolBefore;
  const dailyMoveRate = dailyStrategyMoveMin + Math.random() * (dailyStrategyMoveMax - dailyStrategyMoveMin);
  const randomDailyPnl = Math.round(vaultNavBefore * dailyMoveRate * 100) / 100;
  const pnl = Math.round((pnlOverride ?? randomDailyPnl * days) * 100) / 100;

  if (pnl >= 0) return applyProfit(loan, history, currentCollateral, lockedBefore, strategyPoolBefore, profitTarget, vaultNavBefore, pnl);
  return applyLoss(loan, history, currentCollateral, lockedBefore, strategyPoolBefore, vaultNavBefore, pnl);
}

function applyProfit(
  loan: Loan,
  history: YieldPoint[],
  currentCollateral: number,
  lockedBefore: number,
  strategyPoolBefore: number,
  profitTarget: number,
  vaultNavBefore: number,
  pnl: number
): Loan {
  const remainingTarget = Math.max(0, profitTarget - lockedBefore);
  const lockCandidate = Math.round(pnl * lenderProfitShare * 100) / 100;
  const lenderLockAdd = Math.min(lockCandidate, remainingTarget);
  const reinvestAdd = Math.round((pnl - lenderLockAdd) * 100) / 100;
  const lenderProfitLocked = Math.round((lockedBefore + lenderLockAdd) * 100) / 100;
  const strategyReinvestPool = Math.round((strategyPoolBefore + reinvestAdd) * 100) / 100;
  const vaultNav = Math.round((vaultNavBefore + pnl) * 100) / 100;
  const reachedExit = lenderProfitLocked >= profitTarget && vaultNav >= loan.amount + lenderProfitLocked;

  const nextLoan: Loan = {
    ...loan,
    funded: true,
    vaultStatus: reachedExit ? "repaid" : "strategy",
    lastEvent: reachedExit ? "repaid" : "profit",
    lastPnl: pnl,
    currentYield: Math.round((loan.currentYield + pnl) * 100) / 100,
    lenderProfitLocked,
    strategyReinvestPool,
    repaid: lenderProfitLocked,
    lenderEarnings: lenderProfitLocked,
    borrowerEarnings: strategyReinvestPool,
    excessProfitToBorrower: reachedExit ? Math.max(0, vaultNav - loan.amount - lenderProfitLocked - currentCollateral) : 0,
    currentCollateral,
    vaultUsdc: Math.max(0, Math.round((loan.vaultUsdc + pnl) * 100) / 100),
    vaultNav,
    unrealizedPnl: Math.round((vaultNav - loan.amount - loan.collateral) * 100) / 100
  };

  return { ...nextLoan, pnlHistory: appendPnlPoint(nextLoan, history) };
}

function applyLoss(
  loan: Loan,
  history: YieldPoint[],
  currentCollateral: number,
  lockedBefore: number,
  strategyPoolBefore: number,
  vaultNavBefore: number,
  pnl: number
): Loan {
  const loss = Math.abs(pnl);
  const strategyAbsorbed = Math.min(strategyPoolBefore, loss);
  const collateralLoss = Math.max(0, loss - strategyAbsorbed);
  const strategyReinvestPool = Math.round((strategyPoolBefore - strategyAbsorbed) * 100) / 100;
  const nextCollateral = Math.max(0, Math.round((currentCollateral - collateralLoss) * 100) / 100);
  const vaultNav = Math.max(0, Math.round((vaultNavBefore - loss) * 100) / 100);
  const liquidationLine = loan.amount * 1.2;
  const liquidated = vaultNav < liquidationLine;

  const nextLoan: Loan = {
    ...loan,
    funded: true,
    vaultStatus: liquidated ? "liquidated" : "loss",
    lastEvent: liquidated ? "liquidated" : "loss",
    lastPnl: pnl,
    currentYield: Math.round((loan.currentYield + pnl) * 100) / 100,
    currentCollateral: nextCollateral,
    lenderProfitLocked: lockedBefore,
    strategyReinvestPool,
    repaid: lockedBefore,
    lenderEarnings: lockedBefore,
    borrowerEarnings: strategyReinvestPool,
    excessProfitToBorrower: 0,
    vaultUsdc: Math.max(0, Math.round((loan.vaultUsdc - loss) * 100) / 100),
    vaultNav,
    unrealizedPnl: Math.round((vaultNav - loan.amount - loan.collateral) * 100) / 100
  };

  return { ...nextLoan, pnlHistory: appendPnlPoint(nextLoan, history) };
}

export function continueBorrowing(loan: Loan): Loan {
  if (loan.vaultStatus !== "repaid") return loan;
  return { ...loan, repaid: 0, lenderProfitLocked: 0, strategyReinvestPool: 0, currentYield: 0, borrowerEarnings: 0, lenderEarnings: 0, excessProfitToBorrower: 0, lastPnl: 0, lastEvent: "none", pnlHistory: [], vaultStatus: "strategy" };
}

export function withdrawAfterRepayment(loan: Loan): Loan {
  if (loan.vaultStatus !== "repaid") return loan;
  return { ...loan, lastEvent: "withdrawn", vaultStatus: "withdrawn" };
}

export function createYieldSeries(loan: Loan): YieldPoint[] {
  if (loan.pnlHistory?.length) return loan.pnlHistory;
  return [{ day: "D1", pnl: loan.lastPnl ?? 0, yield: loan.currentYield ?? 0, repaid: loan.lenderProfitLocked ?? loan.repaid ?? 0, collateral: loan.currentCollateral ?? loan.collateral }];
}

function appendPnlPoint(loan: Loan, history: YieldPoint[]) {
  const lastDay = history.reduce((max, point) => {
    const value = Number(point.day.replace("D", ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return [
    ...history,
    {
      day: `D${lastDay + 1}`,
      pnl: loan.lastPnl,
      yield: loan.currentYield,
      repaid: loan.lenderProfitLocked ?? loan.repaid,
      collateral: loan.currentCollateral
    }
  ].slice(-30);
}

export function applyDemoScenario(loan: Loan, scenario: "profit" | "loss" | "liquidation" | "exit"): Loan {
  if (scenario === "profit") return simulateYield(loan, 1, Math.round((loan.vaultNav || loan.amount + loan.collateral) * 0.08 * 100) / 100);
  if (scenario === "loss") return simulateYield(loan, 1, -Math.round((loan.vaultNav || loan.amount + loan.collateral) * 0.07 * 100) / 100);
  if (scenario === "liquidation") return simulateYield(loan, 1, -Math.round((loan.vaultNav || loan.amount + loan.collateral) * 0.45 * 100) / 100);
  const needed = Math.max(0, loan.interestDue - (loan.lenderProfitLocked ?? 0));
  const pnlNeeded = needed > 0 ? needed / lenderProfitShare + 1 : 1;
  return simulateYield(loan, 1, Math.round(pnlNeeded * 100) / 100);
}

export const seedLoans: Loan[] = [
  { ...buildLoan(500, 920, "8fQe...2a91"), id: "seed-low", vaultStatus: "strategy", funded: true },
  { ...buildLoan(1200, 1900, "D4kP...93de"), id: "seed-medium" }
];
