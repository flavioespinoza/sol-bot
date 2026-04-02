# Engine Backtest Platform

A web-based charting and backtesting platform for crypto trading strategies. Candlestick charts with indicator overlays, trade signal markers, and a results dashboard. Self-hosted and fully customizable.

## Overview

This project has two parts:

1. **Python backtest engine** — built with QuantConnect LEAN. Runs the OTT indicator strategy against Binance CSV data and outputs results.
2. **Next.js frontend** — React UI that calls the Python engine via API routes and displays the chart, results panel, equity curve, and trade log.

The TypeScript files in `src/engine/` are **reference implementation only**. They show you what the OTT indicator does, what the strategy logic is, and what the expected outputs look like. **Do not use the TypeScript engine as the actual backend.** Build a Python engine using LEAN.

---

## The Python Engine (What You Build)

### Install dependencies

```bash
pip install pandas numpy
```

### Strategy

One rule:

- OTT trend is **bullish** → LONG (hold the asset, 1x, no leverage)
- OTT trend is **bearish** → FLAT (cash, no position)

### OTT Indicator

The OTT (Optimized Trend Tracker) indicator:

- Computes EMA of close prices with a given length
- Builds ratcheting support/resistance bands at ±percent around the EMA
- In an uptrend: the OTT line only moves up (ratchets up with price)
- In a downtrend: the OTT line only moves down (ratchets down with price)
- When price crosses above OTT → **BUY signal**
- When price crosses below OTT → **SELL signal**

The TypeScript implementation in `src/engine/ott-indicator.ts` is the reference. Translate this logic to Python for LEAN.

### Default Parameters

- **EMA length:** 40
- **Band percent:** 0.04 (4%)

### The Data

`data/sol/binance-sol-1d-2021-to-2026-feb.csv` — SOL/USDT daily candles from Binance. 1,885 bars, Jan 2021 through Feb 2026. No headers.

```
open_time, open, high, low, close, volume, close_time, ...
```

Timestamps are milliseconds since epoch.

### Execution Model

Next-bar entry (standard backtest convention):

- Signal fires at bar N's close
- Fill happens at bar N's close
- First P&L tick is bar N+1

### Expected Results (EMA 40, 4%)

Your Python engine must produce these numbers on the SOL/USDT dataset:

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

### Additional Parameter Settings

| EMA | Band % | Trades | Return |
|-----|--------|--------|--------|
| 25 | 3% | 146 | ~14,125% |
| 30 | 3% | 122 | ~19,920% |
| 30 | 4% | 108 | ~14,980% |
| 40 | 4% | 96 | ~17,663% |

---

## The Frontend (What You Build)

### Tech Stack

| Component | Choice |
|-----------|--------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charting | D3.js |
| State | Zustand (or React state — your call) |
| Icons | Lucide React |

### API Layer

Wire the Next.js backend to call the Python engine. The API routes should:

- Accept parameters (EMA length, band percent, starting capital)
- Run the Python LEAN backtest
- Return results as JSON to the frontend

### 1. Candlestick Chart (D3.js)

- **Candle bodies** — green (bullish, close > open), red (bearish, close < open)
- **Wicks** — high/low lines from body
- **OTT line overlay** — drawn on top of candles
- **EMA line overlay** — lighter/thinner than OTT
- **Signal markers** — arrows on BUY/SELL bars
- **Dark background** — dark theme
- **X axis** — date labels
- **Y axis** — price on right side
- **Chart header** — symbol (SOL/USDT), timeframe (1D), OHLC values
- **Zoom** — mouse wheel
- **Pan** — click and drag
- **Crosshair** — OHLC + date on hover

### 2. Backtest Controls Panel

| Control | Type | Default |
|---------|------|---------|
| EMA Length | Number input or slider | 40 |
| OTT Percent | Number input or slider | 4 (passed to engine as 0.04) |
| Starting Capital | Number input | 10000 |
| Run Backtest | Button | — |

### 3. Results Panel

| Metric | Notes |
|--------|-------|
| Total Return % | Large, prominent |
| Final Equity | Dollar value |
| Max Drawdown % | Red if > 20% |
| Trade Count | Round trips |
| Days in Market | Count + % |
| Buy & Hold Return | Side by side |
| Buy & Hold Final Equity | Comparison |

### 4. Equity Curve

D3 line chart below the candlestick chart:

- Strategy equity (solid line)
- Buy & hold equity (dashed line)
- Synced X axis with candlestick chart

### 5. Trade Log Table

Scrollable table:

```
Date | Action (LONG/FLAT) | Price | Equity | Return %
```

---

## TypeScript Reference Engine

`src/engine/` contains a verified TypeScript implementation of the same OTT strategy. Use it to understand:

- How the OTT indicator is computed (`ott-indicator.ts`)
- How the backtest loop works (`backtest.ts`)
- What the CSV format looks like (`csv-loader.ts`)
- What output structures to produce (`types.ts`)

You can verify the TypeScript engine produces correct output:

```bash
npx tsx src/engine/verify.ts
```

This should match the expected results above. Your Python LEAN engine must produce the same numbers.

---

## Important Rules

- Do not `cd` into subdirectories. Run all commands from the project root using relative paths.
- Do not modify `src/engine/` — it is reference only.
- The Python engine is the real backend. The TypeScript engine is reference only.
- Starting capital is $10,000 for all backtests.

---

## Project Structure

```
engine-backtest-platform/
├── src/
│   └── engine/          ← REFERENCE ONLY — TypeScript OTT implementation
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

---

## Success Criteria

| Criteria | Pass/Fail |
|----------|-----------|
| Python LEAN engine installed and runs | |
| OTT strategy implemented in Python | |
| EMA(40) 4% produces 96 trades, 17,663% return | |
| Results match expected values above | |
| Next.js frontend builds and runs | |
| API routes call Python engine | |
| Candlestick chart renders all 1,885 bars | |
| OTT line overlay renders on chart | |
| Buy/sell signal markers on correct bars | |
| Zoom and pan work | |
| Crosshair shows OHLC + date on hover | |
| Results panel shows correct metrics | |
| Equity curve renders with buy & hold overlay | |
| Trade log table is accurate | |
