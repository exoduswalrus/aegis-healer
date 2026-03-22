"use client";

interface Props {
  genCount: number;
  bestScore: number;
  accepted: number;
  rejected: number;
  lookAhead: number;
  bestSharpe: number;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex-1 border border-[#0ff3]/10 bg-[#0a1015] px-5 py-4 relative overflow-hidden group hover:border-[#0ff3]/30 transition-colors">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0ff3]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-[10px] tracking-[0.25em] text-zinc-500 uppercase mb-2">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${accent ?? "text-white"}`}>{value}</div>
    </div>
  );
}

export function StatBar({ genCount, bestScore, accepted, rejected, lookAhead, bestSharpe }: Props) {
  return (
    <div className="flex gap-3">
      <Stat label="Gen Count" value={String(genCount)} />
      <Stat label="Best Score" value={bestScore.toFixed(4)} accent="text-[#0ff3]" />
      <Stat label="Accepted" value={String(accepted)} accent="text-emerald-400" />
      <Stat label="Rejected" value={String(rejected)} accent="text-red-500" />
      <Stat label="Look-Ahead" value={String(lookAhead)} accent="text-amber-400" />
      <Stat label="Best Sharpe" value={bestSharpe.toFixed(2)} accent="text-sky-400" />
    </div>
  );
}
