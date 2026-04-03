# Binance Full-Dataset Backtest Report

Generated: 2026-03-27T08:26:22.571Z
Dataset: Binance SOLUSDT spot klines
4H: 4740 candles (2024-01-01 -> 2026-02-28)
1D: 790 candles (2024-01-01 -> 2026-02-28)
OTT params: EMA(10), percent=0.014

## MODE A: Ratcheting (TradingView parity)

4H signals: 525 | 1D signals: 109
Aligned with 1D: 4734 | Without 1D: 6

| Scenario       | Trades | Win Rate | Return % | Final Equity | Max DD % | Avg MFE % | Avg MAE % | Avg Given Back % | Sharpe |
| -------------- | ------ | -------- | -------- | ------------ | -------- | --------- | --------- | ---------------- | ------ |
| baseline       | 217    | 26.3%    | -18.01%  | $8198.68     | 46.76%   | 3.70%     | -1.58%    | 3.68%            | 0.00   |
| tp_2pct        | 217    | 41.9%    | 16.49%   | $11648.92    | 20.65%   | 1.42%     | -1.27%    | 1.31%            | 0.04   |
| tp_5pct        | 217    | 29.0%    | 48.45%   | $14845.05    | 38.70%   | 2.28%     | -1.51%    | 2.01%            | 0.07   |
| tp_10pct       | 217    | 26.3%    | 12.61%   | $11260.81    | 36.89%   | 3.01%     | -1.58%    | 2.86%            | 0.03   |
| trailing_2pct  | 217    | 32.3%    | 4.15%    | $10415.19    | 32.19%   | 2.53%     | -1.31%    | 2.44%            | 0.02   |
| trailing_5pct  | 217    | 27.2%    | -0.34%   | $9965.67     | 38.80%   | 3.60%     | -1.56%    | 3.50%            | 0.02   |
| leverage_2x    | 217    | 26.3%    | -55.31%  | $4469.37     | 78.07%   | 3.70%     | -1.58%    | 7.36%            | 0.00   |
| leverage_3x    | 217    | 26.3%    | -83.07%  | $1692.70     | 93.74%   | 3.70%     | -1.58%    | 11.05%           | 0.00   |
| stop_loss_5pct | 217    | 26.3%    | -17.33%  | $8267.40     | 46.31%   | 3.70%     | -1.58%    | 3.68%            | 0.00   |

## MODE B: Simple Band (control)

4H signals: 685 | 1D signals: 136
Aligned with 1D: 4734 | Without 1D: 6

| Scenario       | Trades | Win Rate | Return % | Final Equity | Max DD % | Avg MFE % | Avg MAE % | Avg Given Back % | Sharpe |
| -------------- | ------ | -------- | -------- | ------------ | -------- | --------- | --------- | ---------------- | ------ |
| baseline       | 292    | 32.2%    | -51.19%  | $4881.06     | 68.51%   | 2.78%     | -1.39%    | 2.95%            | -0.04  |
| tp_2pct        | 292    | 41.4%    | -16.11%  | $8389.03     | 37.78%   | 1.29%     | -1.19%    | 1.31%            | -0.01  |
| tp_5pct        | 292    | 33.2%    | -39.94%  | $6005.71     | 62.50%   | 1.87%     | -1.38%    | 1.99%            | -0.03  |
| tp_10pct       | 292    | 32.2%    | -15.70%  | $8429.75     | 51.56%   | 2.43%     | -1.39%    | 2.40%            | 0.01   |
| trailing_2pct  | 292    | 33.9%    | -58.51%  | $4149.11     | 69.33%   | 2.01%     | -1.24%    | 2.26%            | -0.08  |
| trailing_5pct  | 292    | 32.2%    | -41.67%  | $5833.20     | 62.96%   | 2.76%     | -1.38%    | 2.86%            | -0.02  |
| leverage_2x    | 292    | 32.2%    | -84.27%  | $1572.81     | 92.99%   | 2.78%     | -1.39%    | 5.90%            | -0.04  |
| leverage_3x    | 292    | 32.2%    | -96.59%  | $341.12      | 98.90%   | 2.78%     | -1.39%    | 8.85%            | -0.04  |
| stop_loss_5pct | 292    | 32.2%    | -50.78%  | $4921.98     | 68.25%   | 2.78%     | -1.39%    | 2.95%            | -0.04  |

## OTT MODE COMPARISON

| Metric                         | Ratcheting       | Simple Band      |
| ------------------------------ | ---------------- | ---------------- |
| 4H signal count                | 525              | 685              |
| 1D signal count                | 109              | 136              |
| Baseline trades                | 217              | 292              |
| Baseline return                | -18.01%          | -51.19%          |
| Baseline win rate              | 26.3%            | 32.2%            |
| Baseline max DD                | 46.76%           | 68.51%           |
| TP +2% trades                  | 217              | 292              |
| TP +2% return                  | 16.49%           | -16.11%          |
| TP +2% win rate                | 41.9%            | 41.4%            |
| TP +2% max DD                  | 20.65%           | 37.78%           |
| TP +5% return                  | 48.45%           | -39.94%          |
| TP +5% max DD                  | 38.70%           | 62.50%           |
| Fixed TP outperforms baseline? | YES              | YES              |
| Best fixed TP scenario         | TP +5% (+48.45%) | TP +2% (-16.11%) |

## TRAJAN vs BINANCE COMPARISON

Trajan dataset: 77 days (Dec 18 2025 - Mar 4 2026), OTT from TradingView
Binance dataset: 790 days (2024-01-01 - 2026-02-28), OTT computed locally

| Metric          | Trajan (77d)  | Binance Ratcheting | Binance Simple   |
| --------------- | ------------- | ------------------ | ---------------- |
| Baseline trades | 12            | 217                | 292              |
| Baseline return | -0.17%        | -18.01%            | -51.19%          |
| Baseline max DD | 16.17%        | 46.76%             | 68.51%           |
| TP +2% return   | +27.16%       | +16.49%            | -16.11%          |
| TP +2% max DD   | 12.46%        | 20.65%             | 37.78%           |
| TP +5% return   | N/A (not run) | +48.45%            | -39.94%          |
| TP +5% max DD   | N/A           | 38.70%             | 62.50%           |
| Best fixed TP   | TP +2%        | TP +5% (+48.45%)   | TP +2% (-16.11%) |
