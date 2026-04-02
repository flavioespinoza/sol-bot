# Sol Bot

SOL trading signal engine with OTT indicator, backtest platform, and automated trading bot.

## What It Does

Sol Bot is a signal engine that uses the OTT (Optimized Trend Tracker) indicator to generate BUY/SELL signals on SOL/USDT, BTC/USDT, and SP500 daily candles. It doesn't trade — it tells you when to trade.

## Structure

```
sol-bot/
├── src/__A__/                  ← GT40 signal engine (OTT indicator, backtest, trade log)
├── platform/src/               ← dashboard UI components (Next.js, React, hooks, utils)
├── engine-backtest-platform/   ← backtest platform (Python LEAN engine + Next.js frontend)
├── data/                       ← Binance OHLCV candle data (SOL, BTC, SP500)
├── output/                     ← backtest output files
└── output-binance/             ← Binance-specific backtest output
```

## engine-backtest-platform

The `engine-backtest-platform/` directory is a self-contained subproject. It has its own `package.json`, `README.md`, and source tree. See `engine-backtest-platform/README.md` for the full spec.

The platform has two parts:
- **Python backtest engine** — QuantConnect LEAN, implements the OTT strategy, runs against Binance CSV data
- **Next.js frontend** — React UI with D3 charts, results panel, equity curve, trade log

## Setup

```bash
npm install
npm run build
npm run backtest
npm run test
```

## The GT40 Strategy

One rule: OTT bullish = long (1x), OTT bearish = flat (0x). No leverage. No shorts. Just one indicator, one timeframe, one decision: in or out.
