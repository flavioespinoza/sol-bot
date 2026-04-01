import { resolve } from 'path'
import { loadBinanceCsv } from './binance-loader__A.js'
import { type OhlcvCandle, type OttParams, computeOtt } from './ott-indicator__A.js'

const DATA_DIR = resolve(process.cwd(), 'data')
const STARTING_EQUITY = 10000

/**
 * FORD GT40 — THE WHOLE ENGINE IN ONE FILE
 *
 * Origin: Smoke Detector → Smoke Tuned → Ford
 *
 * The rule (there is only one):
 *   - 1D OTT trend bullish → LONG (1x, no leverage)
 *   - 1D OTT trend bearish → FLAT (0x, sitting in stables)
 *
 * No leverage. No multi-timeframe. No RSI. No 9 rules.
 * Just one indicator, one timeframe, one decision: in or out.
 *
 * This file runs:
 *   1. Parameter sweep (find the best EMA + band combo)
 *   2. Full backtest on the best configs
 *   3. Trade log for the recommended config
 *   4. Buy & hold comparison
 *
 * Data: binance-1d.csv (SOL/USDT daily candles from Binance)
 */

// ── Types ────────────────────────────────────────────────────

interface FordResult {
	emaLength: number
	percent: number
	trades: number
	returnPct: number
	maxDD: number
	finalEquity: number
	bullishDays: number
	bearishDays: number
	tradeLog: TradeEntry[]
}

interface TradeEntry {
	date: string
	action: 'LONG' | 'FLAT'
	price: number
	equity: number
}

// ── Core Engine ──────────────────────────────────────────────

function runFord(candles: OhlcvCandle[], emaLength: number, pct: number): FordResult {
	const params: OttParams = { emaLength, percent: pct, mode: 'ratcheting' }
	const ott = computeOtt(candles, params)

	let equity = STARTING_EQUITY
	let peak = STARTING_EQUITY
	let maxDD = 0
	let trades = 0
	let state: 'long' | 'flat' = ott[0].trend === 'bullish' ? 'long' : 'flat'
	const tradeLog: TradeEntry[] = []

	const bullishDays = ott.filter((c) => c.trend === 'bullish').length
	const bearishDays = ott.filter((c) => c.trend === 'bearish').length

	for (let i = 1; i < ott.length; i++) {
		const prev = ott[i - 1]
		const curr = ott[i]

		// ── EXECUTION MODEL: Next-Bar Entry (TradingView parity) ─────────
		// Return is calculated BEFORE the trend flip is applied.
		// On the bar where OTT flips bullish, the state is still 'flat'
		// from the prior bar, so that bar's move is NOT credited.
		// The new long position starts capturing P&L on the NEXT bar.
		//
		// This matches TradingView (process_orders_on_close=true) and
		// every standard backtest engine. The signal fires at bar N's
		// close, the fill happens at bar N's close, and the first P&L
		// tick is bar N+1.
		//
		// Fix applied Apr 01 2026. Prior version had signal bar capture
		// (look-ahead bias). See: _archive/pre-fix--2026-04-01.zip
		// ─────────────────────────────────────────────────────────────────

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
		percent: pct,
		trades,
		returnPct: ((equity - STARTING_EQUITY) / STARTING_EQUITY) * 100,
		maxDD,
		finalEquity: equity,
		bullishDays,
		bearishDays,
		tradeLog
	}
}

// ── Buy & Hold Baseline ─────────────────────────────────────

function buyAndHold(candles: OhlcvCandle[]): {
	returnPct: number
	maxDD: number
	finalEquity: number
} {
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

// ── Run One Dataset ──────────────────────────────────────────

function runDataset(label: string, filename: string) {
	const raw1d = loadBinanceCsv(resolve(DATA_DIR, filename))

	const firstPrice = raw1d[0].close
	const lastPrice = raw1d[raw1d.length - 1].close
	const firstDate = raw1d[0].timestamp.toISOString().slice(0, 10)
	const lastDate = raw1d[raw1d.length - 1].timestamp.toISOString().slice(0, 10)

	console.log('╔══════════════════════════════════════════════════════════════╗')
	console.log(`║  FORD GT40 — ${label.padEnd(46)}║`)
	console.log('║  1 rule: OTT bullish = long (1x) | OTT bearish = flat (0x) ║')
	console.log('╚══════════════════════════════════════════════════════════════╝')
	console.log()
	console.log(`Data:     ${filename}`)
	console.log(`Candles:  ${raw1d.length}`)
	console.log(`Range:    ${firstDate} → ${lastDate}`)
	console.log(`SOL:      $${firstPrice.toFixed(2)} → $${lastPrice.toFixed(2)} (${(((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2)}%)`)
	console.log(`Starting: $${STARTING_EQUITY.toLocaleString()}`)
	console.log()

	// ── 1. Parameter Sweep ───────────────────────────────────

	console.log('━━━ PARAMETER SWEEP ━━━')
	console.log()

	const configs = [
		{ ema: 10, pct: 0.014 },
		{ ema: 14, pct: 0.02 },
		{ ema: 20, pct: 0.02 },
		{ ema: 20, pct: 0.03 },
		{ ema: 25, pct: 0.03 },
		{ ema: 30, pct: 0.03 },
		{ ema: 30, pct: 0.04 },
		{ ema: 40, pct: 0.04 },
		{ ema: 40, pct: 0.05 },
		{ ema: 50, pct: 0.05 }
	]

	const results: FordResult[] = []
	for (const c of configs) {
		results.push(runFord(raw1d, c.ema, c.pct))
	}

	console.log(
		'EMA  | Band % | Trades | Return %      | Max DD % | $10K →        | In Market'
	)
	console.log(
		'-----|--------|--------|---------------|----------|---------------|----------'
	)

	for (const r of results) {
		const inMarketPct = ((r.bullishDays / raw1d.length) * 100).toFixed(0)
		console.log(
			`${String(r.emaLength).padStart(4)} | ${(r.percent * 100).toFixed(1).padStart(5)}% | ${String(r.trades).padStart(6)} | ${r.returnPct.toFixed(2).padStart(12)}% | ${r.maxDD.toFixed(2).padStart(7)}% | $${r.finalEquity.toFixed(0).padStart(12)} | ${inMarketPct}%`
		)
	}

	// ── 2. Best Configs (20-50 trades) ───────────────────────

	console.log()
	console.log('━━━ RECOMMENDED (20-50 trades, sweet spot) ━━━')
	console.log()

	const sweet = results.filter((r) => r.trades >= 20 && r.trades <= 50)
	for (const r of sweet) {
		const inMarketPct = ((r.bullishDays / raw1d.length) * 100).toFixed(0)
		const tradesPerYear = ((r.trades / raw1d.length) * 365).toFixed(0)
		console.log(`  EMA(${r.emaLength}) + ${(r.percent * 100).toFixed(1)}% band`)
		console.log(`    Trades:    ${r.trades} (~${tradesPerYear}/year)`)
		console.log(`    Return:    ${r.returnPct.toFixed(2)}%`)
		console.log(`    Max DD:    ${r.maxDD.toFixed(2)}%`)
		console.log(`    $10K  →    $${r.finalEquity.toFixed(0).toLocaleString()}`)
		console.log(`    $50K  →    $${(r.finalEquity * 5).toFixed(0).toLocaleString()}`)
		console.log(`    $100K →    $${(r.finalEquity * 10).toFixed(0).toLocaleString()}`)
		console.log(`    In market: ${r.bullishDays} days (${inMarketPct}%) | Flat: ${r.bearishDays} days`)
		console.log()
	}

	// ── 3. Buy & Hold Comparison ─────────────────────────────

	const bnh = buyAndHold(raw1d)
	const best = sweet.length > 0 ? sweet[0] : results[results.length - 1]

	console.log('━━━ FORD vs BUY & HOLD ━━━')
	console.log()
	console.log(
		'Strategy              | Final Equity  | Return %      | Max DD %'
	)
	console.log(
		'----------------------|---------------|---------------|----------'
	)
	console.log(
		`Buy & Hold 1x         | $${bnh.finalEquity.toFixed(2).padStart(12)} | ${bnh.returnPct.toFixed(2).padStart(12)}% | ${bnh.maxDD.toFixed(2).padStart(7)}%`
	)
	console.log(
		`Ford EMA(${best.emaLength}) ${(best.percent * 100).toFixed(1)}%`.padEnd(22) +
			`| $${best.finalEquity.toFixed(2).padStart(12)} | ${best.returnPct.toFixed(2).padStart(12)}% | ${best.maxDD.toFixed(2).padStart(7)}%`
	)
	console.log()

	// ── 4. Trade Log (best config) ───────────────────────────

	console.log(`━━━ TRADE LOG — EMA(${best.emaLength}) + ${(best.percent * 100).toFixed(1)}% (${best.trades} trades) ━━━`)
	console.log()

	for (const t of best.tradeLog) {
		const action = t.action === 'LONG' ? 'LONG (1x)  ' : 'FLAT (0x)  '
		console.log(`  ${t.date} | ${action} | price=$${t.price.toFixed(2).padStart(8)} | equity=$${t.equity.toFixed(2)}`)
	}

	console.log()
}

// ── Main ─────────────────────────────────────────────────────

function main() {
	const datasets = [
		{ label: 'SOL 2025-Dec to 2026-Mar (Starting Point)', file: 'sol/_binance-sol-1d-2025-dec-to-2026-mar.csv' },
		{ label: 'SOL 2021 (Full Year)', file: 'sol/binance-sol-1d-2021.csv' },
		{ label: 'SOL 2022 (Full Year)', file: 'sol/binance-sol-1d-2022.csv' },
		{ label: 'SOL 2023 (Full Year)', file: 'sol/binance-sol-1d-2023.csv' },
		{ label: 'SOL 2024 (Full Year)', file: 'sol/binance-sol-1d-2024.csv' },
		{ label: 'SOL 2025 (Full Year)', file: 'sol/binance-sol-1d-2025.csv' },
		{ label: 'SOL 2026 (Jan-Feb)', file: 'sol/binance-sol-1d-2026.csv' },
		{ label: 'SOL 2021-2026 Feb (Full Range)', file: 'sol/binance-sol-1d-2021-to-2026-feb.csv' }
	]

	for (let i = 0; i < datasets.length; i++) {
		const ds = datasets[i]
		runDataset(ds.label, ds.file)
		if (i < datasets.length - 1) {
			console.log()
			console.log('═'.repeat(64))
			console.log()
		}
	}
}

main()
