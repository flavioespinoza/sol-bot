import { describe, expect, it } from 'vitest'
import { deduplicateRows, parseTimestamp1d, parseTimestamp4h } from '../src/data-loader.js'
import { RawRow } from '../src/types.js'

describe('CSV Parsing - parseTimestamp4h', () => {
	it('converts UTC-7 timestamp to UTC', () => {
		const result = parseTimestamp4h('2025-12-16 14:00:00 UTC-7')
		expect(result.toISOString()).toBe('2025-12-16T21:00:00.000Z')
	})

	it('handles midnight crossing', () => {
		const result = parseTimestamp4h('2025-12-16 22:00:00 UTC-7')
		expect(result.toISOString()).toBe('2025-12-17T05:00:00.000Z')
	})

	it('throws on invalid format', () => {
		expect(() => parseTimestamp4h('2025-12-16 14:00:00')).toThrow()
	})
})

describe('CSV Parsing - parseTimestamp1d', () => {
	it('parses UTC timestamp', () => {
		const result = parseTimestamp1d('2025-12-18 00:00:00.000 UTC')
		expect(result.toISOString()).toBe('2025-12-18T00:00:00.000Z')
	})

	it('throws on invalid format', () => {
		expect(() => parseTimestamp1d('2025-12-18 00:00:00 UTC-7')).toThrow()
	})
})

describe('Duplicate Handling', () => {
	const baseRow: RawRow = {
		timestamp: '2025-12-16 14:00:00 UTC-7',
		price: 128.24,
		supportLine: 127.72,
		ottValue: 128.04,
		trend: 'bearish',
		signalType: ''
	}

	it('removes exact duplicates', () => {
		const rows = [baseRow, { ...baseRow }]
		const { cleaned, duplicates } = deduplicateRows(rows)
		expect(cleaned).toHaveLength(1)
		expect(duplicates).toHaveLength(1)
		expect(duplicates[0].type).toBe('exact')
	})

	it('keeps last on conflicting duplicates', () => {
		const conflicting = { ...baseRow, supportLine: 999.99 }
		const rows = [baseRow, conflicting]
		const { cleaned, duplicates } = deduplicateRows(rows)
		expect(cleaned).toHaveLength(1)
		expect(cleaned[0].supportLine).toBe(999.99)
		expect(duplicates).toHaveLength(1)
		expect(duplicates[0].type).toBe('conflicting')
	})

	it('passes through unique rows unchanged', () => {
		const row2: RawRow = { ...baseRow, timestamp: '2025-12-16 18:00:00 UTC-7' }
		const { cleaned, duplicates } = deduplicateRows([baseRow, row2])
		expect(cleaned).toHaveLength(2)
		expect(duplicates).toHaveLength(0)
	})
})
