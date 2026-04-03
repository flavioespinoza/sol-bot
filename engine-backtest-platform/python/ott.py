"""
OTT (Optimized Trend Tracker) — Anil Ozeksi method.

Exact port of src/engine/ott-indicator.ts. The ratchet is inherently
sequential (ott[i] depends on ott[i-1] and a trend-flip decision), so
this is a stateful loop, not a vectorized pandas op.
"""

import pandas as pd


def compute_ott(candles: pd.DataFrame, ema_length: int, percent: float) -> pd.DataFrame:
    """
    Args:
        candles: DataFrame with columns [timestamp, open, high, low, close, volume]
        ema_length: EMA period (e.g. 40)
        percent: band width as decimal (e.g. 0.04 = 4%)

    Returns:
        Input DataFrame + columns [ema, ott, trend, signal]
    """
    if len(candles) == 0:
        return candles.assign(ema=[], ott=[], trend=[], signal=[])

    close = candles["close"].to_numpy()
    n = len(close)
    k = 2.0 / (ema_length + 1)

    ema_out = [0.0] * n
    ott_out = [0.0] * n
    trend_out = [""] * n
    signal_out = [None] * n

    prev_ema = close[0]
    prev_ott = close[0]
    prev_close = close[0]

    for i in range(n):
        c = close[i]

        # EMA
        ema = c if i == 0 else c * k + prev_ema * (1.0 - k)

        # Bands
        long_stop = ema * (1.0 - percent)
        short_stop = ema * (1.0 + percent)

        # OTT ratchet
        if i == 0:
            ott = c
        else:
            was_uptrend = prev_ema > prev_ott

            # Ratchet within current trend (monotone)
            if was_uptrend:
                ott = max(long_stop, prev_ott)
            else:
                ott = min(short_stop, prev_ott)

            # Flip override: EMA crosses the freshly-ratcheted line → reset
            if ema > ott and not was_uptrend:
                ott = long_stop
            elif ema < ott and was_uptrend:
                ott = short_stop

        # Trend uses CLOSE vs OTT (not EMA vs OTT)
        trend = "bullish" if c > ott else "bearish"

        # Signal: close-vs-ott crossover relative to previous bar
        signal = None
        if i > 0:
            prev_above = prev_close > prev_ott
            curr_above = c > ott
            if not prev_above and curr_above:
                signal = "buy"
            elif prev_above and not curr_above:
                signal = "sell"

        ema_out[i] = ema
        ott_out[i] = ott
        trend_out[i] = trend
        signal_out[i] = signal

        prev_ema = ema
        prev_ott = ott
        prev_close = c

    out = candles.copy()
    out["ema"] = ema_out
    out["ott"] = ott_out
    out["trend"] = trend_out
    out["signal"] = signal_out
    return out


if __name__ == "__main__":
    from loader import load_binance_csv
    import os

    here = os.path.dirname(__file__)
    csv_path = os.path.join(here, "..", "data", "sol", "binance-sol-1d-2021-to-2026-feb.csv")

    candles = load_binance_csv(csv_path)
    result = compute_ott(candles, ema_length=40, percent=0.04)

    pd.set_option("display.float_format", lambda v: f"{v:.6f}")
    print("OTT(40, 0.04) — first 10 rows:\n")
    print(result[["timestamp", "close", "ema", "ott", "trend"]].head(10).to_string(index=False))
