import $ from '../src/index.js'

expect.extend({
	toHaveValue(received, expected){
		try {
			const value = received[$.$]()
			
			if(value === undefined){
				return {
					pass: false,
					message: () => this.utils.matcherHint('.toHaveValue')
						+ '\n\n'
						+ `Expected value to be safe navigation proxy with value:\n`
						+ `  ${this.utils.printExpected(expected)}\n`
						+ `Received:\n` +
						+ `  ${this.utils.printReceived(received)}`
				}
			}

			let pass
			if(expected && typeof expected.asymmetricMatch === 'function'){
				pass = expected.asymmetricMatch(value)
			} else {
				pass = Object.is(expected, value)
			}

			return {
				pass,
				message: pass
					? () => this.utils.matcherHint('.not.toHaveValue')
						+ '\n\n'
						+ `Expected value not to be safe navigation proxy with value:\n`
						+ `  ${this.utils.printExpected(expected)}\n`
						+ `Received safe navigation proxy with value:\n` +
						+ `  ${this.utils.printReceived(value)}`
					: () => this.utils.matcherHint('.toHaveValue')
						+ '\n\n'
						+ `Expected value to be safe navigation proxy with value:\n`
						+ `  ${this.utils.printExpected(expected)}\n`
						+ `Received safe navigation proxy with value:\n` +
						+ `  ${this.utils.printReceived(value)}`
			}
		} catch(err) {
			return {
				pass: false,
				message: () => this.utils.matcherHint('.toHaveValue')
					+ '\n\n'
					+ `Expected value to be safe navigation proxy with value:\n`
					+ `  ${this.utils.printExpected(expected)}\n`
					+ `Received:\n` +
					+ `  ${this.utils.printReceived(received)}`
			}
		}
	},
	toBeNil(received, expected){
		this.utils.ensureNoExpected(expected)
		try {
			const value = received[$.$]()
			const pass = value === undefined

			return {
				pass,
				message: pass
					? () => this.utils.matcherHint('.not.toBeNil')
						+ '\n\n'
						+ `Received nil reference`
					: () => this.utils.matcherHint('.toBeNil')
						+ '\n\n'
						+ `Received safe navigation proxy with value:\n`
						+ `  ${this.utils.printReceived(value)}`
			}
		} catch(err) {
			return {
				pass: false,
				message: () => this.utils.matcherHint('.toBeNil')
					+ '\n\n'
					+ `Received:\n`
					+ `  ${this.utils.printReceived(received)}`
			}
		}
	}
})

describe("Wrapping & unwrapping", () => {
	it("should return the value of a non-nil proxy", () => {
		const obj = {}
		expect($(obj).$()).toBe(obj)
		expect($(obj)[$.$]()).toBe(obj)
		expect($(obj).$(1)).toBe(obj)
		expect($(obj)[$.$](1)).toBe(obj)
	})

	it("should return undefined for undefined nil", () => {
		expect($(undefined).$()).toBeUndefined()
		expect($(undefined)[$.$]()).toBeUndefined()
	})

	it("should return the given default value for undefined nil", () => {
		const obj = {}
		expect($(undefined).$(obj)).toBe(obj)
		expect($(undefined)[$.$](obj)).toBe(obj)
	})

	it("should return undefined for null nil", () => {
		expect($(null).$()).toBeUndefined()
		expect($(null)[$.$]()).toBeUndefined()
	})

	it("should return the given default value for null nil", () => {
		const obj = {}
		expect($(null).$(obj)).toBe(obj)
		expect($(null)[$.$](obj)).toBe(obj)
	})
})

describe("Basic get", () => {
	const obj = {a: {b: {c: {d: {e: 1, f: null}}}}}

	it("should return proxy with property value for existing property", () => {
		expect($(obj).a.b.c.d.e).toHaveValue(1)
	})

	it("should return nil reference for non-existent property", () => {
		expect($(obj).u.v.w.x.y.z).toBeNil()
	})

	it("should return nil reference for null property", () => {
		expect($(obj).a.b.c.d.f).toBeNil()
	})
})