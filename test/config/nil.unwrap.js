import $ from '../../src/index.js'
import '../utils/matchers.js'


function nil($conf) {
	return $conf({}).u.v.w
}

describe("Function", () => {
	const fn = jest.fn()
	const $conf = $.config({nil: {unwrap: fn}})

	beforeEach(fn.mockReset.bind(fn))

	it("should call nil.unwrap when unwrapping nil", () => {
		const ref = {}

		nil($conf).$(ref)
		expect(fn).toBeCalledTimes(1)
		expect(fn).toBeCalledWith(ref)
	})

	it("should call nil.unwrap with correct context when unwrapping nil", () => {
		fn.mockReturnThis()
		const proxy = nil($conf)

		expect(proxy.$()).toBe(proxy)
	})

	it("should unwrap nil to the return value of nil.unwrap", () => {
		const ref = {}
		fn.mockReturnValue(ref)

		expect(nil($conf).$()).toBe(ref)
	})

	it("should not affect non-nil unwrapping", () => {
		const obj = {n: {e: {s: {t: {}}}}}
		expect($conf(obj).n.e.s.t.$(42)).toBe(obj.n.e.s.t)
	})
})

describe("Other", () => {
	const ref = {}
	const $conf = $.config({nil: {unwrap: ref}})

	it("should unwrap nil to nil.unwrap", () => {
		expect(nil($conf).$()).toBe(ref)
	})

	it("should not affect non-nil unwrapping", () => {
		const obj = {n: {e: {s: {t: {}}}}}
		expect($conf(obj).n.e.s.t.$(42)).toBe(obj.n.e.s.t)
	})
})