/**
 * OTT (Optimized Trend Tracker) — two modes, both deterministic.
 *
 * MODE A: "ratcheting" (Anıl Özekşi / TradingView parity)
 *   - uptrend: OTT = max(longStop, prevOtt) — only moves up
 *   - downtrend: OTT = min(shortStop, prevOtt) — only moves down
 *
 * MODE B: "simple_band" (control experiment)
 *   - bullish: OTT = EMA * (1 - percent)
 *   - bearish: OTT = EMA * (1 + percent)
 *   - no ratcheting, OTT moves freely with EMA
 */

export type OttMode = 'ratcheting' | 'simple_band'

export interface OTTCandel {
	timestamp: Date
	open: number
	high: number
	low: number
	close: number
	volume: number
	ema: number
	ott: number
	trend: 'bullish' | 'bearish'
	signalType: 'price_support_cross' | ''
}

export interface OttParams {
	emaLength: number
	percent: number
	mode: OttMode
}

export interface OhlcvCandle {
	timestamp: Date
	open: number
	high: number
	low: number
	close: number
	volume: number
}

function emaMult(length: number): number {
	return 2 / (length + 1)
}

/**
 * Compute OTT on sorted OHLCV candles.
 */
export function computeOtt(candles: OhlcvCandle[], params: OttParams): OTTCandel[] {
	if (candles.length === 0) return []

	const k = emaMult(params.emaLength)
	const result: OTTCandel[] = []

	let prevEma = candles[0].close
	let prevOtt = candles[0].close
	let prevClose = candles[0].close

	for (let i = 0; i < candles.length; i++) {
		const c = candles[i]

		// ── EMA ──────────────────────────────────────────
		const ema = i === 0 ? c.close : c.close * k + prevEma * (1 - k)

		// ── OTT ──────────────────────────────────────────
		const longStop = ema * (1 - params.percent)
		const shortStop = ema * (1 + params.percent)

		let ott: number

		if (i === 0) {
			ott = c.close
		} else if (params.mode === 'ratcheting') {
			ott = computeRatcheting(ema, prevEma, prevOtt, longStop, shortStop)
		} else {
			ott = computeSimpleBand(ema, prevEma, prevOtt, longStop, shortStop)
		}

		// ── Trend ────────────────────────────────────────
		const trend: 'bullish' | 'bearish' = c.close > ott ? 'bullish' : 'bearish'

		// ── Signal ───────────────────────────────────────
		let signalType: 'price_support_cross' | '' = ''
		if (i > 0) {
			const prevAbove = prevClose > prevOtt
			const currAbove = c.close > ott
			if (prevAbove !== currAbove) {
				signalType = 'price_support_cross'
			}
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
			signalType
		})

		prevEma = ema
		prevOtt = ott
		prevClose = c.close
	}

	return result
}

/**
 * MODE A: Ratcheting (Anıl Özekşi)
 * - Uptrend: OTT only moves up (max of current longStop vs prev OTT)
 * - Downtrend: OTT only moves down (min of current shortStop vs prev OTT)
 * - Trend flip resets the ratchet
 */
function computeRatcheting(
	ema: number,
	prevEma: number,
	prevOtt: number,
	longStop: number,
	shortStop: number
): number {
	// determine prior trend state from EMA vs OTT relationship
	const wasUptrend = prevEma > prevOtt

	let ott: number
	if (wasUptrend) {
		// in uptrend: OTT ratchets UP only
		ott = Math.max(longStop, prevOtt)
	} else {
		// in downtrend: OTT ratchets DOWN only
		ott = Math.min(shortStop, prevOtt)
	}

	// detect trend flip: EMA crosses OTT → reset ratchet
	if (ema > ott && !wasUptrend) {
		// flipping to uptrend
		ott = longStop
	} else if (ema < ott && wasUptrend) {
		// flipping to downtrend
		ott = shortStop
	}

	return ott
}

/**
 * MODE B: Simple Band (control)
 * - No ratcheting. OTT = EMA ± percent based on current trend.
 * - OTT moves freely with EMA every bar.
 */
function computeSimpleBand(
	ema: number,
	prevEma: number,
	prevOtt: number,
	longStop: number,
	shortStop: number
): number {
	// determine trend from previous bar
	const wasUptrend = prevEma > prevOtt

	if (wasUptrend) {
		// bullish → support below
		return longStop
	} else {
		// bearish → resistance above
		return shortStop
	}
}
