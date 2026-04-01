import { resolve } from 'path'
import { loadBinanceCsv } from './binance-loader__A.js'
import { type OhlcvCandle, type OttParams, computeOtt } from './ott-indicator__A.js'

const DATA_DIR = resolve(process.cwd(), 'data')

function getWinsLosses(candles: OhlcvCandle[], emaLength: number, pct: number) {
	const params: OttParams = { emaLength, percent: pct, mode: 'ratcheting' }
	const ott = computeOtt(candles, params)

	let state: 'long' | 'flat' = ott[0].trend === 'bullish' ? 'long' : 'flat'
	let buyPrice = state === 'long' ? ott[0].close : 0
	let wins = 0
	let losses = 0

	for (let i = 1; i < ott.length; i++) {
		const prev = ott[i - 1]
		const curr = ott[i]

		if (prev.trend === 'bearish' && curr.trend === 'bullish') {
			state = 'long'
			buyPrice = curr.close
		} else if (prev.trend === 'bullish' && curr.trend === 'bearish') {
			if (curr.close > buyPrice) wins++
			else losses++
			state = 'flat'
		}
	}

	// if still long, count last position
	if (state === 'long') {
		const last = ott[ott.length - 1]
		if (last.close > buyPrice) wins++
		else losses++
	}

	return { wins, losses, total: wins + losses }
}

const configs = [
	{ ema: 25, pct: 0.03 },
	{ ema: 30, pct: 0.03 },
	{ ema: 30, pct: 0.04 },
	{ ema: 40, pct: 0.04 }
]

const datasets = [
	{ label: '2021', file: 'sol/binance-sol-1d-2021.csv' },
	{ label: '2022', file: 'sol/binance-sol-1d-2022.csv' },
	{ label: '2023', file: 'sol/binance-sol-1d-2023.csv' },
	{ label: '2024', file: 'sol/binance-sol-1d-2024.csv' },
	{ label: '2025', file: 'sol/binance-sol-1d-2025.csv' },
	{ label: '2026', file: 'sol/binance-sol-1d-2026.csv' },
	{ label: 'Full', file: 'sol/binance-sol-1d-2021-to-2026-feb.csv' }
]

for (const ds of datasets) {
	const candles = loadBinanceCsv(resolve(DATA_DIR, ds.file))
	console.log(`### ${ds.label}`)
	for (const c of configs) {
		const r = getWinsLosses(candles, c.ema, c.pct)
		console.log(`EMA(${c.ema}) ${(c.pct * 100).toFixed(1)}%: ${r.total} trades — ${r.wins}W / ${r.losses}L`)
	}
	console.log()
}
