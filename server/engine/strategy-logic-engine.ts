import { AlignedRow, Direction, EventRecord, Position, ScenarioConfig } from './types.js'

export interface StrategyState {
	position: Position | null
	events: EventRecord[]
	equity: number
	tradeIdCounter: number
	eventIdCounter: number
}

function positionLabel(pos: Position | null): string | null {
	if (!pos) return null
	return `${pos.direction} @ ${pos.entryPrice} (trade #${pos.tradeId})`
}

function createEvent(
	state: StrategyState,
	row: AlignedRow,
	eventType: string,
	direction: Direction | null,
	equityAfter: number,
	reason: string
): EventRecord {
	return {
		event_id: state.eventIdCounter++,
		timestamp_utc: row.timestampUtc.toISOString(),
		event_type: eventType,
		price: row.price,
		direction,
		trend_4h: row.trend4h,
		trend_1d: row.trend1d,
		position_before: positionLabel(state.position),
		position_after: null,
		equity_before: state.equity,
		equity_after: equityAfter,
		reason
	}
}

function shouldEnterLong(row: AlignedRow): boolean {
	return (
		row.signalType === 'price_support_cross' &&
		row.trend4h === 'bullish' &&
		row.trend1d === 'bullish'
	)
}

function shouldEnterShort(row: AlignedRow): boolean {
	return (
		row.signalType === 'price_support_cross' &&
		row.trend4h === 'bearish' &&
		row.trend1d === 'bearish'
	)
}

function calculateReturnPct(
	direction: Direction,
	entryPrice: number,
	exitPrice: number,
	leverage: number
): number {
	const raw = direction === 'long'
		? (exitPrice - entryPrice) / entryPrice
		: (entryPrice - exitPrice) / entryPrice
	return raw * leverage * 100
}

function checkScenarioExit(
	position: Position,
	row: AlignedRow,
	config: ScenarioConfig
): { shouldExit: boolean; reason: string; exitPrice: number; partialOnly: boolean } {
	const { direction, entryPrice } = position
	const price = row.price

	const unrealizedPct = calculateReturnPct(direction, entryPrice, price, 1)

	if (config.stopLossPct !== null && unrealizedPct <= -config.stopLossPct) {
		return { shouldExit: true, reason: `stop_loss_${config.stopLossPct}pct`, exitPrice: price, partialOnly: false }
	}

	if (config.takeProfitPct !== null && unrealizedPct >= config.takeProfitPct) {
		return { shouldExit: true, reason: `take_profit_${config.takeProfitPct}pct`, exitPrice: price, partialOnly: false }
	}

	if (config.trailingStopPct !== null) {
		const peakUnrealized = calculateReturnPct(direction, entryPrice, position.peakPrice, 1)
		const drawdownFromPeak = peakUnrealized - unrealizedPct
		if (drawdownFromPeak >= config.trailingStopPct && unrealizedPct > 0) {
			return { shouldExit: true, reason: `trailing_stop_${config.trailingStopPct}pct`, exitPrice: price, partialOnly: false }
		}
	}

	if (config.partialTp !== null && !position.partialExitDone && unrealizedPct >= config.partialTp.pct) {
		return { shouldExit: true, reason: `partial_tp_${config.partialTp.fraction * 100}pct_at_${config.partialTp.pct}pct`, exitPrice: price, partialOnly: true }
	}

	return { shouldExit: false, reason: '', exitPrice: price, partialOnly: false }
}

export function processRows(
	rows: AlignedRow[],
	config: ScenarioConfig
): StrategyState {
	const state: StrategyState = {
		position: null,
		events: [],
		equity: 10000,
		tradeIdCounter: 1,
		eventIdCounter: 1
	}

	for (const row of rows) {
		if (!row.has1dData) {
			if (state.position) {
				const returnPct = calculateReturnPct(
					state.position.direction,
					state.position.entryPrice,
					row.price,
					config.leverage
				)
				const pnl = (state.equity * Math.abs(returnPct)) / 100
				const equityAfter = returnPct >= 0 ? state.equity + pnl : state.equity - pnl

				const event = createEvent(state, row, 'exit', state.position.direction, equityAfter, '1d_cutoff')
				event.position_after = null
				state.events.push(event)
				state.equity = equityAfter
				state.position = null
			}
			continue
		}

		if (state.position) {
			const { direction, entryPrice } = state.position

			if (direction === 'long') {
				state.position.peakPrice = Math.max(state.position.peakPrice, row.price)
				state.position.troughPrice = Math.min(state.position.troughPrice, row.price)
			} else {
				state.position.peakPrice = Math.min(state.position.peakPrice, row.price)
				state.position.troughPrice = Math.max(state.position.troughPrice, row.price)
			}

			const scenarioCheck = checkScenarioExit(state.position, row, config)
			if (scenarioCheck.shouldExit) {
				if (scenarioCheck.partialOnly && config.partialTp) {
					const partialSize = state.position.sizeRemaining * config.partialTp.fraction
					const partialReturnPct = calculateReturnPct(direction, entryPrice, row.price, config.leverage)
					const partialPnl = (state.equity * partialSize * Math.abs(partialReturnPct)) / (100 * state.position.sizeRemaining)
					const equityAfter = partialReturnPct >= 0 ? state.equity + partialPnl : state.equity - partialPnl

					const event = createEvent(state, row, 'partial_exit', direction, equityAfter, scenarioCheck.reason)
					event.position_after = positionLabel(state.position)
					state.events.push(event)
					state.equity = equityAfter
					state.position.sizeRemaining -= partialSize
					state.position.partialExitDone = true
				} else {
					const returnPct = calculateReturnPct(direction, entryPrice, row.price, config.leverage)
					const sizeFactor = state.position.sizeRemaining
					const pnl = (state.equity * sizeFactor * Math.abs(returnPct)) / 100
					const equityAfter = returnPct >= 0 ? state.equity + pnl : state.equity - pnl

					const event = createEvent(state, row, 'exit', direction, equityAfter, scenarioCheck.reason)
					event.position_after = null
					state.events.push(event)
					state.equity = equityAfter
					state.position = null
				}
				continue
			}

			let shouldExitBaseline = false
			let exitReason = ''

			if (row.signalType === 'price_support_cross') {
				const signalDirection: Direction = row.trend4h === 'bullish' ? 'long' : 'short'
				if (signalDirection !== direction) {
					shouldExitBaseline = true
					exitReason = 'opposite_signal'
				}
			}

			if (!shouldExitBaseline && row.trend1d !== null) {
				const confirming = direction === 'long' ? 'bullish' : 'bearish'
				if (row.trend1d !== confirming) {
					shouldExitBaseline = true
					exitReason = '1d_trend_mismatch'
				}
			}

			if (shouldExitBaseline) {
				const returnPct = calculateReturnPct(direction, entryPrice, row.price, config.leverage)
				const sizeFactor = state.position.sizeRemaining
				const pnl = (state.equity * sizeFactor * Math.abs(returnPct)) / 100
				const equityAfter = returnPct >= 0 ? state.equity + pnl : state.equity - pnl

				const event = createEvent(state, row, 'exit', direction, equityAfter, exitReason)
				event.position_after = null
				state.events.push(event)
				state.equity = equityAfter
				state.position = null
			}
		}

		if (!state.position) {
			let direction: Direction | null = null
			if (shouldEnterLong(row)) direction = 'long'
			else if (shouldEnterShort(row)) direction = 'short'

			if (direction) {
				state.position = {
					tradeId: state.tradeIdCounter++,
					entryTimestamp: row.timestampUtc,
					entryPrice: row.price,
					direction,
					leverage: config.leverage,
					peakPrice: row.price,
					troughPrice: row.price,
					partialExitDone: false,
					sizeRemaining: 1
				}

				const event = createEvent(state, row, 'entry', direction, state.equity, 'signal_entry')
				event.position_after = positionLabel(state.position)
				state.events.push(event)
			}
		}
	}

	return state
}

export const SCENARIOS: ScenarioConfig[] = [
	{ name: 'baseline', leverage: 1, takeProfitPct: null, stopLossPct: null, trailingStopPct: null, partialTp: null },
	{ name: 'A_tp2', leverage: 1, takeProfitPct: 2, stopLossPct: null, trailingStopPct: null, partialTp: null },
	{ name: 'B_tp5', leverage: 1, takeProfitPct: 5, stopLossPct: null, trailingStopPct: null, partialTp: null },
	{ name: 'C_tp10', leverage: 1, takeProfitPct: 10, stopLossPct: null, trailingStopPct: null, partialTp: null },
	{ name: 'D_trail2', leverage: 1, takeProfitPct: null, stopLossPct: null, trailingStopPct: 2, partialTp: null },
	{ name: 'E_trail5', leverage: 1, takeProfitPct: null, stopLossPct: null, trailingStopPct: 5, partialTp: null },
	{ name: 'F_partial50at3', leverage: 1, takeProfitPct: null, stopLossPct: null, trailingStopPct: null, partialTp: { pct: 3, fraction: 0.5 } },
	{ name: 'G_2x', leverage: 2, takeProfitPct: null, stopLossPct: null, trailingStopPct: null, partialTp: null },
	{ name: 'H_3x', leverage: 3, takeProfitPct: null, stopLossPct: null, trailingStopPct: null, partialTp: null },
	{ name: 'I_sl5', leverage: 1, takeProfitPct: null, stopLossPct: 5, trailingStopPct: null, partialTp: null }
]
