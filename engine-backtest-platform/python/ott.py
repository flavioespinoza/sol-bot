"""
OTT (Optimized Trend Tracker) indicator.

Exact Python port of engine-backtest-platform/src/engine/ott-indicator.ts
(Anil Ozeksi ratcheting method).

Algorithm per bar i:
  1. EMA of close, k = 2/(len+1), seeded ema[0] = close[0].
  2. longStop  = ema * (1 - pct)   (trailing support, uptrend)
     shortStop = ema * (1 + pct)   (trailing resistance, downtrend)
  3. Ratchet using PREVIOUS state: wasUptrend = prevEma > prevOtt
       uptrend   -> ott = max(longStop,  prevOtt)
       downtrend -> ott = min(shortStop, prevOtt)
  4. Flip reset (after ratchet):
       ema > ott and not wasUptrend -> ott = longStop
       ema < ott and     wasUptrend -> ott = shortStop
  5. trend  = 'bullish' if close > ott else 'bearish'
  6. signal = 'buy'  on close crossing above OTT,
              'sell' on close crossing below OTT, else None.
"""

from __future__ import annotations

import pandas as pd


def _ema_mult(length: int) -> float:
    return 2.0 / (length + 1)


def compute_ott(df: pd.DataFrame, ema_length: int, percent: float) -> pd.DataFrame:
    """Compute OTT on an OHLCV DataFrame.

    Expects columns: timestamp, open, high, low, close, volume.
    Returns a copy with added columns: ema, ott, trend, signal.
    """
    if len(df) == 0:
        out = df.copy()
        for col in ("ema", "ott", "trend", "signal"):
            out[col] = pd.Series(dtype="object")
        return out

    closes = df["close"].to_numpy(dtype=float)
    n = len(closes)
    k = _ema_mult(ema_length)

    ema = [0.0] * n
    ott = [0.0] * n
    trend: list[str] = [""] * n
    signal: list[str | None] = [None] * n

    prev_ema = closes[0]
    prev_ott = closes[0]
    prev_close = closes[0]

    for i in range(n):
        c = closes[i]

        # 1. EMA
        e = c if i == 0 else c * k + prev_ema * (1.0 - k)

        # 2. Bands
        long_stop = e * (1.0 - percent)
        short_stop = e * (1.0 + percent)

        # 3/4. Ratchet + flip reset
        if i == 0:
            o = c
        else:
            was_uptrend = prev_ema > prev_ott

            if was_uptrend:
                o = max(long_stop, prev_ott)
            else:
                o = min(short_stop, prev_ott)

            if e > o and not was_uptrend:
                o = long_stop
            elif e < o and was_uptrend:
                o = short_stop

        # 5. Trend (close vs OTT)
        t = "bullish" if c > o else "bearish"

        # 6. Signal on close/OTT cross
        s: str | None = None
        if i > 0:
            prev_above = prev_close > prev_ott
            curr_above = c > o
            if (not prev_above) and curr_above:
                s = "buy"
            elif prev_above and (not curr_above):
                s = "sell"

        ema[i] = e
        ott[i] = o
        trend[i] = t
        signal[i] = s

        prev_ema = e
        prev_ott = o
        prev_close = c

    out = df.copy()
    out["ema"] = ema
    out["ott"] = ott
    out["trend"] = trend
    out["signal"] = signal
    return out


if __name__ == "__main__":
    from pathlib import Path

    from loader import load_binance_csv

    here = Path(__file__).resolve().parent
    csv_path = here.parent / "data" / "sol" / "binance-sol-1d-2021-to-2026-feb.csv"

    candles = load_binance_csv(csv_path)
    result = compute_ott(candles, ema_length=40, percent=0.04)

    pd.set_option("display.width", 140)
    pd.set_option("display.float_format", lambda v: f"{v:.6f}")

    print(f"OTT(ema_length=40, percent=0.04) on {len(result)} candles")
    print()
    print("First 10 rows:")
    cols = ["timestamp", "close", "ema", "ott", "trend"]
    print(result[cols].head(10).to_string(index=False))
