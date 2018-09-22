import $ from 'src/index.js'
import 'test/utils/matchers.js'

describe("onSet", () => {
	describe("without value", () => {
		const $conf = $.config({propagate: 'onSet'})

		it("should not progagate with only access", () => {
			const obj = {}

			$conf(obj).n.e.s.t
			expect($(obj).n.e.s.t).toBeNil()
		})

		it("should progagate with assignment", () => {
			const obj = {}
			const ref = {}

			$conf(obj).n.e.s.t = ref
			expect(obj.n.e.s.t).toBe(ref)
		})
	})

	describe("with function value", () => {
		const fn = jest.fn()
		const $conf = $.config({propagate: {
			on: 'set',
			value: fn
		}})

		beforeEach(fn.mockReset.bind(fn))

		it("should call value with correct arguments", () => {
			const obj = {}
			const sym = Symbol()
			const refs = [{}, {}, {}, {}, {}]

			let i = 0
			fn.mockImplementation(() => refs[i++])

			$conf(obj).x.n.e.s.t[sym] = refs[0]
			expect(fn).toBeCalledTimes(5)
			expect(fn).nthCalledWith(1, sym, refs[0])
			expect(fn).nthCalledWith(2, 't', refs[1])
			expect(fn).nthCalledWith(3, 's', refs[2])
			expect(fn).nthCalledWith(4, 'e', refs[3])
			expect(fn).nthCalledWith(5, 'n', refs[4])
		})

		it("should call value with correct context", () => {
			const obj = {}
			const sym = Symbol()
			const ref = {}

			fn.mockImplementation((k, v) => ({[k]: v}))
				.mockImplementationOnce(function() {
					expect(this).toBeNil()
					this[sym] = ref
					expect(obj.n.e.s[sym]).toBe(ref)
				})

			$conf(obj).n.e.s.t = ref
			expect(fn).toBeCalled()
		})

		it("should set with return value", () => {
			const obj = {}
			const ref = {}

			fn.mockImplementation((k, v) => ({[k]: v}))
				.mockReturnValueOnce(ref)

			$conf(obj).n.e.s.t = {}
			expect(obj.n.e.s).toBe(ref)
		})
	})
})

describe("onGet", () => {
	describe("without value", () => {
		const $conf = $.config({propagate: 'onGet'})

		it("should progagate with only access", () => {
			const obj = {}

			$conf(obj).n.e.s.t
			expect(obj.n.e.s.t).toEqual({})
		})

		it("should still progagate with assignment", () => {
			const obj = {}
			const ref = {}

			$conf(obj).n.e.s.t = ref
			expect(obj.n.e.s.t).toBe(ref)
		})
	})

	describe("with function value", () => {
		const fn = jest.fn()
		const $conf = $.config({propagate: {
			on: 'get',
			value: fn
		}})

		beforeEach(fn.mockReset.bind(fn))

		it("should call value with correct arguments", () => {
			const obj = {}
			const sym = Symbol()
			fn.mockImplementation(() => ({}))

			$conf(obj).n.e.s.t[sym]
			expect(fn).toBeCalledTimes(5)
			expect(fn).nthCalledWith(1, 'n')
			expect(fn).nthCalledWith(2, 'e')
			expect(fn).nthCalledWith(3, 's')
			expect(fn).nthCalledWith(4, 't')
			expect(fn).nthCalledWith(5, sym)
		})

		it("should call value with correct context", () => {
			const obj = {}

			fn.mockImplementationOnce(() => ({}))
				.mockImplementationOnce(() => ({}))
				.mockImplementationOnce(() => ({}))
				.mockImplementationOnce(function() {
					expect(this).toBe(obj.n.e.s)
				})
			
			$conf(obj).n.e.s.t
			expect.assertions(1)
		})

		it("should set with return value", () => {
			const obj = {}
			const ref = {}

			fn.mockReturnValueOnce({})
				.mockReturnValueOnce({})
				.mockReturnValueOnce({})
				.mockReturnValueOnce(ref)

			$conf(obj).n.e.s.t
			expect(obj.n.e.s.t).toBe(ref)
		})
	})
})


describe("ignore", () => {
	test.each(
		['ignore', false, {on: false}]
			.map(propagate => [JSON.stringify(propagate), $.config({propagate})])
	)("should not propagate with propagate = %s", (_, $conf) => {
		const obj = {}

		$conf(obj).n.e.s.t = {}
		expect(obj.n).toBeUndefined()
	})
})
