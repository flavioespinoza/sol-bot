import { resolve } from 'path'
import { loadBinanceCsv } from './csv-loader.js'
import { runBacktest, buyAndHold } from './backtest.js'

const candles = loadBinanceCsv(resolve(process.cwd(), 'data/sol/binance-sol-1d-2021-to-2026-feb.csv'))
const r = runBacktest(candles, 40, 0.04)
console.log('Trades:', r.trades)
console.log('Return:', r.returnPct.toFixed(2) + '%')
console.log('Final Equity: $' + r.finalEquity.toFixed(2))
console.log('Max DD:', r.maxDrawdownPct.toFixed(2) + '%')
console.log('Bullish days:', r.bullishDays, '/', candles.length)
console.log('Bearish days:', r.bearishDays, '/', candles.length)

const bnh = buyAndHold(candles)
console.log('Buy & Hold Return:', bnh.returnPct.toFixed(2) + '%')
console.log('Buy & Hold Equity: $' + bnh.finalEquity.toFixed(2))
console.log('Buy & Hold Max DD:', bnh.maxDrawdownPct.toFixed(2) + '%')
