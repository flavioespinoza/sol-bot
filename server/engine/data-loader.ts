import fs from 'fs'
import Papa from 'papaparse'
import { CleanRow, DuplicateLog, RawRow } from './types.js'

interface CsvRow {
	[key: string]: string
}

function normalizeHeaders(row: CsvRow): RawRow {
	const keys = Object.keys(row)
	const timestampKey = keys.find((k) => k.toLowerCase().includes('timestamp'))
	const priceKey = keys.find((k) => k.toLowerCase() === 'price')
	const supportKey = keys.find((k) => k.toLowerCase().includes('support'))
	const ottKey = keys.find((k) => k.toLowerCase().includes('ott'))
	const trendKey = keys.find((k) => k.toLowerCase() === 'trend')
	const signalKey = keys.find((k) => k.toLowerCase().includes('signal'))

	if (!timestampKey || !priceKey || !supportKey || !ottKey || !trendKey || !signalKey) {
		throw new Error(`Missing required columns. Found: ${keys.join(', ')}`)
	}

	const trend = row[trendKey].trim().toLowerCase()
	if (trend !== 'bullish' && trend !== 'bearish') {
		throw new Error(`Invalid trend value: ${trend}`)
	}

	return {
		timestamp: row[timestampKey].trim(),
		price: parseFloat(row[priceKey]),
		supportLine: parseFloat(row[supportKey]),
		ottValue: parseFloat(row[ottKey]),
		trend: trend as 'bullish' | 'bearish',
		signalType: row[signalKey].trim()
	}
}

function rowsEqual(a: RawRow, b: RawRow): boolean {
	return (
		a.price === b.price &&
		a.supportLine === b.supportLine &&
		a.ottValue === b.ottValue &&
		a.trend === b.trend &&
		a.signalType === b.signalType
	)
}

export function deduplicateRows(
	rows: RawRow[]
): { cleaned: RawRow[]; duplicates: DuplicateLog[] } {
	const duplicates: DuplicateLog[] = []
	const seen = new Map<string, RawRow>()
	const cleaned: RawRow[] = []

	for (const row of rows) {
		const existing = seen.get(row.timestamp)
		if (existing) {
			if (rowsEqual(existing, row)) {
				duplicates.push({
					timestamp: row.timestamp,
					type: 'exact',
					kept: existing,
					dropped: row
				})
			} else {
				duplicates.push({
					timestamp: row.timestamp,
					type: 'conflicting',
					kept: row,
					dropped: existing
				})
				const idx = cleaned.findIndex((r) => r.timestamp === row.timestamp)
				if (idx !== -1) {
					cleaned[idx] = row
				}
				seen.set(row.timestamp, row)
			}
		} else {
			seen.set(row.timestamp, row)
			cleaned.push(row)
		}
	}

	return { cleaned, duplicates }
}

export function parseCsv(filePath: string): RawRow[] {
	const content = fs.readFileSync(filePath, 'utf-8')
	const result = Papa.parse<CsvRow>(content, {
		header: true,
		skipEmptyLines: true
	})

	if (result.errors.length > 0) {
		const errorMessages = result.errors.map((e) => `Row ${e.row}: ${e.message}`).join('\n')
		throw new Error(`CSV parse errors:\n${errorMessages}`)
	}

	return result.data.map(normalizeHeaders)
}

export function parseTimestamp4h(ts: string): Date {
	const match = ts.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) UTC([+-]\d+)$/)
	if (!match) {
		throw new Error(`Invalid 4H timestamp format: ${ts}`)
	}
	const [, datePart, timePart, offsetStr] = match
	const offsetHours = parseInt(offsetStr, 10)
	const localDate = new Date(`${datePart}T${timePart}Z`)
	localDate.setUTCHours(localDate.getUTCHours() - offsetHours)
	return localDate
}

export function parseTimestamp1d(ts: string): Date {
	const match = ts.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}\.\d{3}) UTC$/)
	if (!match) {
		throw new Error(`Invalid 1D timestamp format: ${ts}`)
	}
	return new Date(`${match[1]}T${match[2]}Z`)
}

export function loadAndClean4h(filePath: string): {
	rows: CleanRow[]
	duplicates: DuplicateLog[]
} {
	const raw = parseCsv(filePath)
	const { cleaned, duplicates } = deduplicateRows(raw)

	const rows: CleanRow[] = cleaned.map((r) => ({
		timestampUtc: parseTimestamp4h(r.timestamp),
		price: r.price,
		supportLine: r.supportLine,
		ottValue: r.ottValue,
		trend: r.trend,
		signalType: r.signalType
	}))

	rows.sort((a, b) => a.timestampUtc.getTime() - b.timestampUtc.getTime())
	return { rows, duplicates }
}

export function loadAndClean1d(filePath: string): {
	rows: CleanRow[]
	duplicates: DuplicateLog[]
} {
	const raw = parseCsv(filePath)
	const { cleaned, duplicates } = deduplicateRows(raw)

	const rows: CleanRow[] = cleaned.map((r) => ({
		timestampUtc: parseTimestamp1d(r.timestamp),
		price: r.price,
		supportLine: r.supportLine,
		ottValue: r.ottValue,
		trend: r.trend,
		signalType: r.signalType
	}))

	rows.sort((a, b) => a.timestampUtc.getTime() - b.timestampUtc.getTime())
	return { rows, duplicates }
}
