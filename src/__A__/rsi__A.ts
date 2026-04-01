/**
 * RSI-14 computation. Deterministic, no external dependencies.
 * Uses standard Wilder's smoothing method.
 */

export function computeRsi(closes: number[], period: number = 14): number[] {
	const rsi: number[] = new Array(closes.length).fill(0)

	if (closes.length < period + 1) return rsi

	// initial average gain/loss over first `period` bars
	let avgGain = 0
	let avgLoss = 0

	for (let i = 1; i <= period; i++) {
		const change = closes[i] - closes[i - 1]
		if (change > 0) avgGain += change
		else avgLoss += Math.abs(change)
	}

	avgGain /= period
	avgLoss /= period

	// RSI for bar at index `period`
	if (avgLoss === 0) {
		rsi[period] = 100
	} else {
		const rs = avgGain / avgLoss
		rsi[period] = 100 - 100 / (1 + rs)
	}

	// Wilder's smoothing for remaining bars
	for (let i = period + 1; i < closes.length; i++) {
		const change = closes[i] - closes[i - 1]
		const gain = change > 0 ? change : 0
		const loss = change < 0 ? Math.abs(change) : 0

		avgGain = (avgGain * (period - 1) + gain) / period
		avgLoss = (avgLoss * (period - 1) + loss) / period

		if (avgLoss === 0) {
			rsi[i] = 100
		} else {
			const rs = avgGain / avgLoss
			rsi[i] = 100 - 100 / (1 + rs)
		}
	}

	return rsi
}
