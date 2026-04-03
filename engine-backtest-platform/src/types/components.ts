import { ButtonHTMLAttributes, AnchorHTMLAttributes, HTMLAttributes } from 'react'

export interface BaseComponentProps {
	className?: string
	children?: React.ReactNode
}

export interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseComponentProps {
	asChild?: boolean
}

export interface LinkBaseProps extends AnchorHTMLAttributes<HTMLAnchorElement>, BaseComponentProps {
	asChild?: boolean
}

export interface CardBaseProps extends HTMLAttributes<HTMLDivElement>, BaseComponentProps {
	variant?: 'default' | 'outlined' | 'elevated'
}

export type Variant = 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
export type Size = 'sm' | 'default' | 'lg' | 'icon'
