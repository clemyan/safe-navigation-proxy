import $ from 'src/index.js'
import 'test/utils/matchers.js'

function nil($conf) {
	return $conf({}).u.v.w
}

describe("Function", () => {
	const fn = jest.fn()
	const $conf = $.config({nil: {apply: fn}})

	beforeEach(fn.mockReset.bind(fn))

	it("should call nil.apply when applying nil", () => {
		const ref = {}

		nil($conf)(ref)
		expect(fn).toBeCalledTimes(1)
		expect(fn).toBeCalledWith(ref)
	})

	it("should call nil.apply with correct context when applying nil", () => {
		const obj = {}
		const ref = {}
		fn.mockImplementationOnce(function() { this.w = ref })

		$conf(obj).x.y.z()
		expect(obj.x.y.w).toBe(ref)
	})

	it("should return the return value of nil.apply", () => {
		const ref = {}
		fn.mockReturnValue(ref)

		expect(nil($conf)()).toBe(ref)
	})

	it("should not affect non-nil apply", () => {
		const ref = {}
		const obj = {n: {e: {s: {t: () => ref}}}}
		fn.mockReturnValue(42)

		expect($conf(obj).n.e.s.t()).toHaveValue(ref)
	})
})

describe("Other", () => {
	const ref = {}
	const $conf = $.config({nil: {apply: ref}})

	it("should return nil.apply", () => {
		expect(nil($conf)()).toBe(ref)
	})

	it("should not affect non-nil apply", () => {
		const ref = {}
		const obj = {n: {e: {s: {t: () => ref}}}}

		expect($conf(obj).n.e.s.t()).toHaveValue(ref)
	})
})
