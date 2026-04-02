"""
Binance kline CSV loader.

CSV format (no headers):
    open_time, open, high, low, close, volume, close_time, ...

Timestamps are epoch milliseconds (occasionally microseconds in some
Binance exports — normalized to ms to match the TS reference loader).
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

BINANCE_COLUMNS = [
    "open_time",
    "open",
    "high",
    "low",
    "close",
    "volume",
    "close_time",
    "quote_volume",
    "trades",
    "taker_base_volume",
    "taker_quote_volume",
    "ignore",
]


def load_binance_csv(path: str | Path) -> pd.DataFrame:
    """Load a Binance kline CSV and return a clean OHLCV DataFrame.

    Returned columns: timestamp (datetime64, UTC), open, high, low, close, volume.
    Sorted by timestamp ascending.
    """
    df = pd.read_csv(path, header=None, names=BINANCE_COLUMNS, usecols=range(12))

    # Normalize µs → ms if needed (16-digit timestamps), mirroring csv-loader.ts.
    ot = df["open_time"].astype("int64")
    ot = ot.where(ot <= 9_999_999_999_999, ot // 1000)

    out = pd.DataFrame(
        {
            "timestamp": pd.to_datetime(ot, unit="ms", utc=True),
            "open": df["open"].astype(float),
            "high": df["high"].astype(float),
            "low": df["low"].astype(float),
            "close": df["close"].astype(float),
            "volume": df["volume"].astype(float),
        }
    )

    out = out.sort_values("timestamp").reset_index(drop=True)
    return out


if __name__ == "__main__":
    here = Path(__file__).resolve().parent
    csv_path = here.parent / "data" / "sol" / "binance-sol-1d-2021-to-2026-feb.csv"

    candles = load_binance_csv(csv_path)

    pd.set_option("display.width", 120)
    pd.set_option("display.max_columns", None)
    pd.set_option("display.float_format", lambda v: f"{v:,.4f}")

    print(f"Loaded: {csv_path}")
    print(f"Total candles: {len(candles)}")
    print()
    print("First 3 rows:")
    print(candles.head(3).to_string(index=False))
    print()
    print(
        f"Date range: {candles['timestamp'].iloc[0].date()} "
        f"→ {candles['timestamp'].iloc[-1].date()}"
    )
