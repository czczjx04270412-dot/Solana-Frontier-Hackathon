const rows = [
  ["≥ 180%", "Low Risk", "90 - 100", "High collateral, stable strategy, low volatility"],
  ["150% - 180%", "Medium Risk", "60 - 90", "Moderate collateral, medium strategy risk"],
  ["130% - 150%", "High Risk", "40 - 60", "Low collateral ratio, suitable for higher rates"],
  ["120% - 130%", "Liquidation Warning", "20 - 40", "Near forced liquidation threshold"],
  ["< 120%", "Liquidation Zone", "0 - 20", "Stop strategy and close protocol"]
];

export default function CollateralRiskTable() {
  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Collateral Rules</p>
      <h2 className="mt-2 text-xl font-semibold">Public Collateral Risk Table</h2>
      <div className="mt-5 overflow-hidden rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/30 text-slate-400">
            <tr>
              <th className="px-3 py-3 font-medium">Collateral Ratio</th>
              <th className="px-3 py-3 font-medium">Risk Level</th>
              <th className="px-3 py-3 font-medium">Score</th>
              <th className="px-3 py-3 font-medium">Explanation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-t border-line">
                {row.map((cell) => (
                  <td key={cell} className="px-3 py-3 text-slate-300">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
