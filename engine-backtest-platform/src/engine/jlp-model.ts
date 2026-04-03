/**
 * JLP Price & APY Model for the web backtest platform.
 *
 * Mirrors src/__A__/jlp-model__A.ts but uses the platform's type system.
 */

import type { OhlcvCandle } from './types'

// ── Configuration ────────────────────────────────────────────

export interface JlpWeights {
	solWeight: number
	stableWeight: number
	btcWeight: number
	ethWeight: number
}

export interface JlpApyConfig {
	baseApyAnnual: number
	volatilityScaling: boolean
	apyFloor: number
	apyCap: number
}

export interface KaminoConfig {
	leverage: number
	borrowRateAnnual: number
	liquidationLtv: number
}

export const DEFAULT_WEIGHTS: JlpWeights = {
	solWeight: 0.47,
	stableWeight: 0.32,
	btcWeight: 0.11,
	ethWeight: 0.10
}

export const DEFAULT_APY: JlpApyConfig = {
	baseApyAnnual: 0.15,
	volatilityScaling: true,
	apyFloor: 0.10,
	apyCap: 0.60
}

export const DEFAULT_KAMINO: KaminoConfig = {
	leverage: 3.0,
	borrowRateAnnual: 0.15,
	liquidationLtv: 0.90
}

// ── JLP Model Candle ─────────────────────────────────────────

export interface JlpCandle {
	timestamp: Date
	price: number
	apyAnnualized: number
	cumulativeYield: number
	priceWithYield: number
	solPrice: number
}

// ── Core Model ───────────────────────────────────────────────

function rollingVolatility(candles: OhlcvCandle[], index: number, window: number = 20): number {
	if (index < window) return 0.5
	const returns: number[] = []
	for (let i = index - window + 1; i <= index; i++) {
		const ret = (candles[i].close - candles[i - 1].close) / candles[i - 1].close
		returns.push(ret)
	}
	const mean = returns.reduce((a, b) => a + b, 0) / returns.length
	const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length
	return Math.sqrt(variance) * Math.sqrt(365)
}

function modelDailyApy(vol: number, config: JlpApyConfig): number {
	let apy = config.baseApyAnnual
	if (config.volatilityScaling) {
		const volNorm = Math.max(0, Math.min(1, (vol - 0.3) / (1.5 - 0.3)))
		apy = config.apyFloor + volNorm * (config.apyCap - config.apyFloor)
	}
	return Math.max(config.apyFloor, Math.min(config.apyCap, apy))
}

export function modelJlpPrices(
	solCandles: OhlcvCandle[],
	weights: JlpWeights = DEFAULT_WEIGHTS,
	apyConfig: JlpApyConfig = DEFAULT_APY
): JlpCandle[] {
	if (solCandles.length === 0) return []

	const result: JlpCandle[] = []
	let jlpIndex = 1.0
	let cumulativeYield = 0

	for (let i = 0; i < solCandles.length; i++) {
		const c = solCandles[i]

		if (i === 0) {
			result.push({
				timestamp: c.timestamp,
				price: 1.0,
				apyAnnualized: apyConfig.baseApyAnnual,
				cumulativeYield: 0,
				priceWithYield: 1.0,
				solPrice: c.close
			})
			continue
		}

		const prev = solCandles[i - 1]
		const solReturn = (c.close - prev.close) / prev.close
		const btcEthReturn = solReturn * 0.5

		const jlpDailyReturn =
			weights.solWeight * solReturn +
			(weights.btcWeight + weights.ethWeight) * btcEthReturn

		jlpIndex *= 1 + jlpDailyReturn

		const vol = rollingVolatility(solCandles, i)
		const annualApy = modelDailyApy(vol, apyConfig)
		const dailyYield = annualApy / 365
		cumulativeYield += dailyYield

		result.push({
			timestamp: c.timestamp,
			price: jlpIndex,
			apyAnnualized: annualApy,
			cumulativeYield,
			priceWithYield: jlpIndex * (1 + cumulativeYield),
			solPrice: c.close
		})
	}

	return result
}

// ── Leverage Helpers ─────────────────────────────────────────

export function leveragedDailyReturn(
	jlpReturn: number,
	config: KaminoConfig
): { netReturn: number; liquidated: boolean } {
	const dailyBorrowRate = config.borrowRateAnnual / 365
	const borrowed = config.leverage - 1
	const netReturn = config.leverage * jlpReturn - borrowed * dailyBorrowRate
	const maxLoss = (1 - 1 / config.leverage) * config.liquidationLtv
	return { netReturn, liquidated: -netReturn >= maxLoss }
}

export function netLeveragedApy(jlpApy: number, config: KaminoConfig): number {
	return jlpApy * config.leverage - config.borrowRateAnnual * (config.leverage - 1)
}
