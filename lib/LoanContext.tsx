import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { Loan } from "./types";
import { applyDemoScenario, buildLoan, continueBorrowing, seedLoans, simulateYield, withdrawAfterRepayment } from "./mock";

export type OnChainMode = "mock" | "hybrid" | "onchain";

type LoanContextValue = {
  loans: Loan[];
  activeLoan: Loan | null;
  createLoan: (amount: number, collateral: number, borrower: string) => Loan;
  fundLoan: (id: string) => void;
  reviewBorrowerRequest: (id: string, decision: "approved" | "rejected") => void;
  reviewLenderRequest: (id: string, decision: "approved" | "rejected") => void;
  accrueYield: (days?: number) => void;
  continueActiveLoan: () => void;
  withdrawActiveLoan: () => void;
  vaultBuySol: () => void;
  vaultSellSol: () => void;
  simulatePriceMove: () => void;
  runRiskCheck: () => void;
  resetDemo: () => void;
  runDemoScenario: (scenario: "profit" | "loss" | "liquidation" | "exit") => void;
  setActiveLoanId: (id: string) => void;
  // On-chain integration
  mode: OnChainMode;
  setMode: (mode: OnChainMode) => void;
  initVaultOnChain: (loanId: string) => Promise<{ success: boolean; tx?: string; error?: string }>;
  syncFromChain: () => Promise<void>;
};

const LoanContext = createContext<LoanContextValue | null>(null);
const storageKey = "solana-defi-vault-loans-v10";
const activeKey = "solana-defi-vault-active-loan-v10";

function refreshVaultRisk(loan: Loan): Loan {
  const vaultNav = loan.vaultUsdc + loan.vaultSol * loan.solPrice;
  const unrealizedPnl = vaultNav - (loan.amount + loan.collateral);
  const liquidationLine = loan.amount * 1.2;
  const liquidated = vaultNav < liquidationLine;
  const lenderProfitLocked = loan.lenderProfitLocked ?? loan.repaid ?? 0;

  return {
    ...loan,
    vaultNav,
    unrealizedPnl,
    currentYield: unrealizedPnl,
    lastPnl: unrealizedPnl,
    lenderProfitLocked,
    strategyReinvestPool: loan.strategyReinvestPool ?? loan.borrowerEarnings ?? 0,
    repaid: lenderProfitLocked,
    lenderEarnings: lenderProfitLocked,
    currentCollateral: Math.max(0, vaultNav - loan.amount - lenderProfitLocked),
    vaultStatus: liquidated ? "liquidated" : loan.vaultStatus === "pending" ? "pending" : "strategy",
    lastEvent: liquidated ? "liquidated" : unrealizedPnl >= 0 ? "profit" : "loss"
  };
}

export function LoanProvider({ children }: { children: ReactNode }) {
  const [loans, setLoans] = useState<Loan[]>(seedLoans);
  const [activeLoanId, setActiveLoanIdState] = useState<string>(seedLoans[0].id);
  const [mode, setMode] = useState<OnChainMode>("mock");

  useEffect(() => {
    const savedLoans = window.localStorage.getItem(storageKey);
    const savedActive = window.localStorage.getItem(activeKey);
    if (savedLoans) setLoans(JSON.parse(savedLoans));
    if (savedActive) setActiveLoanIdState(savedActive);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    window.localStorage.setItem(activeKey, activeLoanId);
  }, [activeLoanId]);

  const activeLoan = loans.find((loan) => loan.id === activeLoanId) ?? loans[0] ?? null;

  const value = useMemo<LoanContextValue>(() => ({
    loans,
    activeLoan,
    createLoan(amount, collateral, borrower) {
      const loan = buildLoan(amount, collateral, borrower);
      setLoans((current) => [loan, ...current]);
      setActiveLoanIdState(loan.id);
      return loan;
    },
    fundLoan(id) {
      setLoans((current) =>
        current.map((loan) =>
          loan.id === id && loan.borrowerApprovalStatus === "approved"
            ? { ...loan, lenderApprovalStatus: "pending", vaultStatus: "pending" }
            : loan
        )
      );
      setActiveLoanIdState(id);
    },
    reviewBorrowerRequest(id, decision) {
      setLoans((current) =>
        current.map((loan) =>
          loan.id === id
            ? {
                ...loan,
                borrowerApprovalStatus: decision,
                lenderApprovalStatus: decision === "approved" ? loan.lenderApprovalStatus : "not-started",
                vaultStatus: decision === "approved" ? loan.vaultStatus : "pending"
              }
            : loan
        )
      );
      setActiveLoanIdState(id);
    },
    reviewLenderRequest(id, decision) {
      setLoans((current) =>
        current.map((loan) =>
          loan.id === id
            ? {
                ...loan,
                lenderApprovalStatus: decision,
                funded: decision === "approved",
                vaultStatus: decision === "approved" ? "funded" : "pending"
              }
            : loan
        )
      );
      setActiveLoanIdState(id);
    },
    accrueYield(days = 1) {
      if (!activeLoan) return;
      if (activeLoan.borrowerApprovalStatus !== "approved" || activeLoan.lenderApprovalStatus !== "approved" || !activeLoan.funded) return;
      setLoans((current) =>
        current.map((loan) => (loan.id === activeLoan.id ? simulateYield(loan, days) : loan))
      );
    },
    continueActiveLoan() {
      if (!activeLoan) return;
      setLoans((current) =>
        current.map((loan) => (loan.id === activeLoan.id ? continueBorrowing(loan) : loan))
      );
    },
    withdrawActiveLoan() {
      if (!activeLoan) return;
      setLoans((current) =>
        current.map((loan) => (loan.id === activeLoan.id ? withdrawAfterRepayment(loan) : loan))
      );
    },
    vaultBuySol() {
      if (!activeLoan || activeLoan.vaultStatus === "liquidated" || activeLoan.lenderApprovalStatus !== "approved") return;
      setLoans((current) =>
        current.map((loan) => {
          if (loan.id !== activeLoan.id) return loan;
          const spendUsdc = Math.min(200, loan.vaultUsdc);
          const nextLoan = {
            ...loan,
            vaultUsdc: loan.vaultUsdc - spendUsdc,
            vaultSol: loan.vaultSol + spendUsdc / loan.solPrice,
            funded: true,
            vaultStatus: "strategy" as const
          };
          return refreshVaultRisk(nextLoan);
        })
      );
    },
    vaultSellSol() {
      if (!activeLoan || activeLoan.vaultStatus === "liquidated" || activeLoan.lenderApprovalStatus !== "approved") return;
      setLoans((current) =>
        current.map((loan) => {
          if (loan.id !== activeLoan.id) return loan;
          const sellSol = Math.min(1, loan.vaultSol);
          const nextLoan = {
            ...loan,
            vaultUsdc: loan.vaultUsdc + sellSol * loan.solPrice,
            vaultSol: loan.vaultSol - sellSol,
            funded: true,
            vaultStatus: "strategy" as const
          };
          return refreshVaultRisk(nextLoan);
        })
      );
    },
    simulatePriceMove() {
      if (!activeLoan || activeLoan.vaultStatus === "liquidated" || activeLoan.lenderApprovalStatus !== "approved") return;
      setLoans((current) =>
        current.map((loan) => {
          if (loan.id !== activeLoan.id) return loan;
          const move = 1 + (Math.random() * 0.24 - 0.12);
          const nextLoan = {
            ...loan,
            solPrice: Math.max(20, Math.round(loan.solPrice * move * 100) / 100)
          };
          return refreshVaultRisk(nextLoan);
        })
      );
    },
    runRiskCheck() {
      if (!activeLoan) return;
      setLoans((current) =>
        current.map((loan) => (loan.id === activeLoan.id ? refreshVaultRisk(loan) : loan))
      );
    },
    resetDemo() {
      setLoans(seedLoans);
      setActiveLoanIdState(seedLoans[0].id);
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(activeKey);
    },
    runDemoScenario(scenario) {
      if (!activeLoan) return;
      if (activeLoan.borrowerApprovalStatus !== "approved" || activeLoan.lenderApprovalStatus !== "approved" || !activeLoan.funded) return;
      setLoans((current) =>
        current.map((loan) => (loan.id === activeLoan.id ? applyDemoScenario(loan, scenario) : loan))
      );
    },
    setActiveLoanId(id) {
      setActiveLoanIdState(id);
    },
    // On-chain integration
    mode,
    setMode,
    async initVaultOnChain(loanId: string) {
      if (!activeLoan) return { success: false, error: "No active loan" };
      try {
        const res = await fetch("/api/vault-init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loanId,
            loanAmount: activeLoan.amount,
            collateralAmount: activeLoan.collateral,
            creditScore: activeLoan.risk.creditScore,
            riskLevel: activeLoan.risk.riskLevel,
            collateralRatioBps: Math.round((activeLoan.collateral / activeLoan.amount) * 10000),
            zkProofHash: "",
            auth: { publicKey: activeLoan.borrower, signature: "", message: `CreditVault:${Date.now()}` }
          })
        });
        const data = await res.json();
        if (!data.success) return { success: false, error: data.error };
        return { success: true, tx: data.vault };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    async syncFromChain() {
      try {
        const res = await fetch("/api/vault-state");
        const data = await res.json();
        if (data.success && data.vaults?.length > 0) {
          console.log(`[Chain Sync] Found ${data.vaults.length} on-chain vaults`);
        }
      } catch (err) {
        console.error("[Chain Sync] Failed:", err);
      }
    }
  }), [activeLoan, loans, mode]);

  return <LoanContext.Provider value={value}>{children}</LoanContext.Provider>;
}

export function useLoans() {
  const context = useContext(LoanContext);
  if (!context) throw new Error("useLoans must be used within LoanProvider");
  return context;
}
