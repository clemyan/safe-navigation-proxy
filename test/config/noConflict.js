import $ from '../../src/index.js'
import '../utils/matchers.js'

const symUnwrap = Symbol('unwrap')
const symNotUnwrap = Symbol('notUnwrap')
const obj = {n: {e: {s: {t: {
	unwrap:         {},
	[symUnwrap]:    {},
	notUnwrap:      {},
	[symNotUnwrap]: {},
	$:              {},
	[$.$]:          {},
}}}}}

function testUnwrap($conf, prop) {
	expect($conf(obj).n.e.s.t[prop]).not.toBeSafeNav()
	expect($conf(obj).n.e.s.t[prop]).not.toThrow()
	expect($conf(obj).n.e.s.t[prop]()).toBe(obj.n.e.s.t)
}

function testNotUnwrap($conf, prop) {
	expect($conf(obj).n.e.s.t[prop]).toHaveValue(obj.n.e.s.t[prop])
}

describe.each([
	['True',   true,                  false, false],
	['String', 'unwrap',              true,  false],
	['Symbol', symUnwrap,             false, true ],
	['Array',  ['unwrap', symUnwrap], true,  true ]
])("%s", (_, noConflict, ...tests) => {
	const $conf = $.config({noConflict})

	test.each(
		['unwrap', symUnwrap]
			.filter((_, index) => tests[index])
			.map(prop => [typeof prop, prop])
	)("should be able to unwrap with specified %s prop", (_, prop) => {
		testUnwrap($conf, prop)
	})

	test.each(
		['notUnwrap', symNotUnwrap].map(prop => [typeof prop, prop])
	)("should not be able to unwrap with unspecified %s prop", (_, prop) => {
		testNotUnwrap($conf, prop)
	})

	it("should not be able to unwrap with $", () => {
		testNotUnwrap($conf, '$')
	})

	it("should still be able to unwrap with $.$", () => {
		testUnwrap($conf, $.$)
	})
})