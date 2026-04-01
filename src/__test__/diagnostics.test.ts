import { describe, expect, it } from 'vitest'
import { computeDiagnostics } from '../src/diagnostics.js'
import { AlignedRow, TradeRecord } from '../src/types.js'

function makeAligned(iso: string, price: number): AlignedRow {
	return {
		timestampUtc: new Date(iso),
		price,
		supportLine: price - 1,
		ottValue: price - 2,
		trend: 'bullish',
		signalType: '',
		trend4h: 'bullish',
		trend1d: 'bullish',
		price1d: price,
		has1dData: true
	}
}

describe('MFE/MAE Correctness', () => {
	it('computes MFE and MAE for a long trade', () => {
		const rows: AlignedRow[] = [
			makeAligned('2025-12-20T12:00:00.000Z', 100),
			makeAligned('2025-12-20T16:00:00.000Z', 105),
			makeAligned('2025-12-20T20:00:00.000Z', 98),
			makeAligned('2025-12-21T00:00:00.000Z', 102)
		]

		const trade: TradeRecord = {
			trade_id: 1,
			entry_timestamp: '2025-12-20T12:00:00.000Z',
			exit_timestamp: '2025-12-21T00:00:00.000Z',
			direction: 'long',
			entry_price: 100,
			exit_price: 102,
			return_pct: 2,
			mfe_pct: 5,
			mae_pct: -2,
			peak_unrealized_pct: 5,
			profit_given_back: 3,
			hours_in_trade: 12,
			exit_reason: 'opposite_signal'
		}

		const diagnostics = computeDiagnostics([trade], rows)
		expect(diagnostics).toHaveLength(1)
		expect(diagnostics[0].mfe_pct).toBe(5)
		expect(diagnostics[0].mae_pct).toBe(-2)
		expect(diagnostics[0].profit_given_back).toBe(3)
	})

	it('computes candles to 1% move', () => {
		const rows: AlignedRow[] = [
			makeAligned('2025-12-20T12:00:00.000Z', 100),
			makeAligned('2025-12-20T16:00:00.000Z', 100.5),
			makeAligned('2025-12-20T20:00:00.000Z', 101.1)
		]

		const trade: TradeRecord = {
			trade_id: 1,
			entry_timestamp: '2025-12-20T12:00:00.000Z',
			exit_timestamp: '2025-12-20T20:00:00.000Z',
			direction: 'long',
			entry_price: 100,
			exit_price: 101.1,
			return_pct: 1.1,
			mfe_pct: 1.1,
			mae_pct: 0,
			peak_unrealized_pct: 1.1,
			profit_given_back: 0,
			hours_in_trade: 8,
			exit_reason: 'opposite_signal'
		}

		const diagnostics = computeDiagnostics([trade], rows)
		expect(diagnostics[0].candles_to_1pct_move).toBe(2)
	})
})
