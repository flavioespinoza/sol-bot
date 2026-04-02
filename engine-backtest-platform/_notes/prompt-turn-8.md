# Turn 8 — D3 Candlestick Chart

Build the D3 candlestick chart as a React component (e.g. `engine-backtest-platform/src/components/CandlestickChart.tsx`) and render it on the main page.

Load candle data from the `/api/backtest` route (which already returns OTT candle data). Render all 1,885 bars:

- Green for bullish candles (close > open), red for bearish
- Wicks for high/low
- Dark background
- X axis with date labels
- Y axis with price on the right side

Start the dev server and confirm the chart renders without errors. Describe exactly what it looks like.
