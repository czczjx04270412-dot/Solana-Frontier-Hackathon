const rows = [
  [">= 180%", "低风险", "90 - 100", "抵押率高，策略稳定，波动较小"],
  ["150% - 180%", "中风险", "60 - 90", "抵押率一般，策略风险中等"],
  ["130% - 150%", "高风险", "40 - 60", "抵押率偏低，需要更高目标收益"],
  ["120% - 130%", "清算预警", "20 - 40", "接近强制清算线"],
  ["< 120%", "清算区", "0 - 20", "停止策略并结束协议"]
];

export default function CollateralRiskTable() {
  return (
    <section className="rounded-md border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">COLLATERAL RULES</p>
      <h2 className="mt-2 text-xl font-semibold">公开抵押率风险表</h2>
      <div className="mt-5 overflow-hidden rounded-md border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink text-slate-400">
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
