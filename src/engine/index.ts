import path from 'path'
import { loadAndClean1d, loadAndClean4h } from './data-loader.js'
import { computeDiagnostics } from './diagnostics.js'
import { buildEquityCurve, buildTradeRecords, computeSummary } from './portfolio-simulator.js'
import {
	writeDuplicateLog,
	writeEventLog,
	writeMarkdownReport,
	writeSchemaReport,
	writeSummaryMetrics,
	writeTradeLog,
	writeValidationReport
} from './report-generator.js'
import { processRows, SCENARIOS } from './strategy-logic-engine.js'
import { alignTimeseries } from './time-aligner.js'
import { SummaryMetrics } from './types.js'
import { runValidation } from './validation.js'

const DATA_DIR = path.resolve(import.meta.dirname, '..', 'data')

function main(): void {
	console.log('=== OTT Deterministic Logic Engine ===')
	console.log('')

	// Phase 1: Load and clean data
	console.log('[1/6] Loading and cleaning data...')
	const data4h = loadAndClean4h(path.join(DATA_DIR, 'ott-data-4h.csv'))
	const data1d = loadAndClean1d(path.join(DATA_DIR, 'ott-data-1d.csv'))

	console.log(`  4H: ${data4h.rows.length} rows (${data4h.duplicates.length} duplicates removed)`)
	console.log(`  1D: ${data1d.rows.length} rows (${data1d.duplicates.length} duplicates removed)`)

	const allDuplicates = [...data4h.duplicates, ...data1d.duplicates]
	writeDuplicateLog(allDuplicates)
	writeSchemaReport(
		data4h.rows.length,
		data1d.rows.length,
		data4h.duplicates.length,
		data1d.duplicates.length
	)

	// Phase 2: Align timeseries
	console.log('[2/6] Aligning timeseries (backward-only 1D merge)...')
	const aligned = alignTimeseries(data4h.rows, data1d.rows)
	const withData = aligned.filter((r) => r.has1dData)
	const without = aligned.filter((r) => !r.has1dData)
	console.log(`  Aligned: ${withData.length} rows with 1D data, ${without.length} without`)

	// Phase 3: Run all scenarios
	console.log('[3/6] Running scenarios...')
	const allSummaries: SummaryMetrics[] = []

	for (const scenario of SCENARIOS) {
		console.log(`  Running: ${scenario.name}...`)

		const state = processRows(aligned, scenario)
		const trades = buildTradeRecords(aligned, state)
		const curve = buildEquityCurve(state)
		const summary = computeSummary(scenario.name, trades, curve)

		writeEventLog(state.events, scenario.name)
		writeTradeLog(trades, scenario.name)

		allSummaries.push(summary)

		console.log(`    Trades: ${trades.length}, Final equity: $${summary.final_equity.toFixed(2)}, Return: ${summary.total_return_pct.toFixed(2)}%`)
	}

	// Phase 4: Diagnostics (baseline only)
	console.log('[4/6] Computing diagnostics...')
	const baselineState = processRows(aligned, SCENARIOS[0])
	const baselineTrades = buildTradeRecords(aligned, baselineState)
	const diagnostics = computeDiagnostics(baselineTrades, aligned)
	console.log(`  Diagnostics computed for ${diagnostics.length} trades`)

	// Phase 5: Validation (baseline)
	console.log('[5/6] Running validation checks...')
	const validationResults = runValidation(aligned, baselineState, baselineTrades)
	writeValidationReport(validationResults)

	const passed = validationResults.filter((r) => r.passed).length
	const failed = validationResults.filter((r) => !r.passed).length
	console.log(`  ${passed} passed, ${failed} failed`)

	for (const r of validationResults) {
		const icon = r.passed ? 'PASS' : 'FAIL'
		console.log(`    [${icon}] ${r.check}`)
	}

	// Phase 6: Generate reports
	console.log('[6/6] Generating reports...')
	writeSummaryMetrics(allSummaries)
	writeMarkdownReport(allSummaries, validationResults)
	console.log('')
	console.log('=== Done. All outputs written to /output ===')
}

main()
