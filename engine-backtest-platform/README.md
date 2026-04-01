# Engine Backtest Platform

A web-based charting and backtesting platform for crypto trading strategies. Candlestick charts with indicator overlays, trade signal markers, and a results dashboard. Self-hosted and fully customizable.

## What's Already Built

The backtest engine is complete and verified. It lives in `src/engine/` and does the following:

- Loads Binance OHLCV CSV data (`csv-loader.ts`)
- Computes the OTT (Optimized Trend Tracker) indicator (`ott-indicator.ts`)
- Runs a trend-following backtest strategy (`backtest.ts`)
- Returns candle data with OTT values, trend state, buy/sell signals, equity tracking, and a trade log

**You do not need to modify the engine.** Your job is to build the web UI that visualizes what the engine produces.

## The Data

`data/sol/binance-sol-1d-2021-to-2026-feb.csv` — SOL/USDT daily candles from Binance. 1,885 bars from Jan 2021 through Feb 2026. No headers. Format:

```
open_time, open, high, low, close, volume, close_time, ...
```

Timestamps are milliseconds since epoch.

## The Strategy

One rule — that's it:

- OTT trend is **bullish** → LONG (hold the asset)
- OTT trend is **bearish** → FLAT (cash, no position)

No leverage. No shorts. No multi-indicator complexity. Just trend following with OTT.

### OTT Indicator

The OTT (Optimized Trend Tracker) uses:
- An EMA (Exponential Moving Average) of close prices
- Ratcheting support/resistance bands at ±percent around the EMA
- In an uptrend, the OTT line only moves up (ratchets). In a downtrend, it only moves down.
- When price crosses above OTT → BUY signal. When price crosses below → SELL signal.

### Default Parameters

- **EMA length:** 40
- **Band percent:** 0.04 (4%)

### Verified Results (EMA 40, 4%)

These results have been independently verified. Your UI must produce these same numbers:

| Metric | Expected Value |
|--------|---------------|
| Trade count | 96 |
| Return | 17,663% |
| Max drawdown | 65.79% |
| Starting equity | $10,000 |
| Final equity | $1,776,301 |
| Days in market | 945 / 1,885 (50.1%) |
| Buy & hold return | 4,479% |
| Buy & hold equity | $457,901 |

If your results panel shows different numbers, something is wrong with how you're calling the engine.

You can verify by running: `npx tsx src/engine/verify.ts`

### Additional Settings for Reference

| EMA | Band % | Trades | Return |
|-----|--------|--------|--------|
| 25 | 3% | 146 | ~14,125% |
| 30 | 3% | 122 | ~19,920% |
| 30 | 4% | 108 | ~14,980% |
| 40 | 4% | 96 | ~17,663% |

## What to Build

### 1. Candlestick Chart (D3.js)

The centerpiece. A professional candlestick chart:

- **Candle bodies** — green (bullish, close > open), red (bearish, close < open)
- **Wicks** — high/low lines extending from body
- **OTT line overlay** — drawn on top of candles, showing the OTT indicator value
- **EMA line overlay** — the underlying EMA, lighter/thinner than OTT
- **Signal markers** — arrows or markers on bars where buy/sell signals occur
- **Dark background** — dark theme (dark gray/near-black background, light text)
- **X axis** — date labels
- **Y axis** — price scale on right side
- **Chart header** — symbol name (SOL/USDT), timeframe (1D), current OHLC values
- **Zoom** — mouse wheel zooms in/out
- **Pan** — click and drag to scroll through time
- **Crosshair** — on hover, shows vertical + horizontal lines with OHLC values and date

### 2. Backtest Controls Panel

Sidebar or top bar with controls:

| Control | Type | Default |
|---------|------|---------|
| EMA Length | Number input or slider | 40 |
| OTT Percent | Number input or slider | 4 (displayed as %, passed to engine as 0.04) |
| Starting Capital | Number input | 10000 |
| Run Backtest | Button | — |

When "Run Backtest" is clicked, call the engine with the selected parameters and update all visualizations.

### 3. Results Panel

Display these metrics prominently after a backtest run:

| Metric | Notes |
|--------|-------|
| Total Return % | Large, prominent number |
| Final Equity | Dollar value |
| Max Drawdown % | Highlight red if > 20% |
| Trade Count | Number of round trips |
| Days in Market | Count + percentage of total days |
| Buy & Hold Return | Side-by-side comparison |
| Buy & Hold Final Equity | So the user can compare strategies |

### 4. Equity Curve

A separate line chart (D3) below the candlestick chart:

- Strategy equity over time (solid line)
- Buy & hold equity overlay (dashed line, different color)
- Same X axis (time) as the candlestick chart, synced zoom/pan

### 5. Trade Log Table

Scrollable table showing every trade:

```
Date | Action (LONG/FLAT) | Price | Equity | Return %
```

## Tech Stack

| Component | Choice |
|-----------|--------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charting | D3.js |
| State | Zustand (or React state — your call) |
| Icons | Lucide React |

## How to Use the Engine

The engine exports everything from `src/engine/index.ts`:

```typescript
import { loadBinanceCsv, runBacktest, buyAndHold } from './engine'

// Load data
const candles = loadBinanceCsv('data/sol/binance-sol-1d-2021-to-2026-feb.csv')

// Run backtest
const result = runBacktest(candles, 40, 0.04) // emaLength=40, percent=4%

// result.ottCandles — array of candles with ema, ott, trend, signal fields
// result.trades — number of trades
// result.returnPct — total return percentage
// result.finalEquity — ending dollar value
// result.maxDrawdownPct — worst peak-to-trough drawdown
// result.tradeLog — array of { date, action, price, equity }
// result.bullishDays / result.bearishDays — time in/out of market

// Buy and hold comparison
const bnh = buyAndHold(candles)
// bnh.returnPct, bnh.finalEquity, bnh.maxDrawdownPct
```

The engine files use Node.js `fs` to read CSVs. For the web app, you'll need to either:
- Create an API route that loads data server-side and returns JSON
- Or load the CSV client-side via fetch and parse it in the browser

Either approach works. The OTT computation and backtest logic are pure functions — they just need an array of `OhlcvCandle` objects.

## Project Structure

```
engine-backtest-platform/
├── src/
│   └── engine/          ← DO NOT MODIFY — verified backtest engine
│       ├── types.ts
│       ├── ott-indicator.ts
│       ├── csv-loader.ts
│       ├── backtest.ts
│       └── index.ts
├── data/
│   └── sol/
│       └── binance-sol-1d-2021-to-2026-feb.csv
├── public/
├── package.json
├── tsconfig.json
└── README.md
```

Build your Next.js app around this structure. The `src/engine/` directory is a black box — import from it, don't change it.

## Success Criteria

| Criteria | Pass/Fail |
|----------|-----------|
| Candlestick chart renders all 1,885 bars | |
| Green/red candle coloring is correct | |
| OTT line overlay renders on chart | |
| Buy/sell signal markers appear on correct bars | |
| Zoom (mouse wheel) works | |
| Pan (click-drag) works | |
| Crosshair shows OHLC + date on hover | |
| Dark theme with professional aesthetic | |
| Backtest controls allow changing EMA/percent | |
| Results panel shows correct metrics | |
| EMA(40) 4% shows 96 trades, 17,663% return | |
| Equity curve renders below candlestick chart | |
| Buy & hold overlay on equity curve | |
| Trade log table is scrollable and accurate | |
