# Turn 11 — Equity Curve and Trade Log

Two things left for the core UI.

**1. Equity Curve Chart**

Add a D3 line chart below the candlestick chart showing:

- Strategy equity over time (solid line)
- Buy & hold equity over time (dashed line)
- X axis synced with the candlestick chart (same date range)
- Y axis showing dollar values

**2. Trade Log Table**

Add a scrollable table below the equity curve showing every trade:

- Date
- Action (LONG / FLAT)
- Price
- Equity
- Return %

When both are done, run the full backtest with EMA 40 at 4% and confirm the results panel shows 96 trades and 17,663% return.
