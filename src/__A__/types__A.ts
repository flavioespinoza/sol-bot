// ── Raw CSV row (before parsing) ──────────────────────────────
export interface RawRow {
	timestamp: string
	price: string
	supportLine: string
	ottValue: string
	trend: string
	signalType: string
}

// ── Parsed candle ─────────────────────────────────────────────
export interface Candle {
	timestamp: Date // always UTC
	price: number
	supportLine: number
	ottValue: number
	trend: 'bullish' | 'bearish'
	signalType: 'price_support_cross' | ''
}

// ── Aligned 4H candle with 1D context ─────────────────────────
export interface AlignedCandle extends Candle {
	dailyTrend: 'bullish' | 'bearish' | null // null = no 1D data available
	dailyTimestamp: Date | null
}

// ── Position ──────────────────────────────────────────────────
export type Direction = 'long' | 'short'

export interface Position {
	tradeId: number
	direction: Direction
	entryTimestamp: Date
	entryPrice: number
	trend4h: 'bullish' | 'bearish'
	trend1d: 'bullish' | 'bearish'
}

// ── Trade (completed) ─────────────────────────────────────────
export interface Trade {
	tradeId: number
	entryTimestamp: Date
	exitTimestamp: Date
	direction: Direction
	entryPrice: number
	exitPrice: number
	returnPct: number
	mfePct: number
	maePct: number
	peakUnrealizedPct: number
	profitGivenBack: number
	hoursInTrade: number
	exitReason: string
	leverage: number
	equityBefore: number
	equityAfter: number
}

// ── Event ─────────────────────────────────────────────────────
export interface Event {
	eventId: number
	timestampUtc: Date
	eventType: 'entry' | 'exit' | 'skip' | 'cutoff'
	price: number
	direction: Direction | null
	trend4h: 'bullish' | 'bearish'
	trend1d: 'bullish' | 'bearish' | null
	positionBefore: Direction | null
	positionAfter: Direction | null
	equityBefore: number
	equityAfter: number
	reason: string
}

// ── Scenario config ───────────────────────────────────────────
export interface Scenario {
	name: string
	leverage: number
	takeProfitPct: number | null
	stopLossPct: number | null
	trailingStopPct: number | null
	partialTpPct: number | null // partial TP trigger %
	partialTpSize: number | null // fraction to close (e.g. 0.5)
}

// ── Summary metrics ───────────────────────────────────────────
export interface SummaryMetrics {
	scenario: string
	totalTrades: number
	winningTrades: number
	losingTrades: number
	winRate: number
	totalReturnPct: number
	finalEquity: number
	maxDrawdownPct: number
	avgMfePct: number
	avgMaePct: number
	avgProfitGivenBack: number
	avgHoursInTrade: number
	sharpeEstimate: number | null
}

// ── Validation result ─────────────────────────────────────────
export interface ValidationResult {
	check: string
	passed: boolean
	detail: string
}

// ── Duplicate log entry ───────────────────────────────────────
export interface DuplicateEntry {
	timestamp: string
	type: 'exact' | 'conflicting'
	kept: 'first' | 'last'
	rowA: string
	rowB: string
}
