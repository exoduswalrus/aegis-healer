export interface ResearchResult {
  timestamp: string;
  generation: number;
  score: number;
  sharpe: number;
  total_return_pct: number;
  max_drawdown_pct: number;
  num_trades: number;
  win_rate_pct: number;
  profit_factor: number;
  status: "accepted" | "rejected" | "look_ahead" | "completed";
  strategy_notes?: string;
}
