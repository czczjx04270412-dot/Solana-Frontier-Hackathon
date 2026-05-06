const rows = [
  ["≥ 180%", "低风险", "90 - 100", "非常安全"],
  ["160% - 180%", "较低风险", "75 - 90", "安全"],
  ["140% - 160%", "中风险", "60 - 75", "可接受"],
  ["120% - 140%", "较高风险", "40 - 60", "接近危险"],
  ["100% - 120%", "高风险", "20 - 40", "容易清算"],
  ["< 100%", "爆仓区", "0 - 20", "不允许借"]
];

export default function CollateralRiskTable() {
  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Collateral Rule</p>
      <h2 className="mt-2 text-xl font-semibold">抵押率风险表</h2>
      <div className="mt-5 overflow-hidden rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/30 text-slate-400">
            <tr>
              <th className="px-3 py-3 font-medium">抵押率</th>
              <th className="px-3 py-3 font-medium">风险等级</th>
              <th className="px-3 py-3 font-medium">分数</th>
              <th className="px-3 py-3 font-medium">解释</th>
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
