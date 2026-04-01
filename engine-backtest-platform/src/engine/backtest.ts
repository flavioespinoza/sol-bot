/**
 * Backtest Engine
 *
 * Runs OTT-based trend-following backtest on OHLCV candle data.
 *
 * Strategy rule (there is only one):
 *   - OTT trend bullish → LONG (1x, no leverage)
 *   - OTT trend bearish → FLAT (cash, no position)
 *
 * Execution model: next-bar entry.
 *   - Signal fires at bar N's close
 *   - Fill happens at bar N's close
 *   - First P&L tick is bar N+1
 *   - This matches standard backtest convention (process_orders_on_close=true)
 */

import { computeOtt } from './ott-indicator'
import type { BacktestResult, BuyAndHoldResult, OhlcvCandle, TradeEntry } from './types'

const STARTING_EQUITY = 10_000

export function runBacktest(
	candles: OhlcvCandle[],
	emaLength: number,
	percent: number
): BacktestResult {
	const ottCandles = computeOtt(candles, emaLength, percent)

	let equity = STARTING_EQUITY
	let peak = STARTING_EQUITY
	let maxDD = 0
	let trades = 0
	let state: 'long' | 'flat' = ottCandles[0].trend === 'bullish' ? 'long' : 'flat'
	const tradeLog: TradeEntry[] = []

	const bullishDays = ottCandles.filter((c) => c.trend === 'bullish').length
	const bearishDays = ottCandles.filter((c) => c.trend === 'bearish').length

	for (let i = 1; i < ottCandles.length; i++) {
		const prev = ottCandles[i - 1]
		const curr = ottCandles[i]

		// P&L calculated BEFORE trend flip (next-bar entry model)
		if (state === 'long') {
			const dailyReturn = (curr.close - prev.close) / prev.close
			equity *= 1 + dailyReturn
		}

		if (curr.trend !== prev.trend) {
			trades++
			state = curr.trend === 'bullish' ? 'long' : 'flat'
			tradeLog.push({
				date: curr.timestamp.toISOString().slice(0, 10),
				action: state === 'long' ? 'LONG' : 'FLAT',
				price: curr.close,
				equity
			})
		}

		if (equity > peak) peak = equity
		const dd = ((peak - equity) / peak) * 100
		if (dd > maxDD) maxDD = dd
	}

	return {
		emaLength,
		percent,
		trades,
		returnPct: ((equity - STARTING_EQUITY) / STARTING_EQUITY) * 100,
		maxDrawdownPct: maxDD,
		finalEquity: equity,
		bullishDays,
		bearishDays,
		tradeLog,
		ottCandles
	}
}

export function buyAndHold(candles: OhlcvCandle[]): BuyAndHoldResult {
	const firstPrice = candles[0].close
	const lastPrice = candles[candles.length - 1].close
	const returnPct = ((lastPrice - firstPrice) / firstPrice) * 100
	const finalEquity = STARTING_EQUITY * (1 + returnPct / 100)

	let peak = STARTING_EQUITY
	let maxDD = 0
	for (const c of candles) {
		const eq = STARTING_EQUITY * (c.close / firstPrice)
		if (eq > peak) peak = eq
		const dd = ((peak - eq) / peak) * 100
		if (dd > maxDD) maxDD = dd
	}

	return { returnPct, maxDrawdownPct: maxDD, finalEquity }
}
