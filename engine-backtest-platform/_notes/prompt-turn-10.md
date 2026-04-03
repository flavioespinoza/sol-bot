# Turn 10 — Results Panel and Backtest Controls

Build the results panel and backtest controls. After running a backtest, the results panel should show:

- Total return % (large, prominent)
- Final equity in dollars
- Max drawdown % (red if over 20%)
- Trade count
- Days in market with count and percentage
- Buy & hold return % and final equity side by side for comparison

Build the backtest controls panel with:

- EMA Length: number input or slider (default 40)
- OTT Percent: number input or slider (default 4, passed to engine as 0.04)
- Starting Capital: number input (default 10000)
- Run Backtest button

When the user changes parameters and hits Run Backtest, it should call `/api/backtest` with the new parameters and update both the results panel and the candlestick chart.
