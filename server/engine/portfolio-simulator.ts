import { StrategyState } from './strategy-logic-engine.js'
import { AlignedRow, Direction, TradeRecord } from './types.js'

export interface EquityPoint {
	timestamp: string
	equity: number
}

export function buildTradeRecords(
	rows: AlignedRow[],
	state: StrategyState
): TradeRecord[] {
	const trades: TradeRecord[] = []
	const entries = state.events.filter((e) => e.event_type === 'entry')
	const exits = state.events.filter((e) => e.event_type === 'exit' || e.event_type === 'partial_exit')

	for (const entry of entries) {
		const matchingExits = exits.filter(
			(e) =>
				e.timestamp_utc > entry.timestamp_utc &&
				e.direction === entry.direction
		)

		const fullExit = matchingExits.find((e) => e.event_type === 'exit')
		if (!fullExit) continue

		const entryTime = new Date(entry.timestamp_utc)
		const exitTime = new Date(fullExit.timestamp_utc)
		const hoursInTrade = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60)

		const direction = entry.direction as Direction
		const entryPrice = entry.price
		const exitPrice = fullExit.price

		const rawReturn = direction === 'long'
			? (exitPrice - entryPrice) / entryPrice
			: (entryPrice - exitPrice) / entryPrice

		const rowsInTrade = rows.filter(
			(r) =>
				r.timestampUtc.getTime() >= entryTime.getTime() &&
				r.timestampUtc.getTime() <= exitTime.getTime()
		)

		let mfePct = 0
		let maePct = 0
		let peakUnrealized = 0

		for (const r of rowsInTrade) {
			const unrealized = direction === 'long'
				? ((r.price - entryPrice) / entryPrice) * 100
				: ((entryPrice - r.price) / entryPrice) * 100

			if (unrealized > mfePct) mfePct = unrealized
			if (unrealized < maePct) maePct = unrealized
			if (unrealized > peakUnrealized) peakUnrealized = unrealized
		}

		const returnPct = rawReturn * 100
		const profitGivenBack = peakUnrealized > 0 ? peakUnrealized - returnPct : 0

		trades.push({
			trade_id: trades.length + 1,
			entry_timestamp: entry.timestamp_utc,
			exit_timestamp: fullExit.timestamp_utc,
			direction,
			entry_price: entryPrice,
			exit_price: exitPrice,
			return_pct: parseFloat(returnPct.toFixed(4)),
			mfe_pct: parseFloat(mfePct.toFixed(4)),
			mae_pct: parseFloat(maePct.toFixed(4)),
			peak_unrealized_pct: parseFloat(peakUnrealized.toFixed(4)),
			profit_given_back: parseFloat(profitGivenBack.toFixed(4)),
			hours_in_trade: parseFloat(hoursInTrade.toFixed(2)),
			exit_reason: fullExit.reason
		})
	}

	return trades
}

export function buildEquityCurve(state: StrategyState): EquityPoint[] {
	const curve: EquityPoint[] = [{ timestamp: 'start', equity: 10000 }]

	for (const event of state.events) {
		if (event.event_type === 'exit' || event.event_type === 'partial_exit') {
			curve.push({
				timestamp: event.timestamp_utc,
				equity: parseFloat(event.equity_after.toFixed(2))
			})
		}
	}

	return curve
}

export function computeMaxDrawdown(curve: EquityPoint[]): number {
	let peak = 0
	let maxDrawdown = 0

	for (const point of curve) {
		if (point.equity > peak) peak = point.equity
		const drawdown = ((peak - point.equity) / peak) * 100
		if (drawdown > maxDrawdown) maxDrawdown = drawdown
	}

	return parseFloat(maxDrawdown.toFixed(4))
}

export function computeSummary(
	scenarioName: string,
	trades: TradeRecord[],
	curve: EquityPoint[]
) {
	const winning = trades.filter((t) => t.return_pct > 0)
	const losing = trades.filter((t) => t.return_pct <= 0)
	const totalReturn = trades.reduce((sum, t) => sum + t.return_pct, 0)
	const avgReturn = trades.length > 0 ? totalReturn / trades.length : 0
	const avgHours = trades.length > 0
		? trades.reduce((sum, t) => sum + t.hours_in_trade, 0) / trades.length
		: 0
	const avgMfe = trades.length > 0
		? trades.reduce((sum, t) => sum + t.mfe_pct, 0) / trades.length
		: 0
	const avgMae = trades.length > 0
		? trades.reduce((sum, t) => sum + t.mae_pct, 0) / trades.length
		: 0

	return {
		scenario: scenarioName,
		total_trades: trades.length,
		winning_trades: winning.length,
		losing_trades: losing.length,
		win_rate: trades.length > 0 ? parseFloat((winning.length / trades.length * 100).toFixed(2)) : 0,
		total_return_pct: parseFloat(totalReturn.toFixed(4)),
		max_drawdown_pct: computeMaxDrawdown(curve),
		avg_return_pct: parseFloat(avgReturn.toFixed(4)),
		avg_hours_in_trade: parseFloat(avgHours.toFixed(2)),
		avg_mfe_pct: parseFloat(avgMfe.toFixed(4)),
		avg_mae_pct: parseFloat(avgMae.toFixed(4)),
		final_equity: curve.length > 0 ? curve[curve.length - 1].equity : 10000
	}
}
