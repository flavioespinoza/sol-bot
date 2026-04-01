import { create } from 'zustand'

interface SideNavState {
	device: 'mobile' | 'tablet' | 'desktop'
	isExpanded: boolean
	width: number
	setDevice: (device: 'mobile' | 'tablet' | 'desktop') => void
	toggleSideNav: () => void
}

export const useSideNavStore = create<SideNavState>((set) => ({
	device: 'desktop',
	isExpanded: true,
	width: 260,

	setDevice: (device) => {
		const newState = {
			device,
			isExpanded: device === 'desktop',
			width: device === 'mobile' ? 0 : device === 'tablet' ? 72 : 260
		}
		// console.log('📢 Updated SideNav State:', newState)
		set(newState)
	},

	toggleSideNav: () => {
		set((state) => {
			const newState = {
				...state,
				isExpanded: !state.isExpanded,
				width: state.isExpanded ? (state.device === 'mobile' ? 0 : 72) : 260
			}
			// console.log('📢 Toggled SideNav State:', newState)
			return newState
		})
	}
}))
