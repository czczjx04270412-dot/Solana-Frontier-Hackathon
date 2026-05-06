import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { Loan } from "./types";
import { buildLoan, seedLoans, simulateYield } from "./mock";

type LoanContextValue = {
  loans: Loan[];
  activeLoan: Loan | null;
  createLoan: (amount: number, collateral: number, borrower: string) => Loan;
  fundLoan: (id: string) => void;
  accrueYield: (days?: number) => void;
  setActiveLoanId: (id: string) => void;
};

const LoanContext = createContext<LoanContextValue | null>(null);
const storageKey = "solana-defi-vault-loans-v2";
const activeKey = "solana-defi-vault-active-loan-v2";

export function LoanProvider({ children }: { children: ReactNode }) {
  const [loans, setLoans] = useState<Loan[]>(seedLoans);
  const [activeLoanId, setActiveLoanIdState] = useState<string>(seedLoans[0].id);

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
          loan.id === id ? { ...loan, funded: true, vaultStatus: "funded" } : loan
        )
      );
      setActiveLoanIdState(id);
    },
    accrueYield(days = 1) {
      if (!activeLoan) return;
      setLoans((current) =>
        current.map((loan) => (loan.id === activeLoan.id ? simulateYield(loan, days) : loan))
      );
    },
    setActiveLoanId(id) {
      setActiveLoanIdState(id);
    }
  }), [activeLoan, loans]);

  return <LoanContext.Provider value={value}>{children}</LoanContext.Provider>;
}

export function useLoans() {
  const context = useContext(LoanContext);
  if (!context) throw new Error("useLoans must be used within LoanProvider");
  return context;
}
