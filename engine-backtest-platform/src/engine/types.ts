export interface OhlcvCandle {
	timestamp: Date
	open: number
	high: number
	low: number
	close: number
	volume: number
}

export interface OttCandle extends OhlcvCandle {
	ema: number
	ott: number
	trend: 'bullish' | 'bearish'
	signal: 'buy' | 'sell' | null
}

export interface BacktestResult {
	emaLength: number
	percent: number
	trades: number
	returnPct: number
	maxDrawdownPct: number
	finalEquity: number
	bullishDays: number
	bearishDays: number
	tradeLog: TradeEntry[]
	ottCandles: OttCandle[]
}

export interface TradeEntry {
	date: string
	action: 'LONG' | 'FLAT'
	price: number
	equity: number
}

export interface BuyAndHoldResult {
	returnPct: number
	maxDrawdownPct: number
	finalEquity: number
}
