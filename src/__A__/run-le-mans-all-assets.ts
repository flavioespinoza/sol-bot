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
	const bearishDays = ott.filter((c) => c.trend === 'bearish').length

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

	return {
		emaLength,
		percent: pct,
		trades,
		returnPct: ((equity - STARTING_EQUITY) / STARTING_EQUITY) * 100,
		maxDD,
		finalEquity: equity,
		bullishDays,
		bearishDays
	}
}

function buyAndHold(candles: OhlcvCandle[]) {
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
	return { returnPct, maxDD, finalEquity }
}

function runAsset(label: string, file: string) {
	const raw = loadBinanceCsv(resolve(DATA_DIR, file))
	const firstDate = raw[0].timestamp.toISOString().slice(0, 10)
	const lastDate = raw[raw.length - 1].timestamp.toISOString().slice(0, 10)
	const firstPrice = raw[0].close
	const lastPrice = raw[raw.length - 1].close
	const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100

	console.log('╔══════════════════════════════════════════════════════════════╗')
	console.log(`║  GT40 — ${label.padEnd(52)}║`)
	console.log('╚══════════════════════════════════════════════════════════════╝')
	console.log()
	console.log(`Candles:  ${raw.length}`)
	console.log(`Range:    ${firstDate} → ${lastDate}`)
	console.log(`Price:    $${firstPrice.toFixed(2)} → $${lastPrice.toFixed(2)} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%)`)
	console.log()

	const configs = [
		{ ema: 25, pct: 0.03 },
		{ ema: 30, pct: 0.03 },
		{ ema: 30, pct: 0.04 },
		{ ema: 40, pct: 0.04 }
	]

	console.log('Settings        | Trades | Return        | Max DD  | 10K becomes | In Market')
	console.log('----------------|--------|---------------|---------|-------------|----------')
	for (const c of configs) {
		const r = runFord(raw, c.ema, c.pct)
		const ret = (r.returnPct >= 0 ? '+' : '') + r.returnPct.toFixed(0) + '%'
		const dd = r.maxDD.toFixed(1) + '%'
		const final = r.finalEquity.toFixed(0)
		const inMarket = ((r.bullishDays / raw.length) * 100).toFixed(0) + '%'
		console.log(
			`EMA(${r.emaLength}) ${(r.percent * 100).toFixed(1)}%`.padEnd(16) +
				`| ${String(r.trades).padStart(6)} | ${ret.padStart(13)} | ${dd.padStart(7)} | ${final.padStart(11)} | ${inMarket.padStart(8)}`
		)
	}

	const bnh = buyAndHold(raw)
	console.log()
	console.log(`Buy & Hold:     Return ${bnh.returnPct >= 0 ? '+' : ''}${bnh.returnPct.toFixed(2)}% | Max DD ${bnh.maxDD.toFixed(1)}% | 10K → $${bnh.finalEquity.toFixed(0)}`)
	console.log()
}

// ── Run all three assets ─────────────────────────────────────

const year = process.argv[2] || '2021'

const files: Record<string, { sol: string; btc: string; sp500: string }> = {
	'2021': { sol: 'sol/binance-sol-1d-2021.csv', btc: 'btc/binance-btc-1d-2021.csv', sp500: 'sp500/binance-sp500-1d-2021.csv' },
	'2022': { sol: 'sol/binance-sol-1d-2022.csv', btc: 'btc/binance-btc-1d-2022.csv', sp500: 'sp500/binance-sp500-1d-2022.csv' },
	'2023': { sol: 'sol/binance-sol-1d-2023.csv', btc: 'btc/binance-btc-1d-2023.csv', sp500: 'sp500/binance-sp500-1d-2023.csv' },
	'2024': { sol: 'sol/binance-sol-1d-2024.csv', btc: 'btc/binance-btc-1d-2024.csv', sp500: 'sp500/binance-sp500-1d-2024.csv' },
	'2025': { sol: 'sol/binance-sol-1d-2025.csv', btc: 'btc/binance-btc-1d-2025.csv', sp500: 'sp500/binance-sp500-1d-2025.csv' },
	'2026': { sol: 'sol/binance-sol-1d-2026.csv', btc: 'btc/binance-btc-1d-2026.csv', sp500: 'sp500/binance-sp500-1d-2026.csv' },
	'26mo': { sol: 'sol/binance-sol-1d-2024-to-2026-feb.csv', btc: 'btc/binance-btc-1d-2024-to-2026-feb.csv', sp500: 'sp500/binance-sp500-1d-2024-to-2026-feb.csv' }
}

const f = files[year]
if (!f) { console.log('Usage: npx tsx run-le-mans-all-assets.ts [2021|2022|2023|2024|2025|2026|26mo]'); process.exit(1) }

runAsset(`SOL/USDT — ${year}`, f.sol)
console.log('═'.repeat(64))
console.log()
runAsset(`BTC/USDT — ${year}`, f.btc)
console.log('═'.repeat(64))
console.log()
runAsset(`SP500 — ${year}`, f.sp500)
