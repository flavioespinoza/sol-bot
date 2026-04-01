import { resolve } from 'path'
import { loadBinanceCsv } from './binance-loader__A.js'
import { type OhlcvCandle, type OttParams, computeOtt } from './ott-indicator__A.js'

const DATA_DIR = resolve(process.cwd(), 'data')
const STARTING_EQUITY = 10000

function runFord(candles: OhlcvCandle[], emaLength: number, pct: number) {
	const params: OttParams = { emaLength, percent: pct, mode: 'ratcheting' }
	const ott = computeOtt(candles, params)
	let equity = STARTING_EQUITY
	let peak = STARTING_EQUITY
	let maxDD = 0
	let trades = 0
	let state: 'long' | 'flat' = ott[0].trend === 'bullish' ? 'long' : 'flat'
	const bullishDays = ott.filter((c) => c.trend === 'bullish').length

	for (let i = 1; i < ott.length; i++) {
		const prev = ott[i - 1]
		const curr = ott[i]
		if (curr.trend !== prev.trend) {
			trades++
			state = curr.trend === 'bullish' ? 'long' : 'flat'
		}
		if (state === 'long') {
			equity *= 1 + (curr.close - prev.close) / prev.close
		}
		if (equity > peak) peak = equity
		const dd = ((peak - equity) / peak) * 100
		if (dd > maxDD) maxDD = dd
	}

	return { emaLength, percent: pct, trades, returnPct: ((equity - STARTING_EQUITY) / STARTING_EQUITY) * 100, maxDD, finalEquity: equity, bullishDays }
}

const raw = loadBinanceCsv(resolve(DATA_DIR, 'sol/binance-sol-1d-2024-to-2026-feb.csv'))
const firstDate = raw[0].timestamp.toISOString().slice(0, 10)
const lastDate = raw[raw.length - 1].timestamp.toISOString().slice(0, 10)

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║  GT40 — Le Mans Validation (26 months, Jan 2024 - Feb 2026)║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log()
console.log(`Candles:  ${raw.length}`)
console.log(`Range:    ${firstDate} → ${lastDate}`)
console.log()

const configs = [
	{ ema: 25, pct: 0.03 },
	{ ema: 30, pct: 0.03 },
	{ ema: 30, pct: 0.04 },
	{ ema: 40, pct: 0.04 }
]

console.log('Settings        | Trades | Return        | Max DD  | 10K becomes')
console.log('----------------|--------|---------------|---------|------------')
for (const c of configs) {
	const r = runFord(raw, c.ema, c.pct)
	const ret = '+' + r.returnPct.toFixed(0) + '%'
	const dd = r.maxDD.toFixed(1) + '%'
	const final = r.finalEquity.toFixed(0)
	console.log(
		`EMA(${r.emaLength}) ${(r.percent * 100).toFixed(1)}%`.padEnd(16) +
			`| ${String(r.trades).padStart(6)} | ${ret.padStart(13)} | ${dd.padStart(7)} | ${final.padStart(10)}`
	)
}

console.log()
console.log('Le Mans Spec #6 reference:')
console.log('EMA(25) 3.0%    |     66 |       +4,036% |   16.3% |    413,555')
console.log('EMA(30) 3.0%    |     52 |       +2,196% |   16.3% |    229,552')
console.log('EMA(30) 4.0%    |     50 |       +1,377% |   16.3% |    147,729')
console.log('EMA(40) 4.0%    |     40 |       +1,033% |   16.9% |    113,321')
