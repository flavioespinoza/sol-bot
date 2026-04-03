export type ClassValue = string | number | ClassDictionary | ClassArray | undefined | null | boolean

export interface ClassDictionary {
	[id: string]: any
}

export type ClassArray = ClassValue[]

export type PolymorphicRef<C extends React.ElementType> = React.ComponentPropsWithRef<C>['ref']

export type PolymorphicComponentProp<C extends React.ElementType, Props = {}> = React.PropsWithChildren<
	Props & {
		as?: C
	}
> &
	Omit<React.ComponentPropsWithoutRef<C>, keyof (Props & { as?: C })> & { ref?: PolymorphicRef<C> }

export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never }
export type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U
