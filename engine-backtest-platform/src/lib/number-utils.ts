export const clamp = (value: number, min: number, max: number): number => {
	return Math.min(Math.max(value, min), max)
}

export const randomInt = (min: number, max: number): number => {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export const randomFloat = (min: number, max: number): number => {
	return Math.random() * (max - min) + min
}

export const round = (value: number, decimals: number = 0): number => {
	return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals)
}

export const average = (numbers: number[]): number => {
	return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

export const sum = (numbers: number[]): number => {
	return numbers.reduce((sum, num) => sum + num, 0)
}

export const percentage = (value: number, total: number): number => {
	return (value / total) * 100
}

export const isEven = (num: number): boolean => {
	return num % 2 === 0
}

export const isOdd = (num: number): boolean => {
	return num % 2 !== 0
}

export const isPrime = (num: number): boolean => {
	if (num <= 1) return false
	if (num <= 3) return true
	if (num % 2 === 0 || num % 3 === 0) return false
	for (let i = 5; i * i <= num; i += 6) {
		if (num % i === 0 || num % (i + 2) === 0) return false
	}
	return true
}
