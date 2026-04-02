import { spawn } from 'child_process'
import { resolve } from 'path'
import { NextRequest, NextResponse } from 'next/server'

// Spawns the Python engine. Don't let Next try to prerender this.
export const dynamic = 'force-dynamic'

function runEngine(ema: number, percent: number, capital: number): Promise<string> {
	const script = resolve(process.cwd(), 'python', 'main.py')
	return new Promise((res, rej) => {
		const proc = spawn('python3', [
			script,
			'--ema', String(ema),
			'--percent', String(percent),
			'--capital', String(capital)
		])
		let stdout = ''
		let stderr = ''
		proc.stdout.on('data', (d) => (stdout += d))
		proc.stderr.on('data', (d) => (stderr += d))
		proc.on('error', rej)
		proc.on('close', (code) => {
			if (code !== 0) {
				rej(new Error(`python exited ${code}: ${stderr}`))
			} else {
				res(stdout)
			}
		})
	})
}

export async function GET(request: NextRequest) {
	const sp = request.nextUrl.searchParams
	const ema = parseInt(sp.get('ema') || '40', 10)
	const percent = parseFloat(sp.get('percent') || '0.04')
	const capital = parseFloat(sp.get('capital') || '10000')

	if (!Number.isFinite(ema) || !Number.isFinite(percent) || !Number.isFinite(capital)) {
		return NextResponse.json({ error: 'invalid params' }, { status: 400 })
	}

	try {
		const stdout = await runEngine(ema, percent, capital)
		return new NextResponse(stdout, {
			status: 200,
			headers: { 'content-type': 'application/json' }
		})
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		return NextResponse.json({ error: msg }, { status: 500 })
	}
}
