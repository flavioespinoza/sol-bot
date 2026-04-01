import fs from 'fs'
import path from 'path'
import { DuplicateLog, EventRecord, SummaryMetrics, TradeRecord, ValidationResult } from './types.js'

const OUTPUT_DIR = path.resolve(import.meta.dirname, '..', 'output')

function ensureOutputDir(): void {
	if (!fs.existsSync(OUTPUT_DIR)) {
		fs.mkdirSync(OUTPUT_DIR, { recursive: true })
	}
}

export function writeDuplicateLog(duplicates: DuplicateLog[]): void {
	ensureOutputDir()
	const header = 'timestamp,type,kept_price,kept_support,kept_ott,kept_trend,kept_signal,dropped_price,dropped_support,dropped_ott,dropped_trend,dropped_signal'
	const rows = duplicates.map((d) =>
		[
			d.timestamp,
			d.type,
			d.kept.price,
			d.kept.supportLine,
			d.kept.ottValue,
			d.kept.trend,
			d.kept.signalType,
			d.dropped.price,
			d.dropped.supportLine,
			d.dropped.ottValue,
			d.dropped.trend,
			d.dropped.signalType
		].join(',')
	)
	fs.writeFileSync(path.join(OUTPUT_DIR, 'duplicate_log.csv'), [header, ...rows].join('\n'))
}

export function writeEventLog(events: EventRecord[], scenario: string): void {
	ensureOutputDir()
	const lines = events.map((e) => JSON.stringify(e))
	const filename = scenario === 'baseline' ? 'event_log.jsonl' : `event_log_${scenario}.jsonl`
	fs.writeFileSync(path.join(OUTPUT_DIR, filename), lines.join('\n'))
}

export function writeTradeLog(trades: TradeRecord[], scenario: string): void {
	ensureOutputDir()
	if (trades.length === 0) return

	const header = Object.keys(trades[0]).join(',')
	const rows = trades.map((t) => Object.values(t).join(','))
	const filename = scenario === 'baseline' ? 'trade_log.csv' : `trade_log_${scenario}.csv`
	fs.writeFileSync(path.join(OUTPUT_DIR, filename), [header, ...rows].join('\n'))
}

export function writeSummaryMetrics(summaries: SummaryMetrics[]): void {
	ensureOutputDir()
	fs.writeFileSync(
		path.join(OUTPUT_DIR, 'summary_metrics.json'),
		JSON.stringify(summaries, null, 2)
	)
}

export function writeValidationReport(results: ValidationResult[]): void {
	ensureOutputDir()
	const report = {
		total_checks: results.length,
		passed: results.filter((r) => r.passed).length,
		failed: results.filter((r) => !r.passed).length,
		checks: results
	}
	fs.writeFileSync(
		path.join(OUTPUT_DIR, 'validation_report.json'),
		JSON.stringify(report, null, 2)
	)
}

export function writeSchemaReport(rows4h: number, rows1d: number, duplicates4h: number, duplicates1d: number): void {
	ensureOutputDir()
	const report = {
		data_4h: {
			total_rows: rows4h,
			duplicates_removed: duplicates4h
		},
		data_1d: {
			total_rows: rows1d,
			duplicates_removed: duplicates1d
		},
		generated_at: new Date().toISOString()
	}
	fs.writeFileSync(
		path.join(OUTPUT_DIR, 'schema_report.json'),
		JSON.stringify(report, null, 2)
	)
}

export function writeMarkdownReport(summaries: SummaryMetrics[], validationResults: ValidationResult[]): void {
	ensureOutputDir()

	const lines: string[] = []
	lines.push('# OTT Backtest Report')
	lines.push('')
	lines.push(`Generated: ${new Date().toISOString()}`)
	lines.push('')

	lines.push('## Validation')
	lines.push('')
	const passed = validationResults.filter((r) => r.passed).length
	const total = validationResults.length
	lines.push(`**${passed}/${total} checks passed**`)
	lines.push('')

	for (const r of validationResults) {
		const icon = r.passed ? 'PASS' : 'FAIL'
		lines.push(`- [${icon}] ${r.check}: ${r.details}`)
	}
	lines.push('')

	lines.push('## Scenario Comparison')
	lines.push('')
	lines.push('| Scenario | Trades | Win Rate | Total Return | Max DD | Final Equity |')
	lines.push('|----------|--------|----------|-------------|--------|-------------|')

	for (const s of summaries) {
		lines.push(
			`| ${s.scenario} | ${s.total_trades} | ${s.win_rate}% | ${s.total_return_pct.toFixed(2)}% | ${s.max_drawdown_pct.toFixed(2)}% | $${s.final_equity.toFixed(2)} |`
		)
	}
	lines.push('')

	lines.push('## Trade Details (Baseline)')
	lines.push('')
	const baseline = summaries.find((s) => s.scenario === 'baseline')
	if (baseline) {
		lines.push(`- Total trades: ${baseline.total_trades}`)
		lines.push(`- Winning: ${baseline.winning_trades}`)
		lines.push(`- Losing: ${baseline.losing_trades}`)
		lines.push(`- Avg return: ${baseline.avg_return_pct.toFixed(4)}%`)
		lines.push(`- Avg hours in trade: ${baseline.avg_hours_in_trade.toFixed(2)}`)
		lines.push(`- Avg MFE: ${baseline.avg_mfe_pct.toFixed(4)}%`)
		lines.push(`- Avg MAE: ${baseline.avg_mae_pct.toFixed(4)}%`)
	}

	fs.writeFileSync(path.join(OUTPUT_DIR, 'backtest_report.md'), lines.join('\n'))
}
