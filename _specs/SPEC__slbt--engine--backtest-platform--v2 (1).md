# SPEC: Engine — Sol Bot Trading Platform

v6 | Apr 01 2026 - 01:30 PM (MST)

---

> Read this entire spec before doing anything. After you've read it, ask any clarifying questions. If there are no questions, proceed with the build.

---

## Purpose

Build a full, self-owned trading platform — Flavio's TradingView. A permanent, extensible charting and backtesting platform that replaces TradingView. It runs locally, is fully owned, and can be extended to support any strategy, any asset, any data source. Flavio will define the first backtest he wants to run once the platform is ready to receive it.

---

## Repo

**Repo name:** `engine-backtest-platform`
**Project alias:** `slbt`
**All FX-named files in this project use `slbt` as the B position.**

### Standard project directories

```txt
engine-backtest-platform/
├── _specs/
│   ├── SPEC__slbt--engine--backtest-platform--v2.md  ← this file
│   ├── SPEC__directive--fx-naming.md                  ← copy from Keymaster verbatim
│   ├── SPEC__directive--repo-naming.md                ← copy from Keymaster verbatim
│   └── SPEC__directive--how-to-write-a-spec.md        ← copy from Keymaster verbatim
├── _docs/
├── _reports/
├── _bugs/
├── _notes/
├── frontend/
├── backend/
├── data/
│   └── sol/
├── README.md
├── CLAUDE.md
└── .env.example
```

---

## What This Is

A web application with a TradingView-style interface for charting and backtesting trading strategies. The primary data source is Binance OHLCV CSV files, but the platform should be designed to accept other data formats as needed.

Flavio's trading engines and trend indicator bots are primarily written in TypeScript. Some may be written in other languages. The platform needs to be able to run backtests against those engines — TypeScript first, other languages as needed.

The first backtest to run will be defined by Flavio once the platform is built and ready. Do not assume what that first backtest is — ask.

---

## Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Frontend framework | Next.js (React) | App router, TypeScript native, server components |
| State management | Zustand | Lightweight, no boilerplate, not Redux |
| Styling | Tailwind CSS v4 | Dark theme, fast, matches design system |
| Component library | shadcn/ui | Unstyled, composable, works with Tailwind v4 |
| Icons | Lucide React | Consistent icon set, already in design system |
| Color palette | Steel / Rose / Sage | See `SPEC__directive--ux-design.md` for full palette and CSS vars |
| Frontend charting | D3.js | Full control, no black boxes, renders anything TradingView renders |
| Backend | Node.js + Express (or Next.js API routes) | Serves data, shells out to LEAN, exposes API |
| Backtest engine | LEAN CLI (Docker) | Runs in background, TypeScript/React never touches Python directly |
| Strategy files | Python (LEAN format) | One-time translation of TS engines into LEAN API — write once, ignore |
| Primary data | Binance OHLCV CSV | Existing format, may expand to other sources |

### LEAN Architecture

LEAN runs as a Docker container. Your Node backend shells out to it:

```txt
Next.js UI → Node API → shell exec `lean backtest` → parse JSON output → back to UI
```

You write TypeScript everywhere you care about. Python is locked inside Docker doing one job. You never interact with it directly.

---

## The Chart

This is the centerpiece. Everything else serves the chart.

### Visual reference

`SOLUSDT_2026-04-01_14-33-06.png` — this TradingView screenshot is the visual target for the look and feel.

### Required chart elements

- **Candlestick body** — green (bullish) / red (bearish), OHLC
- **Indicator overlays** — line charts drawn on top of candles (e.g. EMA, OTT)
- **Trade signal markers** — entry and exit arrows on signal bars
- **Dark background** — TradingView dark theme aesthetic
- **X axis** — date labels
- **Y axis** — price on right side
- **Chart header** — symbol, timeframe, OHLC values, strategy name
- **Zoom and pan** — mouse wheel zoom, click-drag pan
- **Crosshair** — shows OHLC + date on hover

---

## The Backtest Panel

Sidebar or bottom panel. Controls and results.

### Controls

| Control | Type |
|---------|------|
| Asset / dataset | Dropdown |
| Date range | Date pickers |
| Strategy parameters | Defined per engine — Flavio will provide |
| Starting capital | Number input |
| Run backtest | Button |

### Results panel

| Metric | Display |
|--------|---------|
| Total return % | Large, prominent |
| Final equity | Dollar value |
| Max drawdown % | Red if > 20% |
| Trade count | Round trips |
| Days in market | Count + % |
| Buy & hold comparison | Side by side |

### Equity curve

Separate D3 line chart below the candlestick chart. Shows equity over time. Overlays buy & hold for comparison.

### Trade log table

Scrollable table:

```txt
Date | Action | Price | Equity | Return
```

---

## Data Layer

### Primary data format — Binance OHLCV CSV

```txt
open_time, open, high, low, close, volume, close_time, ...
```

- Timestamps may be microseconds (16 digits) — if > 13 digits, divide by 1000
- Other data formats may be introduced — design the loader to be swappable

### Backend API endpoints (starting point — discuss with Flavio)

```txt
GET /api/candles?asset=sol&year=2021     → OHLCV array
GET /api/backtest?engine=gt40&asset=sol  → backtest result + trade log
GET /api/assets                          → list of available datasets
```

---

## Phased Build

### Phase 1 — Chart (build first, get approval before Phase 2)

- Load OHLCV CSV
- Render candlestick chart with D3
- Indicator overlays (lines on top of candles)
- Zoom, pan, crosshair working
- Matches TradingView screenshot visually

### Phase 2 — Backtest Runner

- Backend API wired to Flavio's engine (Flavio provides the engine)
- Parameter controls in UI
- Results panel
- Trade signal markers on chart

### Phase 3 — Equity Curve + Trade Log

- Equity curve D3 chart
- Buy & hold overlay
- Trade log table

### Phase 4 — TBD

Defined by Flavio after Phase 3 is complete.

---

## Clarifying Questions for Claude Code

Ask before starting. Do not assume:

1. **First backtest** — What is the first backtest Flavio wants to run? Get the engine file, data file, and expected output before building anything.
2. **Tech stack confirmation** — D3.js + React + Node? Or does Flavio want something different?
3. **Multi-year view** — One dataset at a time via dropdown, or continuous chart across all datasets?
4. **Port preference** — Frontend 3000, backend 4000? Or different?
5. **Deployment** — Localhost only, or will others (e.g. the client) access it remotely?

---

## Success Criteria

| Phase | Done when |
|-------|-----------|
| 1 | Chart renders candles with indicator overlays, zoom/pan works, matches TradingView screenshot |
| 2 | Backtest runs from UI, signal markers on chart, results panel correct |
| 3 | Equity curve renders, trade log accurate |
| 4 | TBD |

---

## QuantConnect Reference

**LEAN Engine (open source — Apache 2.0):** https://github.com/QuantConnect/Lean

Free to use locally. No subscription needed when you bring your own data (Binance CSV). Only costs money if you use their cloud data or compute. Install locally with `pip install lean`.

---

## ⛔ DO NOT START BUILDING

This spec is not ready for implementation. The following must be resolved with Flavio before any code is written:

1. **UX design** — Flavio needs to design the final UX. Do not assume layout, panel placement, or interaction patterns. Wait for mockups or a UX spec.

2. **Backtest spec format** — Flavio and Claude need to agree on a standard spec format for defining a new backtest. Every backtest should have its own spec (engine file, data file, parameters, expected output, pass/fail criteria). That format does not exist yet — it needs to be designed before any backtest is wired up.

3. **Test suite** — A full test suite needs to be defined. What gets tested, how it gets tested, and what pass/fail looks like must be agreed on before building starts.

**When these three things are done, update this spec to v5 and remove this block.**

---

## Rules

- ✅ TradingView-style interface — candlestick charts, indicator overlays, signal markers, dark theme
- ✅ Primary data format is Binance OHLCV CSV — design to accept other formats too
- ✅ TypeScript is the primary language for backtest engines — must support it natively
- ✅ Build phases in order — Phase 1 approved before Phase 2 starts
- ✅ All FX-named files use `slbt` as B position
- ✅ Copy three directive specs from Keymaster into `_specs/` verbatim on repo creation
- ✅ Ask clarifying questions before starting — especially what the first backtest is
- ❌ Do NOT use TradingView's embeddable widget — we are replacing TradingView
- ❌ Do NOT hardcode data — everything loads dynamically
- ❌ Do NOT connect to live execution or any exchange — backtesting only in v1
- ❌ Do NOT start building — see ⛔ DO NOT START BUILDING section above

---

## Design Inspiration

> **Note to Claude:** These links are for Flavio only. Ignore this section.

| Designer / Tag | URL |
|----------------|-----|
| Jordan Hughes | https://dribbble.com/jordanhughes |
| Akshay Hooda | https://dribbble.com/akshayhooda |
| Extej | https://dribbble.com/extej |
| Trading Dashboard search | https://dribbble.com/search/trading-dashboard |
| Fintech tag | https://dribbble.com/tags/fintech |
| Stock Trading tag | https://dribbble.com/tags/stock_trading |
