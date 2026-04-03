# Turn 2 — Load the Data

Good. Now write the CSV loader. If you're using the custom Python engine, create it at `engine-backtest-platform/python/loader.py`. If you're using LEAN, add the data loading to your LEAN project.

It needs to read engine-backtest-platform/data/sol/binance-sol-1d-2021-to-2026-feb.csv, parse the timestamps correctly (milliseconds since epoch), and return a clean list of OHLCV candles. Print the first 3 rows and the total candle count so I can verify it loaded correctly.
