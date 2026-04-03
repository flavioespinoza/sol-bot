import React from 'react'

export default function HeaderMobile() {
	return (
		<header className="flex">
			<div className="flex-1">
				<span className="font-bold text-foreground">Salsa</span>
				<span className="font-bold text-foreground">Online</span>
			</div>
			<div className="flex-shrink-0">
				<button className="font-bold text-foreground">Menu</button>
			</div>
		</header>
	)
}

export { HeaderMobile }
