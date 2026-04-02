"""
CLI entry point for the OTT backtest engine.

Prints a single JSON document to stdout. Designed to be called by the
Next.js API layer (spawn → read stdout → JSON.parse).

Usage:
  python3 main.py --ema 40 --percent 0.04 --capital 10000
"""

import argparse
import json
import os
import sys

from loader import load_binance_csv
from backtest import run_backtest, buy_and_hold


def _candles_to_json(df):
    out = []
    for ts, o, h, l, c, v, ema, ott, trend, signal in zip(
        df["timestamp"], df["open"], df["high"], df["low"], df["close"],
        df["volume"], df["ema"], df["ott"], df["trend"], df["signal"],
    ):
        out.append({
            "timestamp": ts.isoformat(),
            "open": float(o),
            "high": float(h),
            "low": float(l),
            "close": float(c),
            "volume": float(v),
            "ema": float(ema),
            "ott": float(ott),
            "trend": trend,
            "signal": signal if isinstance(signal, str) else None,
        })
    return out


def main():
    parser = argparse.ArgumentParser(description="OTT backtest engine")
    parser.add_argument("--ema", type=int, default=40, help="EMA length (default: 40)")
    parser.add_argument("--percent", type=float, default=0.04, help="Band width as decimal (default: 0.04)")
    parser.add_argument("--capital", type=float, default=10000.0, help="Starting equity (default: 10000)")
    parser.add_argument("--data", type=str, default=None, help="Path to CSV (default: bundled SOL/USDT)")
    args = parser.parse_args()

    if args.data is None:
        here = os.path.dirname(os.path.abspath(__file__))
        args.data = os.path.join(here, "..", "data", "sol", "binance-sol-1d-2021-to-2026-feb.csv")

    candles = load_binance_csv(args.data)
    result = run_backtest(candles, args.ema, args.percent, starting_equity=args.capital)
    bh = buy_and_hold(candles, starting_equity=args.capital)

    n = len(candles)
    output = {
        "params": {
            "ema_length": args.ema,
            "percent": args.percent,
            "starting_equity": args.capital,
            "data_path": os.path.abspath(args.data),
            "total_bars": n,
        },
        "metrics": {
            "trades": result["trades"],
            "return_pct": result["return_pct"],
            "max_drawdown_pct": result["max_drawdown_pct"],
            "final_equity": result["final_equity"],
            "bullish_days": result["bullish_days"],
            "bearish_days": result["bearish_days"],
            "days_in_market_pct": result["bullish_days"] / n * 100.0,
        },
        "buy_and_hold": {
            "return_pct": bh["return_pct"],
            "max_drawdown_pct": bh["max_drawdown_pct"],
            "final_equity": bh["final_equity"],
        },
        "trade_log": result["trade_log"],
        "ott_candles": _candles_to_json(result["ott_candles"]),
    }

    json.dump(output, sys.stdout, allow_nan=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
