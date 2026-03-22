"""
Autonomous research loop. Usage: uv run researcher/loop.py

Each iteration:
  1. Run backtest, parse score
  2. Accept (commit) or reject (revert) strategy.py
  3. Call Claude API to propose next modification to strategy.py
  4. Repeat forever
"""

import json
import os
import subprocess
import sys
from pathlib import Path

import anthropic

REPO_ROOT = Path(__file__).parent.parent
RESULTS_JSONL = REPO_ROOT / "researcher" / "results.jsonl"
BEST_JSON = REPO_ROOT / "researcher" / "best.json"
STRATEGY_PY = REPO_ROOT / "strategy.py"
PROGRAM_MD = REPO_ROOT / "program.md"


def read_best_score() -> float:
    if BEST_JSON.exists():
        try:
            return json.loads(BEST_JSON.read_text()).get("score", 0.0)
        except Exception:
            pass
    return 0.0


def read_last_results(n: int = 10) -> list[dict]:
    if not RESULTS_JSONL.exists():
        return []
    lines = RESULTS_JSONL.read_text().splitlines()
    records = []
    for line in lines:
        line = line.strip()
        if line:
            try:
                records.append(json.loads(line))
            except Exception:
                pass
    return records[-n:]


def update_last_result_status(status: str):
    """Rewrite results.jsonl updating the last entry's status field."""
    if not RESULTS_JSONL.exists():
        return
    lines = RESULTS_JSONL.read_text().splitlines()
    # Find last non-empty line
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].strip():
            try:
                record = json.loads(lines[i])
                record["status"] = status
                lines[i] = json.dumps(record)
            except Exception:
                pass
            break
    RESULTS_JSONL.write_text("\n".join(lines) + "\n")


def get_generation() -> int:
    result = subprocess.run(
        ["git", "rev-list", "--count", "HEAD"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    if result.returncode == 0:
        return int(result.stdout.strip())
    return 0


def run_backtest() -> tuple[float, str]:
    """Run backtest, return (score, stdout). Score is -999 on crash/parse failure."""
    result = subprocess.run(
        ["uv", "run", "backtest.py"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    stdout = result.stdout + result.stderr
    score = -999.0
    for line in stdout.splitlines():
        if line.startswith("score:"):
            try:
                score = float(line.split(":")[1].strip())
            except Exception:
                pass
            break
    return score, stdout


def git_accept(gen: int, score: float):
    subprocess.run(["git", "add", "strategy.py"], cwd=REPO_ROOT, check=True)
    subprocess.run(
        ["git", "commit", "-m", f"exp{gen}: score {score:.3f}"],
        cwd=REPO_ROOT, check=True
    )


def git_reject():
    subprocess.run(["git", "checkout", "strategy.py"], cwd=REPO_ROOT, check=True)


def propose_strategy(client: anthropic.Anthropic, last_results: list[dict]) -> str:
    """Call Claude API and return the proposed complete strategy.py contents."""
    strategy_code = STRATEGY_PY.read_text()
    program_instructions = PROGRAM_MD.read_text()

    results_summary = json.dumps(last_results, indent=2) if last_results else "[]"

    prompt = f"""You are an autonomous trading strategy researcher. Your task is to propose ONE modification to strategy.py to improve the backtest score.

## Instructions from program.md
{program_instructions}

## Current strategy.py
```python
{strategy_code}
```

## Last {len(last_results)} results (most recent last)
```json
{results_summary}
```

## Your task
Propose ONE specific modification to improve the score. Output ONLY the complete new contents of strategy.py — no explanation, no markdown fences, no commentary. Start directly with the Python code."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    print("Starting autonomous research loop. Ctrl+C to stop.")
    iteration = 0

    while True:
        iteration += 1
        gen = get_generation()
        best_score = read_best_score()
        print(f"\n[gen {gen} | iter {iteration} | best {best_score:.3f}] Running backtest...")

        score, stdout = run_backtest()
        print(f"  score: {score:.6f}")

        if score > best_score:
            print(f"  ACCEPTED (improvement: {score:.3f} > {best_score:.3f})")
            git_accept(gen + 1, score)
            update_last_result_status("accepted")
            # best.json is already written by backtest.py
        else:
            print(f"  REJECTED (no improvement: {score:.3f} <= {best_score:.3f})")
            git_reject()
            update_last_result_status("rejected")

        last_results = read_last_results(10)
        print("  Asking Claude for next modification...")
        try:
            new_strategy = propose_strategy(client, last_results)
            STRATEGY_PY.write_text(new_strategy)
            print("  strategy.py updated.")
        except Exception as e:
            print(f"  Claude API error: {e}", file=sys.stderr)
            print("  Retrying next iteration with unchanged strategy.")


if __name__ == "__main__":
    main()
