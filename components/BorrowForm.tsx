import { FormEvent, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import RiskPanel from "./RiskPanel";
import ZKProofCard from "./ZKProofCard";
import RiskFactorPanel from "./RiskFactorPanel";
import CollateralRiskTable from "./CollateralRiskTable";
import { useLoans } from "@/lib/LoanContext";
import type { RiskResult } from "@/lib/types";
import { calculateRisk } from "@/lib/mock";

export default function BorrowForm() {
  const { publicKey } = useWallet();
  const { createLoan } = useLoans();
  const [amount, setAmount] = useState(500);
  const [collateral, setCollateral] = useState(920);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [message, setMessage] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextRisk = calculateRisk(amount, collateral);
    setRisk(nextRisk);

    if (!nextRisk.approved) {
      setMessage("AI 初筛未通过：抵押率或综合评分过低，请提高抵押金额后再申请。");
      return;
    }

    createLoan(amount, collateral, publicKey?.toBase58() ?? "演示钱包");
    setMessage("借款申请已提交到后台风控。工作人员审核通过后，贷方才可以发起放款。");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="rounded-lg border border-line bg-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">借款申请</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              借方提交金额和抵押后，系统先生成 AI/ZK 风险结果，但不会直接进入市场，必须等待后台工作人员确认。
            </p>
          </div>
          <span className="rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-sm font-semibold text-amber">
            需后台审核
          </span>
        </div>

        <form className="mt-6 space-y-5" onSubmit={submit}>
          <label className="block">
            <span className="text-sm text-slate-300">借款金额 USDC</span>
            <input
              value={amount}
              min={1}
              type="number"
              onChange={(event) => setAmount(Number(event.target.value))}
              className="mt-2 w-full rounded-md border border-line bg-black/25 px-4 py-3 text-slate-100 outline-none focus:border-aqua"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">抵押金额 USDC</span>
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
            className="w-full rounded-md bg-aqua px-4 py-3 font-semibold text-ink transition hover:bg-aqua/90"
          >
            提交借款申请
          </button>
        </form>
        {message ? <p className="mt-4 rounded-md bg-black/20 p-3 text-sm text-slate-300">{message}</p> : null}
      </section>

      <div className="space-y-6">
        <RiskPanel risk={risk} />
        <CollateralRiskTable />
        <RiskFactorPanel risk={risk} />
        {risk?.approved ? <ZKProofCard /> : null}
      </div>
    </div>
  );
}
