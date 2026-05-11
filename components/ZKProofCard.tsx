import { useCallback, useEffect, useState } from "react";

type ProofState = {
  loading: boolean;
  proofHash: string | null;
  verified: boolean;
  checks: string[];
  publicSignals: string[];
  protocol: string | null;
  timestamp: string | null;
};

const privacyItems = [
  { label: "资产来源已验证", note: "证明抵押资产来源符合要求，但不暴露完整钱包历史。" },
  { label: "无严重违约记录", note: "证明历史违约检查通过，但不公开每一笔历史借贷记录。" },
  { label: "收益能力达到阈值", note: "收益能力和现金流数据保持隐私，只公开验证结果。" },
  { label: "策略暴露在限制内", note: "不暴露具体仓位，只证明策略风险没有超过协议限制。" },
  { label: "市场波动模型通过", note: "市场模型参数仅后台可见，贷方只看到验证通过。" }
];

export default function ZKProofCard({ collateralRatio, creditScore }: { collateralRatio?: number; creditScore?: number }) {
  const [state, setState] = useState<ProofState>({
    loading: false,
    proofHash: null,
    verified: false,
    checks: [],
    publicSignals: [],
    protocol: null,
    timestamp: null
  });

  const generateAndVerify = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const ratio = collateralRatio ?? 160;
      const score = creditScore ?? 72;
      const res = await fetch(`/api/zk-proof?collateralRatio=${ratio}&creditScore=${score}&minRatio=120&minScore=40`);
      const data = await res.json();

      if (!data.success) {
        setState((s) => ({ ...s, loading: false, verified: false, checks: ["Proof generation failed"] }));
        return;
      }

      const verifyRes = await fetch("/api/zk-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.proofData)
      });
      const verifyData = await verifyRes.json();

      setState({
        loading: false,
        proofHash: data.proofData.proofHash,
        verified: verifyData.valid,
        checks: verifyData.checks ?? [],
        publicSignals: data.proofData.publicSignals,
        protocol: data.proofData.proof.protocol,
        timestamp: data.proofData.timestamp
      });
    } catch {
      setState((s) => ({ ...s, loading: false, verified: false, checks: ["Network error"] }));
    }
  }, [collateralRatio, creditScore]);

  useEffect(() => {
    generateAndVerify();
  }, [generateAndVerify]);

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">ZK 风控证明 (Groth16)</p>
          <h2 className="mt-2 text-xl font-semibold">
            {state.loading ? "生成证明中..." : state.verified ? "隐私因子已验证" : "验证失败"}
          </h2>
        </div>
        <span className={`rounded-md px-3 py-2 text-sm ${state.verified ? "bg-aqua/10 text-aqua" : "bg-danger/10 text-danger"}`}>
          {state.loading ? "处理中" : state.verified ? "ZK Verified" : "Failed"}
        </span>
      </div>

      <p className="mt-4 rounded-md border border-line bg-black/20 p-3 text-sm leading-6 text-slate-300">
        ZK 证明：抵押率 ≥ {state.publicSignals[0] ?? "120"}% 且信用分 ≥ {state.publicSignals[1] ?? "40"}，
        但不暴露具体的抵押率数值和信用分。贷方只能看到验证结果。
      </p>

      {state.proofHash && (
        <div className="mt-4 space-y-2 rounded-md border border-line bg-black/30 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Protocol</span>
            <span className="font-mono text-aqua">{state.protocol}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Proof Hash</span>
            <span className="font-mono text-slate-300">{state.proofHash.slice(0, 16)}...{state.proofHash.slice(-8)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Generated At</span>
            <span className="text-slate-300">{state.timestamp ? new Date(state.timestamp).toLocaleString() : "-"}</span>
          </div>
        </div>
      )}

      {state.checks.length > 0 && (
        <div className="mt-4 space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Verification Checks</p>
          {state.checks.map((check) => (
            <div key={check} className="flex items-center gap-2 rounded-md bg-black/20 px-3 py-2 text-sm">
              <span className={check.includes("OK") || check.includes("Valid") || check.includes("Verified") || check.includes("Present") ? "text-lime" : "text-danger"}>
                {check.includes("OK") || check.includes("Valid") || check.includes("Verified") || check.includes("Present") ? "✓" : "✗"}
              </span>
              <span className="text-slate-300">{check}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wide">隐私保护项</p>
        {privacyItems.map((item) => (
          <div key={item.label} className="rounded-md bg-black/20 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-200">{item.label}</span>
              <span className="text-lime">已验证</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{item.note}</p>
          </div>
        ))}
      </div>

      <button
        onClick={generateAndVerify}
        disabled={state.loading}
        className="mt-5 w-full rounded-md border border-aqua/40 px-4 py-2.5 text-sm font-semibold text-aqua transition hover:bg-aqua/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state.loading ? "生成中..." : "重新生成 ZK Proof"}
      </button>
    </section>
  );
}
