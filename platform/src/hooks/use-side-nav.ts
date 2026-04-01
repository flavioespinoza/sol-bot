import { useEffect } from 'react'
import { useSideNavStore } from '@/state/use-side-nav-store'

export const useSideNav = () => {
	const { setDevice } = useSideNavStore()

	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth

			if (width <= 640) {
				setDevice('mobile')
			} else if (width > 640 && width <= 1024) {
				setDevice('tablet')
			} else {
				setDevice('desktop')
			}
		}

		handleResize()
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [setDevice])
}
