# Turn 13 — Final Smoke Test

Final verification. Run through the full checklist:

1. Run the backtest with EMA 40, 4% and confirm: 96 trades, 17,663% return, $1,776,301 final equity, 65.79% max drawdown, 945/1,885 days in market (50.1%).

2. Run buy & hold and confirm: 4,479% return, $457,901 final equity.

3. Run all four parameter combos and confirm trade counts and returns match the README:
   - EMA 25 / 3%: 146 trades, ~14,125%
   - EMA 30 / 3%: 122 trades, ~19,920%
   - EMA 30 / 4%: 108 trades, ~14,980%
   - EMA 40 / 4%: 96 trades, ~17,663%

4. Start the Next.js dev server and verify:
   - Candlestick chart renders all 1,885 bars
   - OTT and EMA line overlays are visible
   - Buy/sell signal markers appear on the correct bars
   - Zoom (mouse wheel) and pan (click drag) work
   - Crosshair shows OHLC + date on hover
   - Results panel shows all metrics correctly
   - Equity curve shows strategy vs buy & hold
   - Trade log table is populated and scrollable
   - Changing parameters and hitting Run Backtest updates everything

5. Run `npm run build --prefix engine-backtest-platform` and confirm the production build passes with no errors.

Report pass/fail for each item. If anything fails, fix it.
