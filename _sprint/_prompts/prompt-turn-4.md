# Turn 4 — Backtest Loop

Now implement the backtest loop. If you're using the custom Python engine, create it at `engine-backtest-platform/python/backtest.py`. If you're using LEAN, add the logic to your LEAN algorithm.

One rule: OTT bullish = long (1x, no leverage), OTT bearish = flat (cash). Use next-bar entry — signal fires at bar N close, first P&L tick is bar N+1. Track equity starting at $10,000, max drawdown, trade count, and a trade log. Use the TypeScript implementation in engine-backtest-platform/src/engine/backtest.ts as your exact reference.

Run it with EMA length 40 and band percent 0.04. I need to see: trade count, total return %, final equity, and max drawdown.

Expected results to verify against:
- Trade count: 96
- Return: 17,663%
- Max drawdown: 65.79%
- Final equity: $1,776,301

If your numbers don't match, debug before moving on.
