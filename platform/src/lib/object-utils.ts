export const deepClone = <T>(obj: T): T => {
	return JSON.parse(JSON.stringify(obj))
}

export const isEmpty = (obj: object): boolean => {
	return Object.keys(obj).length === 0
}

export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
	return keys.reduce((acc, key) => {
		if (key in obj) {
			acc[key] = obj[key]
		}
		return acc
	}, {} as Pick<T, K>)
}

export const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
	const result = { ...obj }
	keys.forEach((key) => delete result[key])
	return result
}

export const merge = <T extends object>(target: T, ...sources: Partial<T>[]): T => {
	return Object.assign({}, target, ...sources)
}

export const flatten = (obj: any, prefix: string = ''): Record<string, any> => {
	return Object.keys(obj).reduce((acc, key) => {
		const pre = prefix.length ? `${prefix}.` : ''
		if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
			Object.assign(acc, flatten(obj[key], pre + key))
		} else {
			acc[pre + key] = obj[key]
		}
		return acc
	}, {} as Record<string, any>)
}
