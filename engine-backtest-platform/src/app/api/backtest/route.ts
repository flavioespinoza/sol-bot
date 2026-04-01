import { resolve } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { loadBinanceCsv } from '@/engine/csv-loader'
import { runBacktest, buyAndHold } from '@/engine/backtest'

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const emaLength = parseInt(searchParams.get('ema') || '40')
	const percent = parseFloat(searchParams.get('percent') || '0.04')

	const dataFile = resolve(process.cwd(), 'data/sol/binance-sol-1d-2021-to-2026-feb.csv')
	const candles = loadBinanceCsv(dataFile)

	const result = runBacktest(candles, emaLength, percent)
	const bnh = buyAndHold(candles)

	return NextResponse.json({
		params: { emaLength, percent },
		trades: result.trades,
		returnPct: result.returnPct,
		maxDrawdownPct: result.maxDrawdownPct,
		finalEquity: result.finalEquity,
		bullishDays: result.bullishDays,
		bearishDays: result.bearishDays,
		totalDays: candles.length,
		tradeLog: result.tradeLog,
		buyAndHold: {
			returnPct: bnh.returnPct,
			maxDrawdownPct: bnh.maxDrawdownPct,
			finalEquity: bnh.finalEquity
		},
		ottCandles: result.ottCandles.map((c) => ({
			timestamp: c.timestamp.toISOString(),
			open: c.open,
			high: c.high,
			low: c.low,
			close: c.close,
			volume: c.volume,
			ema: c.ema,
			ott: c.ott,
			trend: c.trend,
			signal: c.signal
		}))
	})
}
