# Sol Bot

SOL trading signal engine with OTT indicator, backtest platform, and automated trading bot.

## What It Does

Sol Bot is a signal engine that uses the OTT (Optimized Trend Tracker) indicator to generate BUY/SELL signals on SOL/USDT, BTC/USDT, and SP500 daily candles. It doesn't trade — it tells you when to trade.

## Structure

```
sol-bot/
├── src/__A__/          ← GT40 signal engine (OTT indicator, backtest, trade log)
├── src/services/       ← Solana account, bank, price, staking services
├── src/vendor/         ← Drift, Klend, Jupiter Lend, SPL token utils
├── src/utils/          ← accounting, conversion, PDA utils
├── platform/src/       ← dashboard UI (Next.js, React components, hooks)
├── data/               ← Binance OHLCV candle data (SOL, BTC, SP500)
├── output/             ← backtest output files
└── output-binance/     ← Binance-specific backtest output
```

## Setup

```bash
npm install
npm run build
npm run backtest
npm run test
```

## The GT40 Strategy

One rule: OTT bullish = long (1x), OTT bearish = flat (0x). No leverage. No shorts. Just one indicator, one timeframe, one decision: in or out.
