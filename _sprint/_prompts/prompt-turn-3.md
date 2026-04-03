# Turn 3 — OTT Indicator

Now implement the OTT indicator in Python. If you're using the custom Python engine, create it at `engine-backtest-platform/python/ott.py`. If you're using LEAN, add it to your LEAN algorithm.

It needs: EMA of close prices, ratcheting bands at ±percent around the EMA, trend detection (price above OTT = bullish, below = bearish), and buy/sell signals on trend flips. Use the TypeScript implementation in engine-backtest-platform/src/engine/ott-indicator.ts as your exact reference.

Use the default parameters (EMA length 40, band percent 0.04) and print the first 10 rows of output with timestamp, close, ema, ott, and trend so I can verify it looks right.
