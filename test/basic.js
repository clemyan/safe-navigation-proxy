import $ from 'src/index.js'
import 'test/utils/matchers.js'

describe("Basic wrap & unwrap", () => {
	it("should return the value of a non-nil proxy", () => {
		const obj = {}
		expect($(obj).$()).toBe(obj)
		expect($(obj)[$]()).toBe(obj)
		expect($(obj).$(1)).toBe(obj)
		expect($(obj)[$](1)).toBe(obj)
	})

	it("should return the value if falsy but not nullish", () => {
		expect($(false).$(true)).toBe(false)
		expect($(false)[$](true)).toBe(false)
		expect($(0).$(1)).toBe(0)
		expect($(0)[$](1)).toBe(0)
	})

	it("should return undefined for undefined nil", () => {
		expect($(undefined).$()).toBeUndefined()
		expect($(undefined)[$]()).toBeUndefined()
	})

	it("should return the given default value for undefined nil", () => {
		const obj = {}
		expect($(undefined).$(obj)).toBe(obj)
		expect($(undefined)[$](obj)).toBe(obj)
	})

	it("should return undefined for null nil", () => {
		expect($(null).$()).toBeUndefined()
		expect($(null)[$]()).toBeUndefined()
	})

	it("should return the given default value for null nil", () => {
		const obj = {}
		expect($(null).$(obj)).toBe(obj)
		expect($(null)[$](obj)).toBe(obj)
	})
})

describe("Basic get", () => {
	const obj = {n: {e: {s: {t: {e: {d: {
		one: 1,
		null: null,
		get getTwo() { return 2 },
		get getThis() { return this },
		get getNull() { return null },
	}}}}}}}
	const proxy = $(obj)

	it("should return proxy with property value for existing property", () => {
		expect(proxy.n.e.s.t.e.d.one).toHaveValue(1)
	})

	it("should return nil reference for undefined property", () => {
		expect(proxy.u.v.w.x.y.z).toBeNil()
	})

	it("should return nil reference for null property", () => {
		expect(proxy.n.e.s.t.e.d.null).toBeNil()
	})

	it("should return proxy with getter return value", () => {
		expect(proxy.n.e.s.t.e.d.getTwo).toHaveValue(2)
	})

	it("should call getter with correct context", () => {
		expect(proxy.n.e.s.t.e.d.getThis).toHaveValue(obj.n.e.s.t.e.d)
	})

	it("should return nil reference for getter returning null", () => {
		expect(proxy.n.e.s.t.e.d.getNull).toBeNil()
	})
})

describe("Basic set", () => {
	let obj, proxy
	const setValue = jest.fn()
	const setContext = jest.fn()
	beforeEach(() => {
		obj = {
			n: {e: {s: {t: {e: {d: {
				set setter(value) {
					setValue(value)
					setContext(this)
				}
			}}}}}},
			null: null
		}
		proxy = $(obj)
		setValue.mockClear()
		setContext.mockClear()
	})

	it("should set normally for existing base value", () => {
		const to = {}
		proxy.n.e.s.t.e.d.x = to
		expect(obj.n.e.s.t.e.d.x).toBe(to)
	})

	it("should propagate set for undefined nil", () => {
		const to = {}
		proxy.a.b.c.d.e = to
		expect(obj.a.b.c.d.e).toBe(to)
	})

	it("should propagate set for null nil", () => {
		const to = {}
		proxy.null.a.b.c.d = to
		expect(obj.null.a.b.c.d).toBe(to)
	})

	it("should set normally using setter", () => {
		const to = {}
		proxy.n.e.s.t.e.d.setter = to
		expect(setValue).toBeCalledTimes(1)
		expect(setValue).toBeCalledWith(to)
	})

	it("should call setter with correct context", () => {
		const to = {}
		proxy.n.e.s.t.e.d.setter = to
		expect(setContext).toBeCalledTimes(1)
		expect(setContext).toBeCalledWith(obj.n.e.s.t.e.d)
	})

	it("should not throw when setting direct nil", () => {
		expect(() => { $(undefined).a = 1 }).not.toThrow()
		expect(() => { $(null).a = 1 }).not.toThrow()
	})
})

describe("Basic apply", () => {
	const func = jest.fn()
	const obj = {n: {e: {s: {t: {e: {d: {func, notFunc: 1}}}}}}}
	const proxy = $(obj)

	beforeEach(func.mockReset.bind(func))

	it("should call contained value", () => {
		const arg1 = {}
		const arg2 = {}
		proxy.n.e.s.t.e.d.func(arg1, arg2)
		expect(func).toBeCalledTimes(1)
		expect(func).toBeCalledWith(arg1, arg2)
	})

	it("should call contained value with correct context", () => {
		func.mockReturnThis()
		expect(proxy.n.e.s.t.e.d.func()).toHaveValue(obj.n.e.s.t.e.d)
	})

	it("should return proxy with non-nullish return value", () => {
		const value = {}
		func.mockReturnValueOnce(value)
		expect(proxy.n.e.s.t.e.d.func()).toHaveValue(value)
	})

	it("should return nil reference on nullish return value", () => {
		func.mockReturnValueOnce(undefined)
		expect(proxy.n.e.s.t.e.d.func()).toBeNil()
		func.mockReturnValueOnce(null)
		expect(proxy.n.e.s.t.e.d.func()).toBeNil()
	})

	it("should throw TypeError if contained value is not function", () => {
		expect(() => proxy.n.e.s.t.e.d.notFunc()).toThrow(TypeError)
	})

	it("should return nil reference when calling nil reference", () => {
		expect(proxy.n.e.s.t.e.d.undef()).toBeNil()
		expect(proxy.u.v.w.x.y.z()).toBeNil()
	})
})
