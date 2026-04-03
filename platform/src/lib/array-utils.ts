export const chunk = <T>(array: T[], size: number): T[][] => {
	return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
		array.slice(i * size, i * size + size)
	)
}

export const shuffle = <T>(array: T[]): T[] => {
	const shuffled = [...array]
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
	}
	return shuffled
}

export const unique = <T>(array: T[]): T[] => {
	return [...new Set(array)]
}

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
	return array.reduce((result, item) => {
		const group = String(item[key])
		if (!result[group]) {
			result[group] = []
		}
		result[group].push(item)
		return result
	}, {} as Record<string, T[]>)
}

export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
	return [...array].sort((a, b) => {
		if (a[key] < b[key]) return order === 'asc' ? -1 : 1
		if (a[key] > b[key]) return order === 'asc' ? 1 : -1
		return 0
	})
}
