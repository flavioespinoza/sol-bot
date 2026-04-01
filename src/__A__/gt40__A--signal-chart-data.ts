import { resolve } from 'path'
import { writeFileSync } from 'fs'
import { loadBinanceCsv } from './binance-loader__A.js'
import { type OhlcvCandle, type OttParams, computeOtt } from './ott-indicator__A.js'

const DATA_DIR = resolve(process.cwd(), 'data')
const EMA_LENGTH = 25
const OTT_PCT = 0.03

function getSignals(candles: OhlcvCandle[]) {
	const params: OttParams = { emaLength: EMA_LENGTH, percent: OTT_PCT, mode: 'ratcheting' }
	const ott = computeOtt(candles, params)

	const days: { date: string; close: number; signal: string; ema: number; ottVal: number }[] = []

	let state: 'long' | 'flat' = ott[0].trend === 'bullish' ? 'long' : 'flat'

	days.push({
		date: ott[0].timestamp.toISOString().slice(0, 10),
		close: ott[0].close,
		signal: state === 'long' ? 'BUY' : 'WAIT',
		ema: ott[0].ema,
		ottVal: ott[0].ott
	})

	for (let i = 1; i < ott.length; i++) {
		const prev = ott[i - 1]
		const curr = ott[i]

		let signal: string
		if (prev.trend === 'bearish' && curr.trend === 'bullish') {
			signal = 'BUY'
			state = 'long'
		} else if (prev.trend === 'bullish' && curr.trend === 'bearish') {
			signal = 'SELL'
			state = 'flat'
		} else if (curr.trend === 'bullish') {
			signal = 'HOLD'
		} else {
			signal = 'WAIT'
		}

		days.push({
			date: curr.timestamp.toISOString().slice(0, 10),
			close: curr.close,
			signal,
			ema: curr.ema,
			ottVal: curr.ott
		})
	}

	return days
}

const candles = loadBinanceCsv(resolve(DATA_DIR, 'sol/binance-sol-1d-2021.csv'))
const signals = getSignals(candles)

// output as JSON for the chart
console.log(JSON.stringify(signals))
