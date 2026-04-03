export const camelCase = (str: string): string => {
	return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
}

export const snakeCase = (str: string): string => {
	return str
		.replace(/([a-z])([A-Z])/g, '$1_$2')
		.replace(/[\s-]+/g, '_')
		.toLowerCase()
}

export const kebabCase = (str: string): string => {
	return str
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/[\s_]+/g, '-')
		.toLowerCase()
}

export const titleCase = (str: string): string => {
	return str
		.toLowerCase()
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

export const removeWhitespace = (str: string): string => {
	return str.replace(/\s+/g, '')
}

export const reverse = (str: string): string => {
	return str.split('').reverse().join('')
}

export const isPalindrome = (str: string): boolean => {
	const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '')
	return cleaned === cleaned.split('').reverse().join('')
}
