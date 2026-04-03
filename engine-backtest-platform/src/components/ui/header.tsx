import React from 'react'

interface HeaderProps {
	height: string
}

export const Header: React.FC<HeaderProps> = ({ height }) => {
	return (
		<header className={`flex ${height} items-center p-4 shadow-md`}>
			<div className="flex-1">
				<h1 className="hidden font-bold text-foreground sm:block">DISCO</h1>
			</div>
			<p className="font-bold text-foreground">Online</p>
		</header>
	)
}
