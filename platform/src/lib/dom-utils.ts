export const scrollToTop = (smooth: boolean = true): void => {
	window.scrollTo({
		top: 0,
		behavior: smooth ? 'smooth' : 'auto',
	})
}

export const scrollToElement = (element: HTMLElement, smooth: boolean = true): void => {
	element.scrollIntoView({
		behavior: smooth ? 'smooth' : 'auto',
		block: 'start',
	})
}

export const getScrollPosition = (): { x: number; y: number } => {
	return {
		x: window.pageXOffset || document.documentElement.scrollLeft,
		y: window.pageYOffset || document.documentElement.scrollTop,
	}
}

export const isElementInViewport = (element: HTMLElement): boolean => {
	const rect = element.getBoundingClientRect()
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	)
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {
		return false
	}
}
