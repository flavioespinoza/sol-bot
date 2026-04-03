import { resolve } from 'path'
import { NextResponse } from 'next/server'
import { loadBinanceCsv } from '@/engine/csv-loader'

export async function GET() {
	const dataFile = resolve(process.cwd(), 'data/sol/binance-sol-1d-2021-to-2026-feb.csv')
	const candles = loadBinanceCsv(dataFile)

	return NextResponse.json({
		asset: 'SOL/USDT',
		timeframe: '1D',
		count: candles.length,
		candles: candles.map((c) => ({
			timestamp: c.timestamp.toISOString(),
			open: c.open,
			high: c.high,
			low: c.low,
			close: c.close,
			volume: c.volume
		}))
	})
}
