const checks = ["Collateral Ratio Proved", "Yield Ability Hidden", "Strategy Risk Hidden", "Market Volatility Hidden"];

export default function ZKProofCard() {
  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">ZK Proof Display</p>
          <h2 className="mt-2 text-xl font-semibold">隐私风控证明</h2>
        </div>
        <span className="rounded-md bg-aqua/10 px-3 py-2 text-sm text-aqua">Locked</span>
      </div>
      <div className="mt-5 space-y-3">
        {checks.map((check) => (
          <div key={check} className="flex items-center justify-between rounded-md bg-black/20 px-3 py-3">
            <span className="text-sm text-slate-300">{check}</span>
            <span className="text-lime">Verified</span>
          </div>
        ))}
      </div>
    </section>
  );
}
