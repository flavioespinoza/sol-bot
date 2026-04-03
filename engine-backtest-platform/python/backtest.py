"""
Backtest engine — OTT trend-following.

Exact port of src/engine/backtest.ts.

Strategy (one rule):
  bullish trend -> LONG  (1x, no leverage)
  bearish trend -> FLAT  (cash)

Execution model: next-bar entry.
  Signal fires at bar N's close, fill at N's close, first P&L is bar N+1.
  Implemented by applying P&L BEFORE the trend-flip check in the loop.
"""

import pandas as pd
from ott import compute_ott

STARTING_EQUITY = 10_000.0


def run_backtest(
    candles: pd.DataFrame,
    ema_length: int,
    percent: float,
    starting_equity: float = STARTING_EQUITY,
) -> dict:
    ott = compute_ott(candles, ema_length, percent)

    closes = ott["close"].to_numpy()
    trends = ott["trend"].to_numpy()
    timestamps = ott["timestamp"]
    n = len(ott)

    equity = starting_equity
    peak = starting_equity
    max_dd = 0.0
    trades = 0
    state = "long" if trends[0] == "bullish" else "flat"
    trade_log: list[dict] = []

    bullish_days = int((trends == "bullish").sum())
    bearish_days = int((trends == "bearish").sum())

    for i in range(1, n):
        prev_close = closes[i - 1]
        curr_close = closes[i]
        prev_trend = trends[i - 1]
        curr_trend = trends[i]

        # P&L BEFORE trend flip (next-bar entry)
        if state == "long":
            daily_return = (curr_close - prev_close) / prev_close
            equity *= 1.0 + daily_return

        # Trend transition -> record trade, flip state
        if curr_trend != prev_trend:
            trades += 1
            state = "long" if curr_trend == "bullish" else "flat"
            trade_log.append({
                "date": timestamps.iloc[i].strftime("%Y-%m-%d"),
                "action": "LONG" if state == "long" else "FLAT",
                "price": float(curr_close),
                "equity": float(equity),
            })

        # Drawdown tracking (every bar)
        if equity > peak:
            peak = equity
        dd = (peak - equity) / peak * 100.0
        if dd > max_dd:
            max_dd = dd

    return {
        "ema_length": ema_length,
        "percent": percent,
        "trades": trades,
        "return_pct": (equity - starting_equity) / starting_equity * 100.0,
        "max_drawdown_pct": max_dd,
        "final_equity": equity,
        "bullish_days": bullish_days,
        "bearish_days": bearish_days,
        "trade_log": trade_log,
        "ott_candles": ott,
    }


def buy_and_hold(candles: pd.DataFrame, starting_equity: float = STARTING_EQUITY) -> dict:
    closes = candles["close"].to_numpy()
    first, last = closes[0], closes[-1]

    return_pct = (last - first) / first * 100.0
    final_equity = starting_equity * (1.0 + return_pct / 100.0)

    peak = starting_equity
    max_dd = 0.0
    for c in closes:
        eq = starting_equity * (c / first)
        if eq > peak:
            peak = eq
        dd = (peak - eq) / peak * 100.0
        if dd > max_dd:
            max_dd = dd

    return {
        "return_pct": return_pct,
        "max_drawdown_pct": max_dd,
        "final_equity": final_equity,
    }


if __name__ == "__main__":
    from loader import load_binance_csv
    import os

    here = os.path.dirname(__file__)
    csv_path = os.path.join(here, "..", "data", "sol", "binance-sol-1d-2021-to-2026-feb.csv")
    candles = load_binance_csv(csv_path)

    r = run_backtest(candles, ema_length=40, percent=0.04)
    bh = buy_and_hold(candles)

    n = len(candles)
    print(f"OTT Backtest — EMA(40), 4% — SOL/USDT 1D ({n} bars)")
    print("=" * 56)
    print(f"  Trades:          {r['trades']}")
    print(f"  Return:          {r['return_pct']:,.2f}%")
    print(f"  Max drawdown:    {r['max_drawdown_pct']:.2f}%")
    print(f"  Starting equity: ${STARTING_EQUITY:,.0f}")
    print(f"  Final equity:    ${r['final_equity']:,.0f}")
    print(f"  Days in market:  {r['bullish_days']} / {n} ({r['bullish_days']/n*100:.1f}%)")
    print()
    print(f"  Buy & hold ret:  {bh['return_pct']:,.2f}%")
    print(f"  Buy & hold eq:   ${bh['final_equity']:,.0f}")
    print(f"  Buy & hold DD:   {bh['max_drawdown_pct']:.2f}%")
    print()
    print(f"Trade log ({len(r['trade_log'])} entries) — first 5 + last 5:")
    for t in r["trade_log"][:5]:
        print(f"  {t['date']}  {t['action']:<4}  @ ${t['price']:>10,.4f}   equity ${t['equity']:>14,.2f}")
    print("  ...")
    for t in r["trade_log"][-5:]:
        print(f"  {t['date']}  {t['action']:<4}  @ ${t['price']:>10,.4f}   equity ${t['equity']:>14,.2f}")
