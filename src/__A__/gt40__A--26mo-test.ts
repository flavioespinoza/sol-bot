import { resolve } from 'path'
import { loadBinanceCsv } from './binance-loader__A.js'
import { type OhlcvCandle, type OttParams, computeOtt } from './ott-indicator__A.js'

const DATA_DIR = resolve(process.cwd(), 'data')
const STARTING_EQUITY = 10000

const configs = [
	{ ema: 25, pct: 0.03 },
	{ ema: 30, pct: 0.03 },
	{ ema: 30, pct: 0.04 },
	{ ema: 40, pct: 0.04 }
]

function runFord(candles: OhlcvCandle[], emaLength: number, pct: number) {
	const params: OttParams = { emaLength, percent: pct, mode: 'ratcheting' }
	const ott = computeOtt(candles, params)

	let equity = STARTING_EQUITY
	let peak = STARTING_EQUITY
	let maxDD = 0
	let state: 'long' | 'flat' = ott[0].trend === 'bullish' ? 'long' : 'flat'
	let wins = 0
	let losses = 0
	let trades = 0
	let buyPrice = state === 'long' ? ott[0].close : 0

	for (let i = 1; i < ott.length; i++) {
		const prev = ott[i - 1]
		const curr = ott[i]

		// __A.1: return BEFORE flip
		if (state === 'long') {
			const dailyReturn = (curr.close - prev.close) / prev.close
			equity *= 1 + dailyReturn
		}

		if (curr.trend !== prev.trend) {
			if (prev.trend === 'bullish' && curr.trend === 'bearish') {
				// SELL
				if (curr.close > buyPrice) wins++
				else losses++
			}
			if (prev.trend === 'bearish' && curr.trend === 'bullish') {
				buyPrice = curr.close
			}
			trades++
			state = curr.trend === 'bullish' ? 'long' : 'flat'
		}

		if (equity > peak) peak = equity
		const dd = ((peak - equity) / peak) * 100
		if (dd > maxDD) maxDD = dd
	}

	// close open position
	if (state === 'long') {
		const last = ott[ott.length - 1]
		if (last.close > buyPrice) wins++
		else losses++
	}

	const totalTrades = Math.ceil(trades / 2)
	return {
		emaLength, pct, trades: totalTrades, wins, losses,
		returnPct: ((equity - STARTING_EQUITY) / STARTING_EQUITY) * 100,
		maxDD, finalEquity: equity
	}
}

// Load full range and filter to Jan 2024 - Feb 2026
const allCandles = loadBinanceCsv(resolve(DATA_DIR, 'sol/binance-sol-1d-2021-to-2026-feb.csv'))
const start = new Date('2024-01-01')
const end = new Date('2026-02-28')
const candles = allCandles.filter(c => c.timestamp >= start && c.timestamp <= end)

const firstDate = candles[0].timestamp.toISOString().slice(0, 10)
const lastDate = candles[candles.length - 1].timestamp.toISOString().slice(0, 10)
const firstPrice = candles[0].close
const lastPrice = candles[candles.length - 1].close
const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100

console.log(`26-Month Window: ${firstDate} → ${lastDate}`)
console.log(`Candles: ${candles.length}`)
console.log(`SOL: $${firstPrice.toFixed(2)} → $${lastPrice.toFixed(2)} (${priceChange.toFixed(2)}%)`)
console.log()

// Buy & hold
const bnhReturn = ((lastPrice - firstPrice) / firstPrice) * 100
const bnhEquity = STARTING_EQUITY * (1 + bnhReturn / 100)
let bnhPeak = STARTING_EQUITY
let bnhMaxDD = 0
for (const c of candles) {
	const eq = STARTING_EQUITY * (c.close / firstPrice)
	if (eq > bnhPeak) bnhPeak = eq
	const dd = ((bnhPeak - eq) / bnhPeak) * 100
	if (dd > bnhMaxDD) bnhMaxDD = dd
}
console.log(`Buy & Hold: $10K → $${bnhEquity.toFixed(0)} (${bnhReturn.toFixed(2)}%) | Max DD: ${bnhMaxDD.toFixed(2)}%`)
console.log()

for (const c of configs) {
	const r = runFord(candles, c.ema, c.pct)
	const pctStr = r.returnPct < 0
		? `(${Math.abs(r.returnPct).toFixed(2)}%)`
		: `+${r.returnPct.toFixed(2)}%`
	console.log(`EMA(${r.emaLength}) ${(r.pct * 100).toFixed(1)}%: ${r.trades} trades | ${r.wins}W / ${r.losses}L | ${pctStr} | Max DD: ${r.maxDD.toFixed(2)}% | $10K → $${r.finalEquity.toFixed(0)}`)
}
