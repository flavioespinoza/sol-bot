import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => {
	return twMerge(clsx(inputs))
}

export function generateRandomNames(
	count: number = 1,
	options: { fullName: boolean } = { fullName: true }
): string[] {
	const firstNames: string[] = [
		'John',
		'Emily',
		'Michael',
		'Sarah',
		'William',
		'Olivia',
		'James',
		'Ava',
		'Robert',
		'Isabella',
		'Richard',
		'Mia',
		'Charles',
		'Charlotte',
		'Thomas',
		'Amelia'
	]

	const lastNames: string[] = [
		'Smith',
		'Johnson',
		'Williams',
		'Jones',
		'Brown',
		'Davis',
		'Miller',
		'Wilson',
		'Moore',
		'Taylor',
		'Anderson',
		'Thomas',
		'Jackson',
		'White',
		'Harris',
		'Martin'
	]

	const names: string[] = []

	for (let i = 0; i < count; i++) {
		const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
		const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]

		if (options.fullName) {
			names.push(`${firstName} ${lastName}`)
		} else {
			names.push(firstName)
		}
	}

	return names
}
