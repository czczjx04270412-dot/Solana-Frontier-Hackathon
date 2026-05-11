import { FormEvent, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import RiskPanel from "./RiskPanel";
import ZKProofCard from "./ZKProofCard";
import RiskFactorPanel from "./RiskFactorPanel";
import CollateralRiskTable from "./CollateralRiskTable";
import { useLoans } from "@/lib/LoanContext";
import type { RiskResult } from "@/lib/types";

export default function BorrowForm() {
  const { publicKey } = useWallet();
  const { createLoan } = useLoans();
  const [amount, setAmount] = useState(500);
  const [collateral, setCollateral] = useState(800);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/risk?amount=${amount}&collateral=${collateral}`);
      const nextRisk: RiskResult = await res.json();
      setRisk(nextRisk);
      if (!nextRisk.approved) {
        setMessage("AI risk assessment failed. Please increase collateral amount and try again.");
        return;
      }
      createLoan(amount, collateral, publicKey?.toBase58() ?? "Demo Wallet");
      setMessage("Loan application created. AI risk score generated. Funds will enter Vault after funding approval.");
    } catch (err) {
      console.error(err);
      setMessage("Risk assessment request failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="rounded-lg border border-line bg-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Loan Application</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              After submitting amount and collateral, the system generates AI/ZK risk results. It will not enter the market directly and must be confirmed by admin.
            </p>
          </div>
          <span className="rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-sm font-semibold text-amber">
            Admin Review Required
          </span>
        </div>

        <form className="mt-6 space-y-5" onSubmit={submit}>
          <label className="block">
            <span className="text-sm text-slate-300">Loan Amount (USDC)</span>
            <input
              value={amount}
              min={1}
              type="number"
              onChange={(event) => setAmount(Number(event.target.value))}
              className="mt-2 w-full rounded-md border border-line bg-black/25 px-4 py-3 text-slate-100 outline-none focus:border-aqua"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Collateral Amount (USDC)</span>
            <input
              value={collateral}
              min={1}
              type="number"
              onChange={(event) => setCollateral(Number(event.target.value))}
              className="mt-2 w-full rounded-md border border-line bg-black/25 px-4 py-3 text-slate-100 outline-none focus:border-aqua"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-aqua px-4 py-3 font-semibold text-ink transition hover:bg-aqua/90 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {loading ? "AI Risk Assessing..." : "Submit Loan Application"}
          </button>
        </form>
        {message ? <p className="mt-4 rounded-md bg-black/20 p-3 text-sm text-slate-300">{message}</p> : null}
      </section>

      <div className="space-y-6">
        <RiskPanel risk={risk} />
        <CollateralRiskTable />
        <RiskFactorPanel risk={risk} />
        {risk?.approved ? <ZKProofCard collateralRatio={risk.collateralRatio} creditScore={risk.creditScore} /> : null}
      </div>
    </div>
  );
}
