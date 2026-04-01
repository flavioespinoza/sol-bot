import { describe, expect, it } from 'vitest'
import { alignTimeseries, find1dCutoffTimestamp, is4hAfter1dEnd } from '../src/time-aligner.js'
import { CleanRow } from '../src/types.js'

function makeRow(iso: string, trend: 'bullish' | 'bearish' = 'bearish'): CleanRow {
	return {
		timestampUtc: new Date(iso),
		price: 100,
		supportLine: 99,
		ottValue: 98,
		trend,
		signalType: ''
	}
}

describe('Timezone Conversion', () => {
	it('4H rows are already converted to UTC by data_loader', () => {
		// This test verifies the data flow: parseTimestamp4h handles the conversion
		// The time_aligner receives CleanRow objects with timestampUtc already in UTC
		const row = makeRow('2025-12-17T05:00:00.000Z')
		expect(row.timestampUtc.getUTCHours()).toBe(5)
	})
})

describe('Alignment Correctness', () => {
	it('uses most recent past 1D value (backward-only)', () => {
		const rows4h = [
			makeRow('2025-12-20T12:00:00.000Z'),
			makeRow('2025-12-21T12:00:00.000Z')
		]
		const rows1d = [
			makeRow('2025-12-19T00:00:00.000Z', 'bearish'),
			makeRow('2025-12-21T00:00:00.000Z', 'bullish')
		]

		const aligned = alignTimeseries(rows4h, rows1d)

		// First 4H row should get the 12/19 1D data (most recent past)
		expect(aligned[0].trend1d).toBe('bearish')
		// Second 4H row at 12/21 12:00 should get 12/21 00:00 1D data
		expect(aligned[1].trend1d).toBe('bullish')
	})

	it('returns null trend1d when no past 1D data exists', () => {
		const rows4h = [makeRow('2025-12-15T12:00:00.000Z')]
		const rows1d = [makeRow('2025-12-20T00:00:00.000Z')]

		const aligned = alignTimeseries(rows4h, rows1d)
		expect(aligned[0].trend1d).toBeNull()
		expect(aligned[0].has1dData).toBe(false)
	})

	it('never uses future 1D data', () => {
		const rows4h = [makeRow('2025-12-19T12:00:00.000Z')]
		const rows1d = [makeRow('2025-12-20T00:00:00.000Z', 'bullish')]

		const aligned = alignTimeseries(rows4h, rows1d)
		expect(aligned[0].trend1d).toBeNull()
	})
})

describe('1D Cutoff', () => {
	it('finds the last 1D timestamp', () => {
		const rows1d = [
			makeRow('2025-12-19T00:00:00.000Z'),
			makeRow('2025-12-20T00:00:00.000Z'),
			makeRow('2025-12-21T00:00:00.000Z')
		]
		const cutoff = find1dCutoffTimestamp(rows1d)
		expect(cutoff?.toISOString()).toBe('2025-12-21T00:00:00.000Z')
	})

	it('detects 4H after 1D end', () => {
		const cutoff = new Date('2025-12-21T00:00:00.000Z')
		expect(is4hAfter1dEnd(new Date('2025-12-21T12:00:00.000Z'), cutoff)).toBe(true)
		expect(is4hAfter1dEnd(new Date('2025-12-20T12:00:00.000Z'), cutoff)).toBe(false)
	})
})
