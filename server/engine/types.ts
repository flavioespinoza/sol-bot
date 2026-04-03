export interface RawRow {
	timestamp: string
	price: number
	supportLine: number
	ottValue: number
	trend: 'bullish' | 'bearish'
	signalType: string
}

export interface CleanRow {
	timestampUtc: Date
	price: number
	supportLine: number
	ottValue: number
	trend: 'bullish' | 'bearish'
	signalType: string
}

export interface AlignedRow extends CleanRow {
	trend4h: 'bullish' | 'bearish'
	trend1d: 'bullish' | 'bearish' | null
	price1d: number | null
	has1dData: boolean
}

export interface DuplicateLog {
	timestamp: string
	type: 'exact' | 'conflicting'
	kept: RawRow
	dropped: RawRow
}

export type Direction = 'long' | 'short'

export interface Position {
	tradeId: number
	entryTimestamp: Date
	entryPrice: number
	direction: Direction
	leverage: number
	peakPrice: number
	troughPrice: number
	partialExitDone: boolean
	sizeRemaining: number
}

export interface TradeRecord {
	trade_id: number
	entry_timestamp: string
	exit_timestamp: string
	direction: Direction
	entry_price: number
	exit_price: number
	return_pct: number
	mfe_pct: number
	mae_pct: number
	peak_unrealized_pct: number
	profit_given_back: number
	hours_in_trade: number
	exit_reason: string
}

export interface EventRecord {
	event_id: number
	timestamp_utc: string
	event_type: string
	price: number
	direction: Direction | null
	trend_4h: 'bullish' | 'bearish'
	trend_1d: 'bullish' | 'bearish' | null
	position_before: string | null
	position_after: string | null
	equity_before: number
	equity_after: number
	reason: string
}

export interface ScenarioConfig {
	name: string
	leverage: number
	takeProfitPct: number | null
	stopLossPct: number | null
	trailingStopPct: number | null
	partialTp: { pct: number; fraction: number } | null
}

export interface SummaryMetrics {
	scenario: string
	total_trades: number
	winning_trades: number
	losing_trades: number
	win_rate: number
	total_return_pct: number
	max_drawdown_pct: number
	avg_return_pct: number
	avg_hours_in_trade: number
	avg_mfe_pct: number
	avg_mae_pct: number
	final_equity: number
}

export interface ValidationResult {
	check: string
	passed: boolean
	details: string
}

export interface DiagnosticsResult {
	trade_id: number
	mfe_pct: number
	mae_pct: number
	peak_unrealized_pct: number
	profit_given_back: number
	hours_in_trade: number
	distance_from_local_extreme: number | null
	candles_to_1pct_move: number | null
}
