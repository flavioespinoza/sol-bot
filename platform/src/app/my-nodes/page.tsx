import React from 'react'
import { MainLayout } from '@/components/main-layout'
import { generateRandomNames } from '@/lib/utils'

export default function MyNodesPage() {
	const names = generateRandomNames(5)

	return (
		<MainLayout>
			<h1 className="text-lg font-bold">My Nodes Page</h1>
			<ul>
				{names.map((name, index) => (
					<li key={index}>{name}</li>
				))}
			</ul>
		</MainLayout>
	)
}
