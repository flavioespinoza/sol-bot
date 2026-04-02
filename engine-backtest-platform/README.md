# Engine Backtest Platform

A web-based charting and backtesting platform for crypto trading strategies. Candlestick charts with indicator overlays, trade signal markers, and a results dashboard. Self-hosted and fully customizable.

## Overview

This project has two parts:

1. **Python backtest engine** — Runs the OTT indicator strategy against Binance CSV data and outputs results.
2. **Next.js frontend** — React UI that calls the Python engine via API routes and displays the chart, results panel, equity curve, and trade log.

The TypeScript files in `src/engine/` are **reference implementation only**. They show you what the OTT indicator does, what the strategy logic is, and what the expected outputs look like. **Do not use the TypeScript engine as the actual backend.**

---

## Step 0: Choose Your Engine (Docker Check)

Before building anything, check if the Docker daemon is available:

```bash
docker ps > /dev/null 2>&1
```

- **If that command succeeds (exit code 0):** Use **QuantConnect LEAN** as the backtest engine. See [Option A: LEAN Engine](#option-a-lean-engine-docker-available) below.
- **If it fails:** Fall back to a **custom Python engine** using pandas and numpy. See [Option B: Custom Python Engine](#option-b-custom-python-engine-fallback) below.

---

## Option A: LEAN Engine (Docker Available)

Use the open-source [QuantConnect LEAN engine](https://github.com/QuantConnect/Lean) (Apache 2.0). It runs locally via Docker — no subscription needed when you bring your own data.

### Install the LEAN CLI

```bash
pip install lean
```

### Initialize

```bash
lean init
```

### Strategy

Implement the OTT indicator strategy as a LEAN algorithm (Python). The algorithm should:

- Compute the OTT indicator (EMA + ratcheting bands) — see `src/engine/ott-indicator.ts` for reference
- **OTT trend bullish** → LONG (hold the asset, 1x, no leverage)
- **OTT trend bearish** → FLAT (cash, no position)
- Use the Binance SOL/USDT daily CSV in `data/sol/` as the data source

### Run backtest

```bash
lean backtest <project-name>
```

This pulls and runs the `quantconnect/lean` Docker image. Results must match the expected values in the [Expected Results](#expected-results-ema-40-4) section below.

### Default Parameters

- **EMA length:** 40
- **Band percent:** 0.04 (4%)

---

## Option B: Custom Python Engine (Fallback)

If Docker is not available, build a pure Python engine. No frameworks required — just pandas and numpy.

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

The TypeScript implementation in `src/engine/ott-indicator.ts` is the reference. Translate this logic to Python.

### Default Parameters

- **EMA length:** 40
- **Band percent:** 0.04 (4%)

---

## The Data (Both Options)

`data/sol/binance-sol-1d-2021-to-2026-feb.csv` — SOL/USDT daily candles from Binance. 1,885 bars, Jan 2021 through Feb 2026. No headers.

```
open_time, open, high, low, close, volume, close_time, ...
```

Timestamps are milliseconds since epoch.

---

## Execution Model (Both Options)

Next-bar entry (standard backtest convention):

- Signal fires at bar N's close
- Fill happens at bar N's close
- First P&L tick is bar N+1

---

## Expected Results (EMA 40, 4%)

Whichever engine you use (LEAN or custom Python), it must produce these numbers on the SOL/USDT dataset:

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
- Run the backtest engine (LEAN CLI or custom Python script, whichever was built)
- Return results as JSON to the frontend

### 1. Candlestick Chart (D3.js)

- **Candle bodies** — green (bullish, close > open), red (bearish, close < open)
- **Wicks** — high/low lines from body
- **OTT line overlay** — drawn on top of candles
- **EMA line overlay** — lighter/thinner than OTT
- **Signal markers** — blue arrows up on BUY bars, pink arrows down on SELL bars
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

This should match the expected results above. Your Python engine must produce the same numbers.

---

## Important Rules

- **First, check Docker:** Run `docker ps > /dev/null 2>&1`. If exit code is 0, use Option A (LEAN). If it fails, use Option B (custom Python).
- Do not `cd` into subdirectories. Run all commands from the project root using relative paths.
- Do not modify `src/engine/` — it is reference only.
- The TypeScript engine is reference only. The real backend is either LEAN (Option A) or custom Python (Option B).
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
├── python/              ← Option B: custom Python engine (created if no Docker)
│   ├── ott.py
│   ├── backtest.py
│   ├── loader.py
│   └── main.py
├── lean/                ← Option A: LEAN project (created if Docker available)
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
| Docker check performed before building engine | |
| If Docker available: LEAN engine set up and runs | |
| If no Docker: custom Python engine built and runs | |
| OTT strategy implemented correctly | |
| EMA(40) 4% produces 96 trades, 17,663% return | |
| Results match expected values above | |
| Next.js frontend builds and runs | |
| API routes call the backtest engine | |
| Candlestick chart renders all 1,885 bars | |
| OTT line overlay renders on chart | |
| Buy/sell signal markers on correct bars | |
| Zoom and pan work | |
| Crosshair shows OHLC + date on hover | |
| Results panel shows correct metrics | |
| Equity curve renders with buy & hold overlay | |
| Trade log table is accurate | |
