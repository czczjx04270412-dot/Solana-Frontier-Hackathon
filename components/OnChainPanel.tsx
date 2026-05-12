import { useEffect, useState } from "react";
import AddressDisplay from "./AddressDisplay";

interface VaultOnChain {
  address: string;
  data: {
    borrower: string;
    lender: string;
    loanAmount: number;
    collateralAmount: number;
    currentCollateral: number;
    vaultNav: number;
    status: string;
    riskLevel: string;
    creditScore: number;
    lenderProfitLocked: number;
    yieldRounds: number;
    cumulativePnl: number;
  };
}

interface KeeperStatus {
  totalVaults: number;
  activeVaults: number;
  liquidatable: { vault: string; collateralRatioBps: number }[];
  atRisk: { vault: string; collateralRatioBps: number }[];
  message: string;
}

export default function OnChainPanel() {
  const [vaults, setVaults] = useState<VaultOnChain[]>([]);
  const [keeper, setKeeper] = useState<KeeperStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vaultRes, keeperRes] = await Promise.all([
        fetch("/api/vault-state"),
        fetch("/api/keeper"),
      ]);
      const vaultData = await vaultRes.json();
      const keeperData = await keeperRes.json();
      if (vaultData.success) setVaults(vaultData.vaults ?? []);
      if (keeperData.success) setKeeper(keeperData);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch on-chain state");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">On-Chain State (Devnet)</p>
          <h2 className="mt-1 text-lg font-semibold">
            {loading ? "Loading..." : `${vaults.length} Vault(s) On-Chain`}
          </h2>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-md border border-aqua/40 px-3 py-1.5 text-xs font-semibold text-aqua transition hover:bg-aqua/10 disabled:opacity-50"
        >
          {loading ? "..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {/* Keeper Status */}
      {keeper && (
        <div className="mt-4 rounded-md border border-line bg-black/20 p-3">
          <p className="text-xs text-slate-500">Keeper Monitor</p>
          <p className="mt-1 text-sm text-slate-300">{keeper.message}</p>
          {keeper.liquidatable.length > 0 && (
            <div className="mt-2 space-y-1">
              {keeper.liquidatable.map((v) => (
                <p key={v.vault} className="text-xs text-danger">
                  ⚠ {v.vault.slice(0, 8)}... ratio: {(v.collateralRatioBps / 100).toFixed(1)}%
                </p>
              ))}
            </div>
          )}
          {keeper.atRisk.length > 0 && (
            <div className="mt-2 space-y-1">
              {keeper.atRisk.map((v) => (
                <p key={v.vault} className="text-xs text-amber-400">
                  ⚡ {v.vault.slice(0, 8)}... ratio: {(v.collateralRatioBps / 100).toFixed(1)}%
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vault List */}
      {vaults.length > 0 && (
        <div className="mt-4 space-y-3">
          {vaults.map((v) => (
            <div key={v.address} className="rounded-md border border-line bg-black/30 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400 max-w-[140px]">
                  <AddressDisplay address={v.address} />
                </span>
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                  v.data.status === "strategy" ? "bg-aqua/10 text-aqua" :
                  v.data.status === "liquidated" ? "bg-danger/10 text-danger" :
                  v.data.status === "repaid" ? "bg-lime/10 text-lime" :
                  "bg-slate-700 text-slate-300"
                }`}>
                  {v.data.status}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-slate-500">Loan</p>
                  <p className="font-semibold">{v.data.loanAmount} USDC</p>
                </div>
                <div>
                  <p className="text-slate-500">NAV</p>
                  <p className="font-semibold">{v.data.vaultNav} USDC</p>
                </div>
                <div>
                  <p className="text-slate-500">P/L</p>
                  <p className={`font-semibold ${v.data.cumulativePnl >= 0 ? "text-lime" : "text-danger"}`}>
                    {v.data.cumulativePnl >= 0 ? "+" : ""}{v.data.cumulativePnl} USDC
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {vaults.length === 0 && !loading && !error && (
        <p className="mt-4 text-sm text-slate-500">
          No vaults deployed yet. Create a loan and initialize on-chain to see data here.
        </p>
      )}
    </section>
  );
}
