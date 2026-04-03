# Turn 6 — Python CLI Entry Point

Before wiring up the API, create a `main.py` entry point (at `engine-backtest-platform/python/main.py` for custom Python, or equivalent for LEAN). It should:

- Accept `--ema`, `--percent`, and `--capital` as CLI arguments (defaults: 40, 0.04, 10000)
- Run the backtest
- Print the full results as JSON to stdout (metrics, trade log, and OTT candle data)

Test it: `python engine-backtest-platform/python/main.py --ema 40 --percent 0.04` and show me the JSON output (just the metrics, not the full candle array).
