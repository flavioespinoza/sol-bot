import type { OTTCandel } from './ott-indicator__A.js'
import type { Candle } from './types__A.js'

/**
 * Convert OTT indicator output to the engine's Candle format.
 * Maps: close→price, ema→supportLine, ott→ottValue
 */
export function ottToCandles(ottCandles: OTTCandel[]): Candle[] {
	return ottCandles.map((c) => ({
		timestamp: c.timestamp,
		price: c.close,
		supportLine: c.ema,
		ottValue: c.ott,
		trend: c.trend,
		signalType: c.signalType
	}))
}
