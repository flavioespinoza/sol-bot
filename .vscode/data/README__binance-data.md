# Binance Data

All CSV files use Binance Kline format with Unix millisecond timestamps (UTC).

<!-- 
@todo: Rename the README to README__data--ott--ema.md
@todo: Add link to work by **Anıl Özekşi** -- _proposals/CO-1__sol--ema-max-dd-validation.html (this doc has some links on his work)
@todo: Add yellow inline bookmark fo @design, @brainstorm, @concept
 -->

## OTT (Optimized Trend Tracker)

OTT is a trend-following indicator created by **Anıl Özekşi**. It uses an EMA (Exponential Moving Average) as a support line and applies a percentage-based offset to create a trailing stop that ratchets in the direction of the trend — it only moves up in an uptrend and only moves down in a downtrend. When price crosses the OTT line, a trend reversal signal fires.

We use OTT as the core indicator for the **GT40** strategy (formerly Ford — 1-rule, 1D, long-only). Every backtest in this engine starts with computing OTT on the raw Binance candle data, then applying strategy rules on top of the OTT output.

## Columns

| # | Field | Description |
|---|-------|-------------|
| 1 | Open time | Unix timestamp in milliseconds (UTC) |
| 2 | Open | Opening price |
| 3 | High | Highest price |
| 4 | Low | Lowest price |
| 5 | Close | Closing price |
| 6 | Volume | Trading volume |
| 7 | Close time | Unix timestamp in milliseconds (UTC) |
| 8 | Quote asset volume | Volume in quote currency (USDT) |
| 9 | Number of trades | Trade count |
| 10 | Taker buy base asset volume | Taker buy volume |
| 11 | Taker buy quote asset volume | Taker buy volume in quote currency |
| 12 | Ignore | Unused field |

## Directory Structure

```txt
data/
├── btc/
│   ├── _binance-btc-1d-2025-dec-to-2026-mar.csv   (73)  ← starting point
│   ├── binance-btc-1d-2021-to-2026-feb.csv        (1,885 candles)
│   ├── binance-btc-1d-2021.csv                     (365)
│   ├── binance-btc-1d-2022.csv                     (365)
│   ├── binance-btc-1d-2023.csv                     (365)
│   ├── binance-btc-1d-2024.csv                     (366)
│   ├── binance-btc-1d-2025.csv                     (365)
│   └── binance-btc-1d-2026.csv                     (59)
├── sol/
│   ├── _binance-sol-1d-2025-dec-to-2026-mar.csv    (73)  ← starting point
│   ├── binance-sol-1d-2021-to-2026-feb.csv         (1,885 candles)
│   ├── binance-sol-1d-2021.csv                     (365)
│   ├── binance-sol-1d-2022.csv                     (365)
│   ├── binance-sol-1d-2023.csv                     (365)
│   ├── binance-sol-1d-2024.csv                     (366)
│   ├── binance-sol-1d-2025.csv                     (365)
│   └── binance-sol-1d-2026.csv                     (59)
├── sp500/
│   ├── _binance-sp500-1d-2025-dec-to-2026-mar.csv  (48)  ← starting point
│   ├── binance-sp500-1d-2021-to-2026-feb.csv       (1,294 candles)
│   ├── binance-sp500-1d-2021.csv                   (252)
│   ├── binance-sp500-1d-2022.csv                   (251)
│   ├── binance-sp500-1d-2023.csv                   (250)
│   ├── binance-sp500-1d-2024.csv                   (252)
│   ├── binance-sp500-1d-2025.csv                   (250)
│   └── binance-sp500-1d-2026.csv                   (39)
├── ott-1d.csv
├── ott-4h.csv
└── README__binance-data.md
```

## Date Ranges

### Starting Point (`_` prefix — original Ford/Ferrari test window for SOL, now applied to all three)

| Asset | Timeframe | Start | End | Total Candles |
|-------|-----------|-------|-----|---------------|
| BTC/USDT | 1D | 2025-12-18 | 2026-02-28 | 73 |
| SOL/USDT | 1D | 2025-12-18 | 2026-02-28 | 73 |
| SP500 | 1D | 2025-12-18 | 2026-02-27 | 48 |

### Full Range

| Asset | Timeframe | Start | End | Total Candles |
|-------|-----------|-------|-----|---------------|
| BTC/USDT | 1D | 2021-01-01 | 2026-02-28 | 1,885 |
| SOL/USDT | 1D | 2021-01-01 | 2026-02-28 | 1,885 |
| SP500 | 1D | 2021-01-04 | 2026-02-27 | 1,294 |

BTC and SOL trade 24/7 — one candle per calendar day (365/year, 366 for leap years).

SP500 only has candles on NYSE trading days — no weekends, no holidays (~251/year). The start and end dates differ slightly because Jan 1 and Feb 28, 2026 fall on non-trading days.

## Row Count by Year

| Year | BTC | SOL | SP500 |
|------|-----|-----|-------|
| 2021 | 365 | 365 | 252 |
| 2022 | 365 | 365 | 251 |
| 2023 | 365 | 365 | 250 |
| 2024 | 366 | 366 | 252 |
| 2025 | 365 | 365 | 250 |
| 2026 | 59 | 59 | 39 |
