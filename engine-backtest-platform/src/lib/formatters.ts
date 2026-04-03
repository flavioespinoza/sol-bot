export const formatCurrency = (amount: number, currency: string = 'USD', locale: string = 'en-US'): string => {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currency,
	}).format(amount)
}

export const formatDate = (date: Date, locale: string = 'en-US'): string => {
	return new Intl.DateTimeFormat(locale).format(date)
}

export const formatRelativeTime = (date: Date, locale: string = 'en-US'): string => {
	const now = new Date()
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

	if (diffInSeconds < 60) {
		return rtf.format(-diffInSeconds, 'second')
	} else if (diffInSeconds < 3600) {
		return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
	} else if (diffInSeconds < 86400) {
		return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
	} else if (diffInSeconds < 2592000) {
		return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
	} else if (diffInSeconds < 31536000) {
		return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month')
	} else {
		return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year')
	}
}

export const formatNumber = (num: number, locale: string = 'en-US'): string => {
	return new Intl.NumberFormat(locale).format(num)
}

export const truncate = (str: string, length: number = 50, ending: string = '...'): string => {
	if (str.length > length) {
		return str.substring(0, length - ending.length) + ending
	}
	return str
}

export const capitalize = (str: string): string => {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const slugify = (str: string): string => {
	return str
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
}
