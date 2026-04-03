/**
 * OTT (Optimized Trend Tracker) Indicator
 *
 * Implements the ratcheting OTT algorithm (Anil Ozeksi method):
 *   - Computes EMA of close prices
 *   - Builds ratcheting support/resistance bands
 *   - Determines trend (bullish/bearish) from price vs OTT
 *   - Generates buy/sell signals on trend flips
 *
 * Parameters:
 *   - emaLength: EMA period (e.g. 25, 30, 40)
 *   - percent: band width as decimal (e.g. 0.04 = 4%)
 */

import type { OhlcvCandle, OttCandle } from './types'

function emaMult(length: number): number {
	return 2 / (length + 1)
}

export function computeOtt(
	candles: OhlcvCandle[],
	emaLength: number,
	percent: number
): OttCandle[] {
	if (candles.length === 0) return []

	const k = emaMult(emaLength)
	const result: OttCandle[] = []

	let prevEma = candles[0].close
	let prevOtt = candles[0].close
	let prevClose = candles[0].close

	for (let i = 0; i < candles.length; i++) {
		const c = candles[i]

		// EMA
		const ema = i === 0 ? c.close : c.close * k + prevEma * (1 - k)

		// OTT bands
		const longStop = ema * (1 - percent)
		const shortStop = ema * (1 + percent)

		let ott: number

		if (i === 0) {
			ott = c.close
		} else {
			// Ratcheting: uptrend OTT only moves up, downtrend only moves down
			const wasUptrend = prevEma > prevOtt

			if (wasUptrend) {
				ott = Math.max(longStop, prevOtt)
			} else {
				ott = Math.min(shortStop, prevOtt)
			}

			// Trend flip resets ratchet
			if (ema > ott && !wasUptrend) {
				ott = longStop
			} else if (ema < ott && wasUptrend) {
				ott = shortStop
			}
		}

		// Trend
		const trend: 'bullish' | 'bearish' = c.close > ott ? 'bullish' : 'bearish'

		// Signal on trend flip
		let signal: 'buy' | 'sell' | null = null
		if (i > 0) {
			const prevAbove = prevClose > prevOtt
			const currAbove = c.close > ott
			if (!prevAbove && currAbove) signal = 'buy'
			if (prevAbove && !currAbove) signal = 'sell'
		}

		result.push({
			timestamp: c.timestamp,
			open: c.open,
			high: c.high,
			low: c.low,
			close: c.close,
			volume: c.volume,
			ema,
			ott,
			trend,
			signal
		})

		prevEma = ema
		prevOtt = ott
		prevClose = c.close
	}

	return result
}
