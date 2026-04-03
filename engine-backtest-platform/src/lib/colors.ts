export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
		  }
		: null
}

export const rgbToHex = (r: number, g: number, b: number): string => {
	return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export const lighten = (hex: string, percent: number): string => {
	const rgb = hexToRgb(hex)
	if (!rgb) return hex

	const { r, g, b } = rgb
	const amount = Math.round(2.55 * percent)

	return rgbToHex(Math.min(255, r + amount), Math.min(255, g + amount), Math.min(255, b + amount))
}

export const darken = (hex: string, percent: number): string => {
	const rgb = hexToRgb(hex)
	if (!rgb) return hex

	const { r, g, b } = rgb
	const amount = Math.round(2.55 * percent)

	return rgbToHex(Math.max(0, r - amount), Math.max(0, g - amount), Math.max(0, b - amount))
}
