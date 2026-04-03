'use client'

import React from 'react'
import { Header } from '@/components/ui/header'
import { LogoIcon } from '@/components/ui/icons'
import { SideNav } from '@/components/ui/side-nav'
import { menuItems, menuItemsFooter } from '@/constants/menu-items'
import { useSideNav } from '@/hooks/use-side-nav'
import { useSideNavStore } from '@/state/use-side-nav-store'

const HEADER_HEIGHT = 'h-[74px]'

interface MainLayoutProps {
	children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
	useSideNav()
	const { width } = useSideNavStore()

	console.log(width)

	return (
		<div id="mainLayoutWrapper" className="flex min-h-screen w-full">
			<SideNav menuItems={menuItems} menuItemsFooter={menuItemsFooter} logo={LogoIcon} />
			<div
				id="mainLayoutContent"
				className="flex flex-1 flex-col transition-all duration-300"
				style={{ width: `calc(100% - ${width}px)` }}
			>
				<Header height={HEADER_HEIGHT} />
				<main className={`flex-1 p-4`}>{children}</main>
			</div>
		</div>
	)
}

export { MainLayout }
export default MainLayout
