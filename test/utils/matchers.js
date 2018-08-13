import $ from '../../src/index.js'

expect.extend({
	toBeSafeNav(received, expected) {
		this.utils.ensureNoExpected(expected)

		const reflect = received[$._]
		const pass = reflect !== undefined && reflect.saveNav === true

		return {
			pass,
			message: pass
				? () => this.utils.matcherHint('.not.toBeSaveNav')
					+ '\n\n'
					+ 'Received save navigation proxy'
				: () => this.utils.matcherHint('.toBeSaveNav')
					+ '\n\n'
					+ 'Received:\n'
					+ `  ${this.utils.printReceived(received)}`
		}
	},
	toHaveValue(received, expected) {
		const reflect = received[$._]

		if(reflect === undefined || reflect.safeNav !== true) {
			return {
				pass: false,
				message: () => this.utils.matcherHint('.toHaveValue')
					+ '\n\n'
					+ `Expected value to be safe navigation proxy with value:\n`
					+ `  ${this.utils.printExpected(expected)}\n`
					+ `Received:\n`
					+ `  ${this.utils.printReceived(received)}`
			}
		}
		
		if(reflect.nil !== false) {
			return {
				pass: false,
				message: () => this.utils.matcherHint('.toHaveValue')
					+ '\n\n'
					+ `Expected value to be safe navigation proxy with value:\n`
					+ `  ${this.utils.printExpected(expected)}\n`
					+ `Received nil reference`
			}
		}

		const value = reflect.value
		const pass = expected && typeof expected.asymmetricMatch === 'function'
			? expected.asymmetricMatch(value)
			: Object.is(expected, value)

		return {
			pass,
			message: pass
				? () => this.utils.matcherHint('.not.toHaveValue')
					+ '\n\n'
					+ `Expected value not to be safe navigation proxy with value:\n`
					+ `  ${this.utils.printExpected(expected)}\n`
					+ `Received safe navigation proxy with value:\n`
					+ `  ${this.utils.printReceived(value)}`
				: () => this.utils.matcherHint('.toHaveValue')
					+ '\n\n'
					+ `Expected value to be safe navigation proxy with value:\n`
					+ `  ${this.utils.printExpected(expected)}\n`
					+ `Received safe navigation proxy with value:\n`
					+ `  ${this.utils.printReceived(value)}`
		}
	},
	toBeNil(received, expected) {
		this.utils.ensureNoExpected(expected)

		const reflect = received[$._]

		if(reflect === undefined || reflect.safeNav !== true) {
			return {
				pass: false,
				message: () => this.utils.matcherHint('.toBeNil')
					+ '\n\n'
					+ `Received:\n`
					+ `  ${this.utils.printReceived(received)}`
			}
		}

		const pass = reflect.nil === true

		return {
			pass,
			message: pass
				? () => this.utils.matcherHint('.not.toBeNil')
					+ '\n\n'
					+ `Received nil reference`
				: () => this.utils.matcherHint('.toBeNil')
					+ '\n\n'
					+ `Received safe navigation proxy with value:\n`
					+ `  ${this.utils.printReceived(reflect.value)}`
		}
	}
})