"use client";

import { ResearchResult } from "@/types";
import { useMemo } from "react";

interface Props {
  results: ResearchResult[];
}

const W = 1100;
const H = 260;
const PAD = { top: 20, right: 30, bottom: 40, left: 60 };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function ScoreChart({ results }: Props) {
  const data = useMemo(() => {
    if (results.length === 0) return null;

    const scores = results.map((r) => r.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore || 1;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const xScale = (i: number) => (i / Math.max(results.length - 1, 1)) * innerW;
    const yScale = (s: number) => innerH - ((s - minScore) / scoreRange) * innerH;

    // Best-so-far line
    let best = -Infinity;
    const bestLine: { x: number; y: number }[] = [];
    results.forEach((r, i) => {
      if (r.score > best) best = r.score;
      bestLine.push({ x: xScale(i), y: yScale(best) });
    });

    const linePath = bestLine
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    // Y axis ticks
    const ticks = 5;
    const yTicks = Array.from({ length: ticks }, (_, i) => {
      const val = minScore + (scoreRange / (ticks - 1)) * i;
      return { y: yScale(val), label: val.toFixed(1) };
    });

    // X axis ticks (every ~20 points)
    const step = Math.max(1, Math.floor(results.length / 8));
    const xTicks = results
      .filter((_, i) => i % step === 0)
      .map((r, idx) => ({
        x: xScale(idx * step),
        label: String(r.generation),
      }));

    const dots = results.map((r, i) => ({
      x: xScale(i),
      y: yScale(r.score),
      status: r.status,
      score: r.score,
      gen: r.generation,
    }));

    return { dots, linePath, yTicks, xTicks, minScore, maxScore };
  }, [results]);

  if (!data) {
    return (
      <div className="border border-[#0ff3]/10 bg-[#0a1015] p-6 h-[320px] flex items-center justify-center text-zinc-600 text-xs tracking-widest">
        AWAITING DATA...
      </div>
    );
  }

  const dotColor = (status: string) => {
    if (status === "accepted") return "#34d399";
    if (status === "look_ahead") return "#fbbf24";
    if (status === "completed") return "#38bdf8";
    return "#ef4444";
  };

  return (
    <div className="border border-[#0ff3]/10 bg-[#0a1015] p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase">Score Progression</span>
        <div className="flex items-center gap-5 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Accepted</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Rejected</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Look-ahead</span>
          <span className="flex items-center gap-1.5"><span className="w-8 h-px bg-[#0ff3]/60 inline-block" />Best so far</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
      >
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Grid lines */}
          {data.yTicks.map((t, i) => (
            <line
              key={i}
              x1={0} y1={t.y}
              x2={W - PAD.left - PAD.right} y2={t.y}
              stroke="#0ff31a"
              strokeOpacity={0.06}
              strokeDasharray="4 4"
            />
          ))}

          {/* Y axis labels */}
          {data.yTicks.map((t, i) => (
            <text
              key={i}
              x={-10} y={t.y + 4}
              textAnchor="end"
              fill="#52525b"
              fontSize={10}
              fontFamily="monospace"
            >
              {t.label}
            </text>
          ))}

          {/* X axis labels */}
          {data.xTicks.map((t, i) => (
            <text
              key={i}
              x={t.x} y={H - PAD.top - PAD.bottom + 18}
              textAnchor="middle"
              fill="#52525b"
              fontSize={10}
              fontFamily="monospace"
            >
              {t.label}
            </text>
          ))}

          {/* Best-so-far dashed line */}
          <path
            d={data.linePath}
            fill="none"
            stroke="#0ff3"
            strokeOpacity={0.5}
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />

          {/* Dots */}
          {data.dots.map((d, i) => (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={3.5}
              fill={dotColor(d.status)}
              fillOpacity={0.85}
            >
              <title>{`Gen ${d.gen} | Score ${d.score.toFixed(4)} | ${d.status}`}</title>
            </circle>
          ))}
        </g>
      </svg>
    </div>
  );
}
