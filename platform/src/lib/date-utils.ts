export const addDays = (date: Date, days: number): Date => {
	const result = new Date(date)
	result.setDate(result.getDate() + days)
	return result
}

export const subtractDays = (date: Date, days: number): Date => {
	return addDays(date, -days)
}

export const isSameDay = (date1: Date, date2: Date): boolean => {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	)
}

export const isToday = (date: Date): boolean => {
	return isSameDay(date, new Date())
}

export const getDayOfYear = (date: Date): number => {
	const start = new Date(date.getFullYear(), 0, 0)
	const diff = date.getTime() - start.getTime()
	const oneDay = 1000 * 60 * 60 * 24
	return Math.floor(diff / oneDay)
}

export const getWeekNumber = (date: Date): number => {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
	const dayNum = d.getUTCDay() || 7
	d.setUTCDate(d.getUTCDate() + 4 - dayNum)
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
