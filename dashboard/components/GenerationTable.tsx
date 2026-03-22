"use client";

import { ResearchResult } from "@/types";

interface Props {
  results: ResearchResult[];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    accepted: "bg-emerald-950 text-emerald-400 border-emerald-800",
    rejected: "bg-red-950 text-red-400 border-red-900",
    look_ahead: "bg-amber-950 text-amber-400 border-amber-800",
    completed: "bg-sky-950 text-sky-400 border-sky-900",
  };
  const style = styles[status] ?? "bg-zinc-900 text-zinc-400 border-zinc-700";
  return (
    <span className={`text-[10px] tracking-widest px-2 py-0.5 border ${style}`}>
      {status.replace("_", "-").toUpperCase()}
    </span>
  );
}

const cols = [
  { label: "GEN", key: "generation" },
  { label: "SCORE", key: "score" },
  { label: "SHARPE", key: "sharpe" },
  { label: "PNL %", key: "total_return_pct" },
  { label: "WIN %", key: "win_rate_pct" },
  { label: "MAX DD", key: "max_drawdown_pct" },
  { label: "TRADES", key: "num_trades" },
  { label: "STATUS", key: "status" },
];

export function GenerationTable({ results }: Props) {
  return (
    <div className="border border-[#0ff3]/10 bg-[#0a1015]">
      <div className="px-6 py-4 border-b border-zinc-800/60">
        <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase">
          Generation Log — {results.length} experiments
        </span>
      </div>
      <div className="overflow-auto max-h-[480px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#0a1015] border-b border-zinc-800/60">
            <tr>
              {cols.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-3 text-left text-[10px] tracking-[0.2em] text-zinc-500 font-normal"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => {
              const isAccepted = r.status === "accepted";
              const rowBg = isAccepted
                ? "bg-emerald-950/20 hover:bg-emerald-950/30"
                : "hover:bg-zinc-900/40";

              return (
                <tr
                  key={i}
                  className={`border-b border-zinc-800/30 transition-colors ${rowBg}`}
                >
                  <td className="px-4 py-2.5 tabular-nums text-zinc-400">{r.generation}</td>
                  <td className={`px-4 py-2.5 tabular-nums font-bold ${r.score > 0 ? "text-[#0ff3]" : "text-red-400"}`}>
                    {r.score.toFixed(4)}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-sky-400">{r.sharpe.toFixed(3)}</td>
                  <td className={`px-4 py-2.5 tabular-nums ${r.total_return_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {r.total_return_pct >= 0 ? "+" : ""}{r.total_return_pct.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-zinc-300">{r.win_rate_pct.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 tabular-nums text-amber-400">{r.max_drawdown_pct.toFixed(3)}%</td>
                  <td className="px-4 py-2.5 tabular-nums text-zinc-400">{r.num_trades.toLocaleString()}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {results.length === 0 && (
          <div className="px-6 py-12 text-center text-zinc-600 text-xs tracking-widest">
            NO DATA YET
          </div>
        )}
      </div>
    </div>
  );
}
