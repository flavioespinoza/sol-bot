import { AlignedRow, CleanRow } from './types.js'

export function alignTimeseries(rows4h: CleanRow[], rows1d: CleanRow[]): AlignedRow[] {
	const sorted1d = [...rows1d].sort((a, b) => a.timestampUtc.getTime() - b.timestampUtc.getTime())

	const aligned: AlignedRow[] = []

	for (const row of rows4h) {
		const match = findMostRecentPast1d(row.timestampUtc, sorted1d)

		aligned.push({
			...row,
			trend4h: row.trend,
			trend1d: match ? match.trend : null,
			price1d: match ? match.price : null,
			has1dData: match !== null
		})
	}

	return aligned
}

function findMostRecentPast1d(timestamp4h: Date, sorted1d: CleanRow[]): CleanRow | null {
	let best: CleanRow | null = null

	for (const row1d of sorted1d) {
		if (row1d.timestampUtc.getTime() <= timestamp4h.getTime()) {
			best = row1d
		} else {
			break
		}
	}

	return best
}

export function find1dCutoffTimestamp(rows1d: CleanRow[]): Date | null {
	if (rows1d.length === 0) return null
	const sorted = [...rows1d].sort((a, b) => a.timestampUtc.getTime() - b.timestampUtc.getTime())
	return sorted[sorted.length - 1].timestampUtc
}

export function is4hAfter1dEnd(timestamp4h: Date, cutoff: Date | null): boolean {
	if (cutoff === null) return true
	return timestamp4h.getTime() > cutoff.getTime()
}
