import { execFile } from 'child_process'
import { resolve } from 'path'
import { promisify } from 'util'
import { NextRequest, NextResponse } from 'next/server'

const execFileAsync = promisify(execFile)

const PYTHON_BIN = process.env.PYTHON_BIN || 'python3'

/**
 * GET /api/backtest?ema=40&percent=0.04&capital=10000
 *
 * Shells out to the Python OTT backtest engine (python/main.py) and
 * returns its JSON output: { metrics, trade_log, candles }.
 */
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const ema = parseInt(searchParams.get('ema') || '40', 10)
	const percent = parseFloat(searchParams.get('percent') || '0.04')
	const capital = parseFloat(searchParams.get('capital') || '10000')

	if (!Number.isFinite(ema) || ema < 1) {
		return NextResponse.json({ error: 'invalid ema' }, { status: 400 })
	}
	if (!Number.isFinite(percent) || percent <= 0 || percent >= 1) {
		return NextResponse.json({ error: 'invalid percent' }, { status: 400 })
	}
	if (!Number.isFinite(capital) || capital <= 0) {
		return NextResponse.json({ error: 'invalid capital' }, { status: 400 })
	}

	// process.cwd() is the Next.js project root (engine-backtest-platform/)
	const root = process.cwd()
	const script = resolve(root, 'python', 'main.py')
	const dataFile = resolve(root, 'data', 'sol', 'binance-sol-1d-2021-to-2026-feb.csv')

	const args = [
		script,
		'--ema',
		String(ema),
		'--percent',
		String(percent),
		'--capital',
		String(capital),
		'--data',
		dataFile
	]

	try {
		const { stdout, stderr } = await execFileAsync(PYTHON_BIN, args, {
			cwd: root,
			maxBuffer: 32 * 1024 * 1024
		})

		if (stderr && stderr.trim()) {
			console.warn('[api/backtest] python stderr:', stderr)
		}

		const payload = JSON.parse(stdout)
		return NextResponse.json(payload)
	} catch (err) {
		const e = err as NodeJS.ErrnoException & { stderr?: string }
		console.error('[api/backtest] engine failed:', e.message, e.stderr)
		return NextResponse.json(
			{ error: 'backtest engine failed', detail: e.message, stderr: e.stderr },
			{ status: 500 }
		)
	}
}
