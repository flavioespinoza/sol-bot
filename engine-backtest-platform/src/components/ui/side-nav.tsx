import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MenuIcon } from '@/components/ui/icons'
import { Tooltip } from '@/components/ui/tooltip'
import { useSideNavStore } from '@/state/use-side-nav-store'

interface MenuItem {
	label: string
	path: string
	icon: (isActive: boolean) => JSX.Element
}

interface SideNavProps {
	menuItems: MenuItem[]
	menuItemsFooter: MenuItem[]
	logo: React.FC<{ className?: string }>
}

export const SideNav: React.FC<SideNavProps> = ({ menuItems, menuItemsFooter, logo: Logo }) => {
	const pathname = usePathname()
	const [activePath, setActivePath] = useState<string>(pathname)
	const { isExpanded, width, toggleSideNav } = useSideNavStore()

	useEffect(() => {
		setActivePath(pathname)
	}, [pathname])

	const renderMenuItem = useMemo(
		() =>
			(item: MenuItem): JSX.Element => {
				const isActive = activePath === item.path
				const menuItem = (
					<li key={item.path} onClick={() => setActivePath(item.path)}>
						<Link href={item.path}>
							<div
								className={`group flex h-9 items-center gap-3 rounded-lg px-5 ${
									isActive
										? `${width > 0 ? 'bg-card text-card-foreground shadow-md' : ''}`
										: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md'
								}`}
							>
								{item.icon(isActive)}
								<span
									className={`ml-3 text-sm transition-opacity ${
										isExpanded ? 'opacity-100' : 'hidden opacity-0'
									}`}
								>
									{item.label}
								</span>
							</div>
						</Link>
					</li>
				)

				return !isExpanded ? (
					<Tooltip key={item.path} content={item.label}>
						{menuItem}
					</Tooltip>
				) : (
					menuItem
				)
			},
		[activePath, isExpanded, setActivePath]
	)

	const Nav = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
		return <nav {...props}>{children}</nav>
	}

	return (
		<Nav
			id="sidenav"
			className="flex min-h-screen flex-col bg-background-sidenav transition-all duration-300"
			style={{ width }}
		>
			<header
				id="sidebar_header"
				className={`bg-sidebar-header flex h-[74px] items-center px-4 py-3 ${width > 0 ? 'shadow-md' : ''}`}
			>
				<div
					className={`transition-opacity duration-300 ${
						isExpanded ? 'opacity-100' : 'hidden opacity-0'
					}`}
				>
					<Logo className="h-8 w-8" />
				</div>
				<button onClick={toggleSideNav} className="ml-auto rounded p-1 transition-all duration-200">
					<MenuIcon
						className={`h-6 w-6 cursor-pointer text-muted-foreground transition-transform duration-100 hover:text-foreground ${
							isExpanded ? 'rotate-0' : 'rotate-180'
						}`}
					/>
				</button>
			</header>

			<ul className="flex-grow space-y-1 px-2 py-4">
				{menuItems.map((item) => renderMenuItem(item))}
			</ul>

			<div className="mt-auto p-2">
				<ul className="space-y-1">{menuItemsFooter.map((item) => renderMenuItem(item))}</ul>
			</div>
		</Nav>
	)
}

export default SideNav
