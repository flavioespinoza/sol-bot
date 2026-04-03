import { AlignedRow, DiagnosticsResult, TradeRecord } from './types.js'

export function computeDiagnostics(
	trades: TradeRecord[],
	rows: AlignedRow[]
): DiagnosticsResult[] {
	return trades.map((trade) => {
		const entryTime = new Date(trade.entry_timestamp)
		const exitTime = new Date(trade.exit_timestamp)

		const rowsInTrade = rows.filter(
			(r) =>
				r.timestampUtc.getTime() >= entryTime.getTime() &&
				r.timestampUtc.getTime() <= exitTime.getTime()
		)

		const entryIdx = rows.findIndex(
			(r) => r.timestampUtc.getTime() === entryTime.getTime()
		)

		const distanceFromLocalExtreme = computeDistanceFromExtreme(
			rows,
			entryIdx,
			trade.direction
		)

		const candlesTo1Pct = computeCandlesTo1PctMove(
			rows,
			entryIdx,
			trade.direction,
			trade.entry_price
		)

		return {
			trade_id: trade.trade_id,
			mfe_pct: trade.mfe_pct,
			mae_pct: trade.mae_pct,
			peak_unrealized_pct: trade.peak_unrealized_pct,
			profit_given_back: trade.profit_given_back,
			hours_in_trade: trade.hours_in_trade,
			distance_from_local_extreme: distanceFromLocalExtreme,
			candles_to_1pct_move: candlesTo1Pct
		}
	})
}

function computeDistanceFromExtreme(
	rows: AlignedRow[],
	entryIdx: number,
	direction: string
): number | null {
	if (entryIdx < 0) return null

	const lookback = 6
	const start = Math.max(0, entryIdx - lookback)
	const window = rows.slice(start, entryIdx + 1)

	if (window.length === 0) return null

	const entryPrice = rows[entryIdx].price

	if (direction === 'long') {
		const localLow = Math.min(...window.map((r) => r.price))
		return parseFloat(((entryPrice - localLow) / localLow * 100).toFixed(4))
	} else {
		const localHigh = Math.max(...window.map((r) => r.price))
		return parseFloat(((localHigh - entryPrice) / localHigh * 100).toFixed(4))
	}
}

function computeCandlesTo1PctMove(
	rows: AlignedRow[],
	entryIdx: number,
	direction: string,
	entryPrice: number
): number | null {
	if (entryIdx < 0) return null

	for (let i = entryIdx + 1; i < rows.length; i++) {
		const movePct = direction === 'long'
			? ((rows[i].price - entryPrice) / entryPrice) * 100
			: ((entryPrice - rows[i].price) / entryPrice) * 100

		if (movePct >= 1) {
			return i - entryIdx
		}
	}

	return null
}
