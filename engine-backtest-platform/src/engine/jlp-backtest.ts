/**
 * Four-Scenario JLP Backtest for the web platform.
 *
 * Runs GT40__A signal against four asset strategies:
 *   1. SOL 1x  — baseline
 *   2. SOL 3x  — leveraged on Drift
 *   3. JLP 1x  — JLP (price + APY)
 *   4. JLP 3x  — JLP on Kamino Multiply
 */

import { computeOtt } from './ott-indicator'
import {
	modelJlpPrices,
	leveragedDailyReturn,
	netLeveragedApy,
	DEFAULT_WEIGHTS,
	DEFAULT_APY,
	DEFAULT_KAMINO,
	type JlpWeights,
	type JlpApyConfig,
	type KaminoConfig,
	type JlpCandle
} from './jlp-model'
import type { OhlcvCandle, TradeEntry } from './types'

const STARTING_EQUITY = 10_000

// ── Types ────────────────────────────────────────────────────

export interface ScenarioResult {
	name: string
	trades: number
	returnPct: number
	maxDrawdownPct: number
	finalEquity: number
	bullishDays: number
	bearishDays: number
	liquidated: boolean
	liquidationDate: string | null
	avgApyEarned: number | null
	tradeLog: TradeEntry[]
}

export interface FourScenarioResult {
	params: { emaLength: number; percent: number }
	totalDays: number
	dateRange: { start: string; end: string }
	scenarios: ScenarioResult[]
	buyAndHold: {
		sol: { returnPct: number; finalEquity: number }
		jlp: { returnPct: number; finalEquity: number }
	}
}

// ── Signal Generator ─────────────────────────────────────────

interface Signal {
	trend: 'bullish' | 'bearish'
	close: number
	flipped: boolean
	timestamp: Date
}

function generateSignals(candles: OhlcvCandle[], ema: number, pct: number): Signal[] {
	const ott = computeOtt(candles, ema, pct)
	return ott.map((c, i) => ({
		trend: c.trend,
		close: c.close,
		flipped: i > 0 && c.trend !== ott[i - 1].trend,
		timestamp: c.timestamp
	}))
}

// ── Scenario Runners ─────────────────────────────────────────

function runSol1x(signals: Signal[]): ScenarioResult {
	let equity = STARTING_EQUITY
	let peak = STARTING_EQUITY
	let maxDD = 0
	let trades = 0
	let state: 'long' | 'flat' = signals[0].trend === 'bullish' ? 'long' : 'flat'
	const tradeLog: TradeEntry[] = []
	const bullishDays = signals.filter(s => s.trend === 'bullish').length
	const bearishDays = signals.filter(s => s.trend === 'bearish').length

	for (let i = 1; i < signals.length; i++) {
		const prev = signals[i - 1]
		const curr = signals[i]
		if (state === 'long') {
			equity *= 1 + (curr.close - prev.close) / prev.close
		}
		if (curr.flipped) {
			trades++
			state = curr.trend === 'bullish' ? 'long' : 'flat'
			tradeLog.push({ date: curr.timestamp.toISOString().slice(0, 10), action: state === 'long' ? 'LONG' : 'FLAT', price: curr.close, equity })
		}
		if (equity > peak) peak = equity
		const dd = ((peak - equity) / peak) * 100
		if (dd > maxDD) maxDD = dd
	}

	return { name: 'SOL 1x', trades, returnPct: ((equity - STARTING_EQUITY) / STARTING_EQUITY) * 100, maxDrawdownPct: maxDD, finalEquity: equity, bullishDays, bearishDays, liquidated: false, liquidationDate: null, avgApyEarned: null, tradeLog }
}

function runSol3x(signals: Signal[], leverage: number = 3): ScenarioResult {
	let equity = STARTING_EQUITY
	let peak = STARTING_EQUITY
	let maxDD = 0
	let trades = 0
	let state: 'long' | 'flat' = signals[0].trend === 'bullish' ? 'long' : 'flat'
	let liquidated = false
	let liquidationDate: string | null = null
	const tradeLog: TradeEntry[] = []
	const bullishDays = signals.filter(s => s.trend === 'bullish').length
	const bearishDays = signals.filter(s => s.trend === 'bearish').length

	for (let i = 1; i < signals.length; i++) {
		if (liquidated) break
		const prev = signals[i - 1]
		const curr = signals[i]
		if (state === 'long') {
			equity *= 1 + ((curr.close - prev.close) / prev.close) * leverage
			if (equity <= STARTING_EQUITY * 0.05) {
				liquidated = true
				liquidationDate = curr.timestamp.toISOString().slice(0, 10)
				equity = 0
				break
			}
		}
		if (curr.flipped) {
			trades++
			state = curr.trend === 'bullish' ? 'long' : 'flat'
			tradeLog.push({ date: curr.timestamp.toISOString().slice(0, 10), action: state === 'long' ? 'LONG' : 'FLAT', price: curr.close, equity })
		}
		if (equity > peak) peak = equity
		const dd = ((peak - equity) / peak) * 100
		if (dd > maxDD) maxDD = dd
	}

	return { name: `SOL ${leverage}x`, trades, returnPct: ((equity - STARTING_EQUITY) / STARTING_EQUITY) * 100, maxDrawdownPct: maxDD, finalEquity: equity, bullishDays, bearishDays, liquidated, liquidationDate, avgApyEarned: null, tradeLog }
}

function runJlp1x(signals: Signal[], jlp: JlpCandle[]): ScenarioResult {
	let equity = STARTING_EQUITY
	let peak = STARTING_EQUITY
	let maxDD = 0
	let trades = 0
	let state: 'long' | 'flat' = signals[0].trend === 'bullish' ? 'long' : 'flat'
	const tradeLog: TradeEntry[] = []
	let totalApyDays = 0
	let sumApy = 0
	const bullishDays = signals.filter(s => s.trend === 'bullish').length
	const bearishDays = signals.filter(s => s.trend === 'bearish').length

	for (let i = 1; i < signals.length; i++) {
		const curr = signals[i]
		if (state === 'long') {
			const priceReturn = (jlp[i].price - jlp[i - 1].price) / jlp[i - 1].price
			const dailyYield = jlp[i].apyAnnualized / 365
			equity *= 1 + priceReturn + dailyYield
			totalApyDays++
			sumApy += jlp[i].apyAnnualized
		}
		if (curr.flipped) {
			trades++
			state = curr.trend === 'bullish' ? 'long' : 'flat'
			tradeLog.push({ date: curr.timestamp.toISOString().slice(0, 10), action: state === 'long' ? 'LONG' : 'FLAT', price: jlp[i].priceWithYield, equity })
		}
		if (equity > peak) peak = equity
		const dd = ((peak - equity) / peak) * 100
		if (dd > maxDD) maxDD = dd
	}

	return { name: 'JLP 1x', trades, returnPct: ((equity - STARTING_EQUITY) / STARTING_EQUITY) * 100, maxDrawdownPct: maxDD, finalEquity: equity, bullishDays, bearishDays, liquidated: false, liquidationDate: null, avgApyEarned: totalApyDays > 0 ? sumApy / totalApyDays : 0, tradeLog }
}

function runJlp3x(signals: Signal[], jlp: JlpCandle[], kamino: KaminoConfig): ScenarioResult {
	let equity = STARTING_EQUITY
	let peak = STARTING_EQUITY
	let maxDD = 0
	let trades = 0
	let state: 'long' | 'flat' = signals[0].trend === 'bullish' ? 'long' : 'flat'
	let liquidated = false
	let liquidationDate: string | null = null
	const tradeLog: TradeEntry[] = []
	let totalApyDays = 0
	let sumNetApy = 0
	const bullishDays = signals.filter(s => s.trend === 'bullish').length
	const bearishDays = signals.filter(s => s.trend === 'bearish').length

	for (let i = 1; i < signals.length; i++) {
		if (liquidated) break
		const curr = signals[i]
		if (state === 'long') {
			const priceReturn = (jlp[i].price - jlp[i - 1].price) / jlp[i - 1].price
			const dailyYield = jlp[i].apyAnnualized / 365
			const lev = leveragedDailyReturn(priceReturn + dailyYield, kamino)
			equity *= 1 + lev.netReturn
			if (lev.liquidated || equity <= STARTING_EQUITY * 0.02) {
				liquidated = true
				liquidationDate = curr.timestamp.toISOString().slice(0, 10)
				equity = 0
				break
			}
			totalApyDays++
			sumNetApy += netLeveragedApy(jlp[i].apyAnnualized, kamino)
		}
		if (curr.flipped) {
			trades++
			state = curr.trend === 'bullish' ? 'long' : 'flat'
			tradeLog.push({ date: curr.timestamp.toISOString().slice(0, 10), action: state === 'long' ? 'LONG' : 'FLAT', price: jlp[i].priceWithYield, equity })
		}
		if (equity > peak) peak = equity
		const dd = ((peak - equity) / peak) * 100
		if (dd > maxDD) maxDD = dd
	}

	return { name: `JLP ${kamino.leverage}x (Kamino)`, trades, returnPct: ((equity - STARTING_EQUITY) / STARTING_EQUITY) * 100, maxDrawdownPct: maxDD, finalEquity: equity, bullishDays, bearishDays, liquidated, liquidationDate, avgApyEarned: totalApyDays > 0 ? sumNetApy / totalApyDays : 0, tradeLog }
}

// ── Public API ───────────────────────────────────────────────

export function runFourScenarios(
	candles: OhlcvCandle[],
	emaLength: number,
	percent: number,
	kaminoConfig: KaminoConfig = DEFAULT_KAMINO
): FourScenarioResult {
	const jlp = modelJlpPrices(candles, DEFAULT_WEIGHTS, DEFAULT_APY)
	const signals = generateSignals(candles, emaLength, percent)

	const scenarios: ScenarioResult[] = [
		runSol1x(signals),
		runSol3x(signals, 3),
		runJlp1x(signals, jlp),
		runJlp3x(signals, jlp, kaminoConfig)
	]

	const solFirst = candles[0].close
	const solLast = candles[candles.length - 1].close
	const jlpFirst = jlp[0].priceWithYield
	const jlpLast = jlp[jlp.length - 1].priceWithYield

	return {
		params: { emaLength, percent },
		totalDays: candles.length,
		dateRange: {
			start: candles[0].timestamp.toISOString().slice(0, 10),
			end: candles[candles.length - 1].timestamp.toISOString().slice(0, 10)
		},
		scenarios,
		buyAndHold: {
			sol: {
				returnPct: ((solLast - solFirst) / solFirst) * 100,
				finalEquity: STARTING_EQUITY * (solLast / solFirst)
			},
			jlp: {
				returnPct: ((jlpLast - jlpFirst) / jlpFirst) * 100,
				finalEquity: STARTING_EQUITY * (jlpLast / jlpFirst)
			}
		}
	}
}
