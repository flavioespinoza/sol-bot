import { describe, expect, it } from 'vitest'
import { processRows, SCENARIOS } from '../src/strategy-logic-engine.js'
import { AlignedRow, ScenarioConfig } from '../src/types.js'

const baseline: ScenarioConfig = SCENARIOS[0]

function makeAligned(overrides: Partial<AlignedRow> = {}): AlignedRow {
	return {
		timestampUtc: new Date('2025-12-20T12:00:00.000Z'),
		price: 100,
		supportLine: 99,
		ottValue: 98,
		trend: 'bullish',
		signalType: '',
		trend4h: 'bullish',
		trend1d: 'bullish',
		price1d: 100,
		has1dData: true,
		...overrides
	}
}

describe('Entry Logic', () => {
	it('enters long on price_support_cross + bullish 4H + bullish 1D', () => {
		const rows = [
			makeAligned({
				signalType: 'price_support_cross',
				trend4h: 'bullish',
				trend1d: 'bullish'
			})
		]
		const state = processRows(rows, baseline)
		const entries = state.events.filter((e) => e.event_type === 'entry')
		expect(entries).toHaveLength(1)
		expect(entries[0].direction).toBe('long')
	})

	it('enters short on price_support_cross + bearish 4H + bearish 1D', () => {
		const rows = [
			makeAligned({
				signalType: 'price_support_cross',
				trend4h: 'bearish',
				trend1d: 'bearish',
				trend: 'bearish'
			})
		]
		const state = processRows(rows, baseline)
		const entries = state.events.filter((e) => e.event_type === 'entry')
		expect(entries).toHaveLength(1)
		expect(entries[0].direction).toBe('short')
	})

	it('does NOT enter when 4H and 1D trends disagree', () => {
		const rows = [
			makeAligned({
				signalType: 'price_support_cross',
				trend4h: 'bullish',
				trend1d: 'bearish'
			})
		]
		const state = processRows(rows, baseline)
		const entries = state.events.filter((e) => e.event_type === 'entry')
		expect(entries).toHaveLength(0)
	})

	it('does NOT enter without price_support_cross signal', () => {
		const rows = [
			makeAligned({
				signalType: '',
				trend4h: 'bullish',
				trend1d: 'bullish'
			})
		]
		const state = processRows(rows, baseline)
		expect(state.events).toHaveLength(0)
	})
})

describe('Exit Logic', () => {
	it('exits on opposite signal', () => {
		const rows = [
			makeAligned({
				timestampUtc: new Date('2025-12-20T12:00:00.000Z'),
				signalType: 'price_support_cross',
				trend4h: 'bullish',
				trend1d: 'bullish',
				price: 100
			}),
			makeAligned({
				timestampUtc: new Date('2025-12-20T16:00:00.000Z'),
				signalType: 'price_support_cross',
				trend4h: 'bearish',
				trend1d: 'bearish',
				trend: 'bearish',
				price: 95
			})
		]
		const state = processRows(rows, baseline)
		const exits = state.events.filter((e) => e.event_type === 'exit')
		expect(exits).toHaveLength(1)
		expect(exits[0].reason).toBe('opposite_signal')
	})

	it('exits on 1D trend mismatch', () => {
		const rows = [
			makeAligned({
				timestampUtc: new Date('2025-12-20T12:00:00.000Z'),
				signalType: 'price_support_cross',
				trend4h: 'bullish',
				trend1d: 'bullish',
				price: 100
			}),
			makeAligned({
				timestampUtc: new Date('2025-12-20T16:00:00.000Z'),
				signalType: '',
				trend4h: 'bullish',
				trend1d: 'bearish',
				price: 98
			})
		]
		const state = processRows(rows, baseline)
		const exits = state.events.filter((e) => e.event_type === 'exit')
		expect(exits).toHaveLength(1)
		expect(exits[0].reason).toBe('1d_trend_mismatch')
	})
})

describe('Cutoff Logic', () => {
	it('closes position when 1D data ends', () => {
		const rows = [
			makeAligned({
				timestampUtc: new Date('2025-12-20T12:00:00.000Z'),
				signalType: 'price_support_cross',
				trend4h: 'bullish',
				trend1d: 'bullish',
				price: 100,
				has1dData: true
			}),
			makeAligned({
				timestampUtc: new Date('2025-12-21T12:00:00.000Z'),
				price: 105,
				has1dData: false,
				trend1d: null
			})
		]
		const state = processRows(rows, baseline)
		const exits = state.events.filter((e) => e.event_type === 'exit')
		expect(exits).toHaveLength(1)
		expect(exits[0].reason).toBe('1d_cutoff')
	})

	it('does NOT enter new positions after 1D cutoff', () => {
		const rows = [
			makeAligned({
				timestampUtc: new Date('2025-12-21T12:00:00.000Z'),
				signalType: 'price_support_cross',
				trend4h: 'bullish',
				trend1d: null,
				has1dData: false,
				price: 105
			})
		]
		const state = processRows(rows, baseline)
		expect(state.events).toHaveLength(0)
	})
})

describe('No Overlap', () => {
	it('ignores same-direction signals while in position', () => {
		const rows = [
			makeAligned({
				timestampUtc: new Date('2025-12-20T12:00:00.000Z'),
				signalType: 'price_support_cross',
				trend4h: 'bullish',
				trend1d: 'bullish',
				price: 100
			}),
			makeAligned({
				timestampUtc: new Date('2025-12-20T16:00:00.000Z'),
				signalType: 'price_support_cross',
				trend4h: 'bullish',
				trend1d: 'bullish',
				price: 102
			})
		]
		const state = processRows(rows, baseline)
		const entries = state.events.filter((e) => e.event_type === 'entry')
		expect(entries).toHaveLength(1)
	})
})

describe('Reproducibility', () => {
	it('produces identical results on two runs', () => {
		const rows = [
			makeAligned({
				timestampUtc: new Date('2025-12-20T12:00:00.000Z'),
				signalType: 'price_support_cross',
				trend4h: 'bullish',
				trend1d: 'bullish',
				price: 100
			}),
			makeAligned({
				timestampUtc: new Date('2025-12-20T16:00:00.000Z'),
				signalType: '',
				trend4h: 'bullish',
				trend1d: 'bearish',
				price: 98
			})
		]

		const state1 = processRows(rows, baseline)
		const state2 = processRows(rows, baseline)

		expect(state1.equity).toBe(state2.equity)
		expect(state1.events.length).toBe(state2.events.length)
		expect(JSON.stringify(state1.events)).toBe(JSON.stringify(state2.events))
	})
})
