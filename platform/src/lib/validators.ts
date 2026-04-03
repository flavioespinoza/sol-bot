export const isEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email)
}

export const isURL = (url: string): boolean => {
	try {
		new URL(url)
		return true
	} catch {
		return false
	}
}

export const isPhoneNumber = (phone: string): boolean => {
	const phoneRegex = /^\+?[1-9]\d{1,14}$/
	return phoneRegex.test(phone)
}

export const isStrongPassword = (password: string): boolean => {
	const minLength = 8
	const hasUpperCase = /[A-Z]/.test(password)
	const hasLowerCase = /[a-z]/.test(password)
	const hasNumbers = /\d/.test(password)
	const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

	return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
}
