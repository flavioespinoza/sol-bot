import { readFileSync } from 'fs'
import type { OhlcvCandle } from './ott-indicator__A.js'

/**
 * Load Binance kline CSV (no headers).
 * Format: open_time, open, high, low, close, volume, close_time, ...
 * Timestamps may be microseconds (16 digits) — normalize to ms.
 */
export function loadBinanceCsv(filePath: string): OhlcvCandle[] {
	const raw = readFileSync(filePath, 'utf-8')
	const candles: OhlcvCandle[] = []

	for (const line of raw.split('\n')) {
		if (!line.trim()) continue
		const cols = line.split(',')

		let openTimeMs = parseInt(cols[0])
		// Binance uses microseconds if > 13 digits
		if (openTimeMs > 9999999999999) {
			openTimeMs = Math.floor(openTimeMs / 1000)
		}

		candles.push({
			timestamp: new Date(openTimeMs),
			open: parseFloat(cols[1]),
			high: parseFloat(cols[2]),
			low: parseFloat(cols[3]),
			close: parseFloat(cols[4]),
			volume: parseFloat(cols[5])
		})
	}

	// sort chronologically (should already be, but enforce)
	candles.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

	return candles
}
