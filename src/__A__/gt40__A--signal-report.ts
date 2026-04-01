import { resolve } from 'path'
import { loadBinanceCsv } from './binance-loader__A.js'
import { type OhlcvCandle, type OttParams, computeOtt } from './ott-indicator__A.js'

/**
 * GT40__A Signal Report
 *
 * The GT40 is a SIGNAL ENGINE — it only outputs bullish or bearish.
 * It does not buy, sell, or hold anything.
 *
 * This script reads GT40 signals and translates them into what
 * a human (Trajan) or future automated bot (Phase 5) would do:
 *
 *   | GT40 Yesterday | GT40 Today | Action |
 *   |----------------|------------|--------|
 *   | Bearish        | Bullish    | BUY    |
 *   | Bullish        | Bullish    | HOLD   |
 *   | Bullish        | Bearish    | SELL   |
 *   | Bearish        | Bearish    | WAIT   |
 *
 * The GT40 does NOT decide to buy, sell, or hold.
 * The human or bot decides based on the signal.
 */

const DATA_DIR = resolve(process.cwd(), 'data')
const STARTING_EQUITY = 10000
const EMA_LENGTH = 25
const OTT_PCT = 0.03

interface SignalDay {
	date: string
	signal: 'BUY' | 'SELL' | 'HOLD' | 'WAIT'
	price: number
	equity: number
}

interface YearReport {
	year: string
	candles: number
	priceStart: number
	priceEnd: number
	priceChange: number
	buySignals: number
	sellSignals: number
	holdDays: number
	waitDays: number
	returnPct: number
	finalEquity: number
	maxDD: number
	bnh_returnPct: number
	bnh_finalEquity: number
	bnh_maxDD: number
}

function runSignalReport(candles: OhlcvCandle[]): { days: SignalDay[]; report: YearReport } {
	const params: OttParams = { emaLength: EMA_LENGTH, percent: OTT_PCT, mode: 'ratcheting' }
	const ott = computeOtt(candles, params)

	let equity = STARTING_EQUITY
	let peak = STARTING_EQUITY
	let maxDD = 0
	let state: 'long' | 'flat' = ott[0].trend === 'bullish' ? 'long' : 'flat'

	let buySignals = 0
	let sellSignals = 0
	let holdDays = 0
	let waitDays = 0

	const days: SignalDay[] = []

	// first bar — no previous signal to compare
	if (state === 'long') {
		buySignals++
		days.push({ date: ott[0].timestamp.toISOString().slice(0, 10), signal: 'BUY', price: ott[0].close, equity })
	} else {
		waitDays++
		days.push({ date: ott[0].timestamp.toISOString().slice(0, 10), signal: 'WAIT', price: ott[0].close, equity })
	}

	for (let i = 1; i < ott.length; i++) {
		const prev = ott[i - 1]
		const curr = ott[i]

		// capture return BEFORE signal (next-bar entry — __A.1 model)
		if (state === 'long') {
			const dailyReturn = (curr.close - prev.close) / prev.close
			equity *= 1 + dailyReturn
		}

		// determine signal
		let signal: 'BUY' | 'SELL' | 'HOLD' | 'WAIT'

		if (prev.trend === 'bearish' && curr.trend === 'bullish') {
			signal = 'BUY'
			buySignals++
			state = 'long'
		} else if (prev.trend === 'bullish' && curr.trend === 'bearish') {
			signal = 'SELL'
			sellSignals++
			state = 'flat'
		} else if (curr.trend === 'bullish') {
			signal = 'HOLD'
			holdDays++
		} else {
			signal = 'WAIT'
			waitDays++
		}

		days.push({ date: curr.timestamp.toISOString().slice(0, 10), signal, price: curr.close, equity })

		if (equity > peak) peak = equity
		const dd = ((peak - equity) / peak) * 100
		if (dd > maxDD) maxDD = dd
	}

	// buy & hold
	const firstPrice = candles[0].close
	const lastPrice = candles[candles.length - 1].close
	const bnh_returnPct = ((lastPrice - firstPrice) / firstPrice) * 100
	const bnh_finalEquity = STARTING_EQUITY * (1 + bnh_returnPct / 100)
	let bnh_peak = STARTING_EQUITY
	let bnh_maxDD = 0
	for (const c of candles) {
		const eq = STARTING_EQUITY * (c.close / firstPrice)
		if (eq > bnh_peak) bnh_peak = eq
		const dd = ((bnh_peak - eq) / bnh_peak) * 100
		if (dd > bnh_maxDD) bnh_maxDD = dd
	}

	return {
		days,
		report: {
			year: candles[0].timestamp.toISOString().slice(0, 4),
			candles: candles.length,
			priceStart: firstPrice,
			priceEnd: lastPrice,
			priceChange: ((lastPrice - firstPrice) / firstPrice) * 100,
			buySignals,
			sellSignals,
			holdDays,
			waitDays,
			returnPct: ((equity - STARTING_EQUITY) / STARTING_EQUITY) * 100,
			finalEquity: equity,
			maxDD,
			bnh_returnPct,
			bnh_finalEquity,
			bnh_maxDD
		}
	}
}

function fmtPct(n: number): string {
	if (n < 0) return `(${Math.abs(n).toFixed(2)}%)`
	return `+${n.toFixed(2)}%`
}

function fmtMoney(n: number): string {
	return `$${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

function printReport(label: string, r: YearReport) {
	const totalSignalDays = r.buySignals + r.sellSignals + r.holdDays + r.waitDays

	console.log(`### ${label}`)
	console.log()
	console.log(`| Metric | Value |`)
	console.log(`|--------|-------|`)
	console.log(`| Candles | ${r.candles} |`)
	console.log(`| SOL | ${fmtMoney(r.priceStart)} → ${fmtMoney(r.priceEnd)} ${fmtPct(r.priceChange)} |`)
	console.log()
	console.log(`| Signal | Count | % of Days |`)
	console.log(`|--------|-------|-----------|`)
	console.log(`| BUY | ${r.buySignals} | ${((r.buySignals / totalSignalDays) * 100).toFixed(1)}% |`)
	console.log(`| HOLD | ${r.holdDays} | ${((r.holdDays / totalSignalDays) * 100).toFixed(1)}% |`)
	console.log(`| SELL | ${r.sellSignals} | ${((r.sellSignals / totalSignalDays) * 100).toFixed(1)}% |`)
	console.log(`| WAIT | ${r.waitDays} | ${((r.waitDays / totalSignalDays) * 100).toFixed(1)}% |`)
	console.log()
	console.log(`| Strategy | Return | $10K → | Max DD |`)
	console.log(`|----------|--------|--------|--------|`)
	console.log(`| GT40 signals | ${fmtPct(r.returnPct)} | ${fmtMoney(r.finalEquity)} | ${r.maxDD.toFixed(2)}% |`)
	console.log(`| Buy & Hold | ${fmtPct(r.bnh_returnPct)} | ${fmtMoney(r.bnh_finalEquity)} | ${r.bnh_maxDD.toFixed(2)}% |`)
	console.log()
}

// ── Main ─────────────────────────────────────────────────────

function main() {
	console.log('# GT40__A.1 — Signal Report | EMA(25) 3.0% OTT')
	console.log()
	console.log('Signal engine output — the GT40 does NOT buy, sell, or hold.')
	console.log('It outputs bullish or bearish. The action is decided by the trader or bot.')
	console.log()
	console.log('| GT40 Yesterday | GT40 Today | Action |')
	console.log('|----------------|------------|--------|')
	console.log('| Bearish        | Bullish    | BUY    |')
	console.log('| Bullish        | Bullish    | HOLD   |')
	console.log('| Bullish        | Bearish    | SELL   |')
	console.log('| Bearish        | Bearish    | WAIT   |')
	console.log()
	console.log('---')
	console.log()

	const datasets = [
		{ label: 'SOL 2021 (Full Year)', file: 'sol/binance-sol-1d-2021.csv' },
		{ label: 'SOL 2022 (Full Year)', file: 'sol/binance-sol-1d-2022.csv' },
		{ label: 'SOL 2023 (Full Year)', file: 'sol/binance-sol-1d-2023.csv' },
		{ label: 'SOL 2024 (Full Year)', file: 'sol/binance-sol-1d-2024.csv' },
		{ label: 'SOL 2025 (Full Year)', file: 'sol/binance-sol-1d-2025.csv' },
		{ label: 'SOL 2026 (Jan-Feb)', file: 'sol/binance-sol-1d-2026.csv' },
		{ label: 'SOL 2021-2026 Feb (Full Range)', file: 'sol/binance-sol-1d-2021-to-2026-feb.csv' }
	]

	for (const ds of datasets) {
		const candles = loadBinanceCsv(resolve(DATA_DIR, ds.file))
		const { report } = runSignalReport(candles)
		printReport(ds.label, report)
		console.log('---')
		console.log()
	}
}

main()
