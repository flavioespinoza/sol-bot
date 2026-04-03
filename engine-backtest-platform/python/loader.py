"""
Binance kline CSV loader.

Format (no headers, 12 cols):
  open_time(ms), open, high, low, close, volume, close_time, quote_vol,
  trades, taker_buy_base, taker_buy_quote, ignore

Mirrors src/engine/csv-loader.ts: uses open_time, normalizes µs→ms, sorts asc.
"""

import pandas as pd

_BINANCE_COLS = [
    "open_time", "open", "high", "low", "close", "volume",
    "close_time", "quote_volume", "trades",
    "taker_buy_base", "taker_buy_quote", "ignore",
]


def load_binance_csv(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, header=None, names=_BINANCE_COLS)

    # Some Binance dumps use microseconds (16 digits). Normalize to ms.
    ot = df["open_time"].astype("int64")
    us_mask = ot > 9_999_999_999_999
    ot = ot.where(~us_mask, ot // 1000)

    df = pd.DataFrame({
        "timestamp": pd.to_datetime(ot, unit="ms", utc=True),
        "open":   df["open"].astype(float),
        "high":   df["high"].astype(float),
        "low":    df["low"].astype(float),
        "close":  df["close"].astype(float),
        "volume": df["volume"].astype(float),
    })

    return df.sort_values("timestamp").reset_index(drop=True)


if __name__ == "__main__":
    import os
    here = os.path.dirname(__file__)
    csv_path = os.path.join(here, "..", "data", "sol", "binance-sol-1d-2021-to-2026-feb.csv")

    candles = load_binance_csv(csv_path)

    print(f"Total candles: {len(candles)}\n")
    print("First 3 rows:")
    print(candles.head(3).to_string(index=False))
