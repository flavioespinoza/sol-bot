/**
 * Quick verification script — run with: npx tsx src/engine/verify.ts
 * Confirms engine produces expected results against verified data.
 */

import { resolve } from 'path'
import { loadBinanceCsv } from './csv-loader.js'
import { runBacktest, buyAndHold } from './backtest.js'

const dataFile = resolve(process.cwd(), 'data/sol/binance-sol-1d-2021-to-2026-feb.csv')
const candles = loadBinanceCsv(dataFile)

console.log(`Loaded ${candles.length} candles`)
console.log(`Range: ${candles[0].timestamp.toISOString().slice(0, 10)} → ${candles[candles.length - 1].timestamp.toISOString().slice(0, 10)}`)
console.log()

const configs = [
	{ ema: 25, pct: 0.03 },
	{ ema: 30, pct: 0.03 },
	{ ema: 30, pct: 0.04 },
	{ ema: 40, pct: 0.04 }
]

console.log('EMA  | Band % | Trades | Return %')
console.log('-----|--------|--------|----------')

for (const c of configs) {
	const r = runBacktest(candles, c.ema, c.pct)
	console.log(
		`${String(c.ema).padStart(4)} | ${(c.pct * 100).toFixed(1).padStart(5)}% | ${String(r.trades).padStart(6)} | ${r.returnPct.toFixed(2).padStart(9)}%`
	)
}

console.log()
const bnh = buyAndHold(candles)
console.log(`Buy & Hold: ${bnh.returnPct.toFixed(2)}% | $${bnh.finalEquity.toFixed(0)}`)
