"""
CLI entrypoint for the OTT backtest engine.

Usage:
    python3 main.py --ema 40 --percent 0.04 --capital 10000 [--data <csv>]

Outputs a single JSON object to stdout containing:
    - metrics:   summary stats (return, drawdown, trades, buy&hold, ...)
    - trade_log: list of {date, action, price, equity}
    - candles:   full OHLCV + ema/ott/trend/signal series for charting
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import pandas as pd

from loader import load_binance_csv
from backtest import run_backtest, buy_and_hold

DEFAULT_DATA = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "sol"
    / "binance-sol-1d-2021-to-2026-feb.csv"
)


def _round(x: float, ndigits: int = 6) -> float:
    return float(round(x, ndigits)) if math.isfinite(x) else x


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="OTT backtest engine")
    p.add_argument("--ema", type=int, default=40, help="EMA length (default: 40)")
    p.add_argument(
        "--percent", type=float, default=0.04, help="OTT band percent as decimal (default: 0.04)"
    )
    p.add_argument(
        "--capital", type=float, default=10_000.0, help="Starting capital (default: 10000)"
    )
    p.add_argument(
        "--data", type=str, default=str(DEFAULT_DATA), help="Path to Binance kline CSV"
    )
    args = p.parse_args(argv)

    candles = load_binance_csv(args.data)
    res = run_backtest(candles, args.ema, args.percent, starting_equity=args.capital)
    bh = buy_and_hold(candles, starting_equity=args.capital)

    ott_df = res.ott_candles
    total_bars = len(ott_df)

    metrics = {
        "ema_length": res.ema_length,
        "percent": res.percent,
        "starting_equity": args.capital,
        "final_equity": _round(res.final_equity, 2),
        "return_pct": _round(res.return_pct, 4),
        "max_drawdown_pct": _round(res.max_drawdown_pct, 4),
        "trades": res.trades,
        "bullish_days": res.bullish_days,
        "bearish_days": res.bearish_days,
        "total_bars": total_bars,
        "days_in_market_pct": _round(res.bullish_days / total_bars * 100.0, 2),
        "buy_and_hold": {
            "return_pct": _round(bh.return_pct, 4),
            "final_equity": _round(bh.final_equity, 2),
            "max_drawdown_pct": _round(bh.max_drawdown_pct, 4),
        },
        "date_range": {
            "start": ott_df["timestamp"].iloc[0].strftime("%Y-%m-%d"),
            "end": ott_df["timestamp"].iloc[-1].strftime("%Y-%m-%d"),
        },
    }

    trade_log = [
        {
            "date": t.date,
            "action": t.action,
            "price": _round(t.price, 6),
            "equity": _round(t.equity, 2),
        }
        for t in res.trade_log
    ]

    candle_records = []
    for ts, o, h, l, c, v, ema, ott, trend, signal in zip(
        ott_df["timestamp"],
        ott_df["open"],
        ott_df["high"],
        ott_df["low"],
        ott_df["close"],
        ott_df["volume"],
        ott_df["ema"],
        ott_df["ott"],
        ott_df["trend"],
        ott_df["signal"],
    ):
        candle_records.append(
            {
                "timestamp": ts.isoformat(),
                "open": _round(o),
                "high": _round(h),
                "low": _round(l),
                "close": _round(c),
                "volume": _round(v, 2),
                "ema": _round(ema),
                "ott": _round(ott),
                "trend": trend,
                "signal": None if (signal is None or pd.isna(signal)) else str(signal),
            }
        )

    output = {
        "metrics": metrics,
        "trade_log": trade_log,
        "candles": candle_records,
    }

    json.dump(output, sys.stdout, allow_nan=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
