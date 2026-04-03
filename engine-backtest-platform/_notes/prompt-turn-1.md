# Turn 1 — Plan the Python Engine

Read engine-backtest-platform/README.md before doing anything.

We're building a backtesting platform in two parts: a Python engine that runs the OTT indicator strategy on Binance CSV data, and a Next.js frontend that visualizes the results.

Start with the Python engine.

My preference is that you build the Python engine using the QuantConnect LEAN Engine (open source, Apache 2.0): https://github.com/QuantConnect/Lean — free to use locally, no subscription needed when you bring your own data (Binance CSV). Install locally with `pip install lean`.

However, LEAN runs backtests inside a Docker container. So first, check if the Docker daemon is running by executing `docker ps > /dev/null 2>&1`. If it succeeds (exit code 0), use LEAN as the backtest engine. If it fails, fall back to building a custom Python engine using pandas and numpy, following the instructions in the README.

The CSV data is at engine-backtest-platform/data/sol/binance-sol-1d-2021-to-2026-feb.csv — 1,885 daily candles for SOL/USDT from Jan 2021 through Feb 2026.

The OTT indicator logic is already implemented in TypeScript at engine-backtest-platform/src/engine/ott-indicator.ts — read it and use it as your reference for the Python implementation. The backtest loop is in engine-backtest-platform/src/engine/backtest.ts.

Before writing any code, tell me: which engine path you're using (LEAN or custom Python), how you plan to structure it, what files you'll create, and walk me through how you read the OTT algorithm from the TypeScript and how you'll translate it to Python. Do not cd into any directory — run all commands from the project root using relative paths.
