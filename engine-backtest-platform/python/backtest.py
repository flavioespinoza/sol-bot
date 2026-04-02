"""
Backtest engine — exact port of src/engine/backtest.ts.

Strategy (one rule):
  - OTT trend bullish -> LONG  (1x, no leverage)
  - OTT trend bearish -> FLAT  (cash, no position)

Execution model: next-bar entry.
  - Signal fires at bar N's close
  - Fill happens at bar N's close
  - First P&L tick is bar N+1
  (i.e. apply P&L for the bar BEFORE evaluating the trend flip on that bar)
"""

from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd

from ott import compute_ott

STARTING_EQUITY = 10_000.0


@dataclass
class TradeEntry:
    date: str
    action: str  # "LONG" | "FLAT"
    price: float
    equity: float


@dataclass
class BacktestResult:
    ema_length: int
    percent: float
    trades: int
    return_pct: float
    max_drawdown_pct: float
    final_equity: float
    bullish_days: int
    bearish_days: int
    trade_log: list[TradeEntry] = field(default_factory=list)
    ott_candles: pd.DataFrame | None = None


@dataclass
class BuyAndHoldResult:
    return_pct: float
    max_drawdown_pct: float
    final_equity: float


def run_backtest(candles: pd.DataFrame, ema_length: int, percent: float) -> BacktestResult:
    ott_df = compute_ott(candles, ema_length, percent)

    closes = ott_df["close"].to_numpy(dtype=float)
    trends = ott_df["trend"].to_numpy()
    timestamps = ott_df["timestamp"].to_numpy()
    n = len(ott_df)

    equity = STARTING_EQUITY
    peak = STARTING_EQUITY
    max_dd = 0.0
    trades = 0
    state = "long" if trends[0] == "bullish" else "flat"
    trade_log: list[TradeEntry] = []

    bullish_days = int((trends == "bullish").sum())
    bearish_days = int((trends == "bearish").sum())

    for i in range(1, n):
        prev_close = closes[i - 1]
        curr_close = closes[i]
        prev_trend = trends[i - 1]
        curr_trend = trends[i]

        # P&L applied BEFORE trend flip (next-bar entry model)
        if state == "long":
            daily_return = (curr_close - prev_close) / prev_close
            equity *= 1.0 + daily_return

        if curr_trend != prev_trend:
            trades += 1
            state = "long" if curr_trend == "bullish" else "flat"
            ts = pd.Timestamp(timestamps[i])
            trade_log.append(
                TradeEntry(
                    date=ts.strftime("%Y-%m-%d"),
                    action="LONG" if state == "long" else "FLAT",
                    price=curr_close,
                    equity=equity,
                )
            )

        if equity > peak:
            peak = equity
        dd = (peak - equity) / peak * 100.0
        if dd > max_dd:
            max_dd = dd

    return BacktestResult(
        ema_length=ema_length,
        percent=percent,
        trades=trades,
        return_pct=(equity - STARTING_EQUITY) / STARTING_EQUITY * 100.0,
        max_drawdown_pct=max_dd,
        final_equity=equity,
        bullish_days=bullish_days,
        bearish_days=bearish_days,
        trade_log=trade_log,
        ott_candles=ott_df,
    )


def buy_and_hold(candles: pd.DataFrame) -> BuyAndHoldResult:
    closes = candles["close"].to_numpy(dtype=float)
    first = closes[0]
    last = closes[-1]
    return_pct = (last - first) / first * 100.0
    final_equity = STARTING_EQUITY * (1.0 + return_pct / 100.0)

    peak = STARTING_EQUITY
    max_dd = 0.0
    for c in closes:
        eq = STARTING_EQUITY * (c / first)
        if eq > peak:
            peak = eq
        dd = (peak - eq) / peak * 100.0
        if dd > max_dd:
            max_dd = dd

    return BuyAndHoldResult(
        return_pct=return_pct,
        max_drawdown_pct=max_dd,
        final_equity=final_equity,
    )


if __name__ == "__main__":
    from pathlib import Path

    from loader import load_binance_csv

    here = Path(__file__).resolve().parent
    csv_path = here.parent / "data" / "sol" / "binance-sol-1d-2021-to-2026-feb.csv"

    candles = load_binance_csv(csv_path)

    res = run_backtest(candles, ema_length=40, percent=0.04)
    bh = buy_and_hold(candles)

    print("=" * 60)
    print(f"OTT Backtest — EMA {res.ema_length}, band {res.percent:.0%}")
    print("=" * 60)
    print(f"Starting equity   : ${STARTING_EQUITY:,.0f}")
    print(f"Final equity      : ${res.final_equity:,.0f}")
    print(f"Total return      : {res.return_pct:,.2f}%")
    print(f"Max drawdown      : {res.max_drawdown_pct:.2f}%")
    print(f"Trade count       : {res.trades}")
    print(f"Days in market    : {res.bullish_days} / {len(candles)} "
          f"({res.bullish_days / len(candles) * 100:.1f}%)")
    print()
    print(f"Buy & hold return : {bh.return_pct:,.2f}%")
    print(f"Buy & hold equity : ${bh.final_equity:,.0f}")
    print(f"Buy & hold max DD : {bh.max_drawdown_pct:.2f}%")
    print()
    print(f"Trade log ({len(res.trade_log)} entries) — first 5 and last 5:")
    for t in res.trade_log[:5]:
        print(f"  {t.date}  {t.action:5s}  ${t.price:>10,.4f}  equity ${t.equity:>14,.2f}")
    print("  ...")
    for t in res.trade_log[-5:]:
        print(f"  {t.date}  {t.action:5s}  ${t.price:>10,.4f}  equity ${t.equity:>14,.2f}")
