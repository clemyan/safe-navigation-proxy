import $ from '../../src/index.js'
import '../utils/matchers.js'

describe("Array", () => {
	const obj = {n: {e: {s: {t: {zero: 0}}}}}
	const ref1 = {}
	const ref2 = {}
	const $conf = $.config({isNullish: [0, 1, true, false, ref1]})

	it("should treat values in array to be nullish", () => {
		expect($conf(0)).toBeNil()
		expect($conf(1)).toBeNil()
		expect($conf(false)).toBeNil()
		expect($conf(true)).toBeNil()
		expect($conf(ref1)).toBeNil()
		expect($conf(obj).n.e.s.t.zero).toBeNil()
	})

	it("should treat values not in array to be non-nullish", () => {
		expect($conf()).toHaveValue(undefined)
		expect($conf(null)).toHaveValue(null)
		expect($conf(ref2)).toHaveValue(ref2)
		expect($conf(obj).n.e.s.t.undef).toHaveValue(undefined)
	})
})

describe("Function", () => {
	const ref = {}
	const fn = jest.fn()
	const $conf = $.config({isNullish: fn})
	const values = [0, 1, true, false, undefined, null, ref]

	beforeEach(fn.mockReset.bind(fn))

	it("should call isNullish", () => {
		$conf(ref)
		expect(fn).toBeCalledTimes(1)
		expect(fn).toBeCalledWith(ref)
	})

	it("should treat value as nullish if isNullish returns true", () => {
		fn.mockReturnValue(true)
		values.forEach(value => {
			expect($conf(value)).toBeNil()
		})
	})

	it("should treat value as non-nullish if isNullish returns false", () => {
		fn.mockReturnValue(false)
		values.forEach(value => {
			expect($conf(value)).toHaveValue(value)
		})
	})

	it("should throw if isNullish throws", () => {
		fn.mockImplementation(() => {throw new Error})
		values.forEach(value => {
			expect(() => $conf(value)).toThrow()
		})
	})
})

describe("Other", () => {
	const ref1 = {}
	const ref2 = {}
	const values = [0, 1, true, false, undefined, null, ref1]

	it("should treat value as nullish if same as isNullish", () => {
		values.forEach(value => {
			const $conf = $.config({isNullish: value})
			expect($conf(value)).toBeNil()
		})
	})
	
	test.each(values.map(Array.of))(
		"should treat values other than %s as non-nullish",
		(value, i) => {
			const $conf = $.config({isNullish: value})
			values.forEach((other, j) => {
				if(i !== j) {
					expect($conf(other)).toHaveValue(other)
				}
			})
			expect($conf(ref2)).toHaveValue(ref2)
		})
})