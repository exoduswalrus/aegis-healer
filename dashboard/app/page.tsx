"use client";

import { useEffect, useState, useCallback } from "react";
import { StatBar } from "@/components/StatBar";
import { BestStrategyCard } from "@/components/BestStrategyCard";
import { ScoreChart } from "@/components/ScoreChart";
import { GenerationTable } from "@/components/GenerationTable";
import { ResearchResult } from "@/types";

const RESULTS_URL =
  "https://raw.githubusercontent.com/exoduswalrus/aegis-healer/autotrader%2Fmar10c/researcher/results.jsonl";

function parseJsonl(text: string): ResearchResult[] {
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      try {
        return JSON.parse(l) as ResearchResult;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as ResearchResult[];
}

export default function Home() {
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`${RESULTS_URL}?_=${Date.now()}`);
      if (!res.ok) throw new Error("fetch failed");
      const text = await res.text();
      const parsed = parseJsonl(text);
      setResults(parsed);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch results:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 10000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  const best = results.reduce<ResearchResult | null>((acc, r) => {
    if (!acc || r.score > acc.score) return r;
    return acc;
  }, null);

  const accepted = results.filter((r) => r.status === "accepted" || r.status === "completed");
  const rejected = results.filter((r) => r.status === "rejected");
  const lookAhead = results.filter((r) => r.status === "look_ahead");
  const genCount = results.length > 0 ? Math.max(...results.map((r) => r.generation)) : 0;

  return (
    <main className="min-h-screen bg-[#080c0f] text-white font-mono">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />

      {/* Header */}
      <header className="border-b border-[#0ff3]/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-[#0ff3] shadow-[0_0_8px_#0ff3] animate-pulse" />
          <span className="text-[#0ff3] text-xs tracking-[0.3em] uppercase">AEGIS / Strategy Researcher</span>
        </div>
        <div className="text-[10px] text-zinc-600 tracking-widest">
          {loading
            ? "CONNECTING..."
            : lastUpdated
            ? `SYNCED ${lastUpdated.toLocaleTimeString()}`
            : "NO DATA"}
        </div>
      </header>

      <div className="px-8 py-6 space-y-6">
        {/* Stat bar */}
        <StatBar
          genCount={genCount}
          bestScore={best?.score ?? 0}
          accepted={accepted.length}
          rejected={rejected.length}
          lookAhead={lookAhead.length}
          bestSharpe={best?.sharpe ?? 0}
        />

        {/* Best strategy */}
        {best && <BestStrategyCard result={best} />}

        {/* Chart */}
        <ScoreChart results={results} />

        {/* Table */}
        <GenerationTable results={[...results].reverse()} />
      </div>
    </main>
  );
}
