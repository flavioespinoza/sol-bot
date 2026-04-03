'use client'

import React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

function Tooltip({
	children,
	content,
	delay = 300,
	...props
}: {
	children: React.ReactNode
	content: string
	delay?: number
}) {
	return (
		<TooltipPrimitive.Provider delayDuration={delay}>
			<TooltipPrimitive.Root>
				<TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
				<TooltipPrimitive.Portal>
					<TooltipPrimitive.Content
						className={cn(
							'z-50 overflow-hidden rounded-md bg-tooltip px-2 py-1 text-xs text-tooltip-foreground shadow-md'
						)}
						sideOffset={4}
						{...props}
					>
						{content}
						<TooltipPrimitive.Arrow className="fill-tooltip" />
					</TooltipPrimitive.Content>
				</TooltipPrimitive.Portal>
			</TooltipPrimitive.Root>
		</TooltipPrimitive.Provider>
	)
}

export { Tooltip }
