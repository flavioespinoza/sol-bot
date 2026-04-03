import { resolve } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { loadBinanceCsv } from '@/engine/csv-loader'
import { runFourScenarios } from '@/engine/jlp-backtest'

/**
 * GET /api/jlp-backtest
 *
 * Four-scenario backtest: SOL 1x, SOL 3x, JLP 1x, JLP 3x
 *
 * Query params:
 *   ema      — EMA length (default 40)
 *   percent  — OTT band % as decimal (default 0.04)
 *   from     — Start date filter YYYY-MM-DD (optional, e.g. "2024-01-01")
 *   leverage — Kamino leverage multiplier (default 3)
 *   borrow   — Kamino annual borrow rate as decimal (default 0.15)
 */
export async function GET(request: NextRequest) {
	const sp = request.nextUrl.searchParams
	const emaLength = parseInt(sp.get('ema') || '40')
	const percent = parseFloat(sp.get('percent') || '0.04')
	const fromDate = sp.get('from') || null
	const leverage = parseFloat(sp.get('leverage') || '3')
	const borrowRate = parseFloat(sp.get('borrow') || '0.15')

	const dataFile = resolve(process.cwd(), 'data/sol/binance-sol-1d-2021-to-2026-feb.csv')
	let candles = loadBinanceCsv(dataFile)

	// Optional date filter
	if (fromDate) {
		const startDate = new Date(fromDate)
		candles = candles.filter(c => c.timestamp >= startDate)
	}

	if (candles.length < 2) {
		return NextResponse.json({ error: 'Not enough candles for the given date range' }, { status: 400 })
	}

	const result = runFourScenarios(candles, emaLength, percent, {
		leverage,
		borrowRateAnnual: borrowRate,
		liquidationLtv: 0.90
	})

	return NextResponse.json(result)
}
