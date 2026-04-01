import { resolve } from 'path'
import { loadBinanceCsv } from './binance-loader__A.js'
import { type OhlcvCandle, type OttParams, computeOtt } from './ott-indicator__A.js'

const DATA_DIR = resolve(process.cwd(), 'data')
const EMA_LENGTH = 25
const OTT_PCT = 0.03

function getTradeLog(candles: OhlcvCandle[]) {
	const params: OttParams = { emaLength: EMA_LENGTH, percent: OTT_PCT, mode: 'ratcheting' }
	const ott = computeOtt(candles, params)

	const trades: {
		buyDate: string
		buyPrice: number
		sellDate: string
		sellPrice: number
		daysHeld: number
		pnlDollar: number
		pnlPct: number
	}[] = []

	let state: 'long' | 'flat' = ott[0].trend === 'bullish' ? 'long' : 'flat'
	let buyDate = ''
	let buyPrice = 0
	let dayCount = 0

	if (state === 'long') {
		buyDate = ott[0].timestamp.toISOString().slice(0, 10)
		buyPrice = ott[0].close
		dayCount = 1
	}

	for (let i = 1; i < ott.length; i++) {
		const prev = ott[i - 1]
		const curr = ott[i]

		if (state === 'long') dayCount++

		if (prev.trend === 'bearish' && curr.trend === 'bullish') {
			state = 'long'
			buyDate = curr.timestamp.toISOString().slice(0, 10)
			buyPrice = curr.close
			dayCount = 1
		} else if (prev.trend === 'bullish' && curr.trend === 'bearish') {
			const sellDate = curr.timestamp.toISOString().slice(0, 10)
			const sellPrice = curr.close
			trades.push({
				buyDate,
				buyPrice,
				sellDate,
				sellPrice,
				daysHeld: dayCount,
				pnlDollar: sellPrice - buyPrice,
				pnlPct: ((sellPrice - buyPrice) / buyPrice) * 100
			})
			state = 'flat'
			dayCount = 0
		}
	}

	// if still long at end, close it with last candle
	if (state === 'long') {
		const last = ott[ott.length - 1]
		trades.push({
			buyDate,
			buyPrice,
			sellDate: last.timestamp.toISOString().slice(0, 10) + ' (open)',
			sellPrice: last.close,
			daysHeld: dayCount,
			pnlDollar: last.close - buyPrice,
			pnlPct: ((last.close - buyPrice) / buyPrice) * 100
		})
	}

	return trades
}

function fmtPct(n: number): string {
	if (n < 0) return `(${Math.abs(n).toFixed(2)}%)`
	return `+${n.toFixed(2)}%`
}

function fmtDollar(n: number): string {
	if (n < 0) return `($${Math.abs(n).toFixed(2)})`
	return `+$${n.toFixed(2)}`
}

const datasets = [
	{ label: '2021', file: 'sol/binance-sol-1d-2021.csv' },
	{ label: '2022', file: 'sol/binance-sol-1d-2022.csv' },
	{ label: '2023', file: 'sol/binance-sol-1d-2023.csv' },
	{ label: '2024', file: 'sol/binance-sol-1d-2024.csv' },
	{ label: '2025', file: 'sol/binance-sol-1d-2025.csv' },
	{ label: '2026 (Jan-Feb)', file: 'sol/binance-sol-1d-2026.csv' }
]

for (const ds of datasets) {
	const candles = loadBinanceCsv(resolve(DATA_DIR, ds.file))
	const trades = getTradeLog(candles)

	console.log(`### ${ds.label}`)
	console.log()
	console.log(`| Trade | BUY Date | BUY Price | SELL Date | SELL Price | Days Held | P&L | P&L % |`)
	console.log(`|-------|----------|-----------|-----------|-----------|-----------|-----|-------|`)

	for (let i = 0; i < trades.length; i++) {
		const t = trades[i]
		console.log(`| ${i + 1} | ${t.buyDate} | $${t.buyPrice.toFixed(2)} | ${t.sellDate} | $${t.sellPrice.toFixed(2)} | ${t.daysHeld} | ${fmtDollar(t.pnlDollar)} | ${fmtPct(t.pnlPct)} |`)
	}

	const wins = trades.filter(t => t.pnlDollar > 0).length
	const losses = trades.filter(t => t.pnlDollar <= 0).length
	console.log()
	console.log(`**${trades.length} trades** — ${wins} wins, ${losses} losses`)
	console.log()
	console.log(`---`)
	console.log()
}
