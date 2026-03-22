"use client";

import { ResearchResult } from "@/types";

interface Props {
  result: ResearchResult;
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${color ?? "text-white"}`}>{value}</div>
    </div>
  );
}

export function BestStrategyCard({ result }: Props) {
  const pnlColor = result.total_return_pct >= 0 ? "text-emerald-400" : "text-red-400";
  const ts = new Date(result.timestamp).toLocaleString();

  return (
    <div className="border border-[#0ff3]/20 bg-[#0a1015] p-6 relative overflow-hidden">
      {/* Corner accent */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#0ff3]/40" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#0ff3]/20" />

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.3em] text-[#0ff3]/60 uppercase mb-1">
            Best Strategy — Gen {result.generation}
          </div>
          <div className="text-xs text-zinc-600">{ts}</div>
        </div>
        <div className="text-[10px] tracking-widest text-zinc-600 border border-zinc-800 px-3 py-1">
          {result.status.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-6">
        <Metric
          label="Total Return"
          value={`${result.total_return_pct >= 0 ? "+" : ""}${result.total_return_pct.toFixed(2)}%`}
          color={pnlColor}
        />
        <Metric label="Sharpe" value={result.sharpe.toFixed(3)} color="text-sky-400" />
        <Metric label="Score" value={result.score.toFixed(4)} color="text-[#0ff3]" />
        <Metric
          label="Max Drawdown"
          value={`${result.max_drawdown_pct.toFixed(3)}%`}
          color="text-amber-400"
        />
        <Metric label="Win Rate" value={`${result.win_rate_pct.toFixed(1)}%`} color="text-emerald-400" />
        <Metric label="Trades" value={result.num_trades.toLocaleString()} />
      </div>

      {result.strategy_notes && (
        <div className="mt-4 text-xs text-zinc-500 border-t border-zinc-800 pt-4 italic">
          {result.strategy_notes}
        </div>
      )}
    </div>
  );
}
