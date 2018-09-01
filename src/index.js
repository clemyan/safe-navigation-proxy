const symbols = {
	$: Symbol('unwrap'),
	// #if REFLECT
	_: Symbol('reflect')
	// #endif
}

const merge = (obj1, obj2) => {
	if(typeof obj1 !== 'object' || typeof obj2 !== 'object' || Array.isArray(obj2)) {
		return obj2
	}

	const common = {}
	for(const key in obj2) {
		if(obj1.hasOwnProperty(key) && obj2.hasOwnProperty(key)) {
			common[key] = merge(obj1[key], obj2[key])
		}
	}

	return Object.assign({}, obj1, obj2, common)
}

const defaults = {
	noConflict: '$',
	nil: {
		unwrap: def => def
	},
	propagate: {
		on: 'set',
		value: (k, v) => ({[k]: v})
	}
}

function config(options) {
	options = merge(defaults, options)

	const isUnwrapKey = Array.isArray(options.noConflict)
		? prop => prop === symbols.$ || options.noConflict.includes(prop)
		: prop => prop === symbols.$ || prop === options.noConflict
	const nilUnwrap = typeof options.nil.unwrap === 'function'
		? options.nil.unwrap
		: () => options.nil.unwrap
	const nilApply = !options.nil.hasOwnProperty('apply')
		? () => $N()
		: typeof options.nil.apply === 'function'
			? options.nil.apply
			: () => options.nil.apply

	let propagate
	if(options.propagate === 'onSet') {
		propagate = defaults.propagate
	} else if(options.propagate === 'onGet') {
		propagate = { on: 'get', value: () => ({}) }
	} else if(options.propagate === 'ignore' || options.propagate === false) {
		propagate = { on: false }
	} else {
		propagate = options.propagate
	}

	const vHandler = {
		get(target, prop) {
			if(isUnwrapKey(prop)) {
				// eslint-disable-next-line no-unused-vars
				return def => target()
			}

			// #if REFLECT
			if(prop === symbols._) {
				return {
					safeNav: true,
					config: options,
					nil: false,
					value: target()
				}
			}
			// #endif

			const value = Object(target())
			return $(Reflect.get(value, prop, value), value, prop)
		},
		set(target, prop, to) {
			const value = Object(target())
			return Reflect.set(value, prop, to, value)
		},
		apply(target, proxy, args) {
			const context = proxy ? proxy[symbols.$]() : proxy
			return $(Reflect.apply(target(), context, args))
		}
	}

	const nHandler = {
		get(target, prop, proxy) {
			if(isUnwrapKey(prop)) {
				return nilUnwrap
			}

			// #if REFLECT
			if(prop === symbols._) {
				const [base, name] = target()
				return {
					safeNav: true,
					config: options,
					nil: true,
					set: val => Object(base)[name] = val
				}
			}
			// #endif

			return $N(proxy, prop)
		},
		set(target, prop, to) {
			if(propagate.on === false) {
				return true
			}
			
			const [base, name] = target()
			const obase = Object(base)
			return Reflect.set(obase, name, Reflect.apply(propagate.value, $N(obase, name), [prop, to]), obase)
		},
		apply(target, context, args) {
			return Reflect.apply(nilApply, context, args)
		}
	}

	const isNullish = options.isNullish
	function $(value, base, name) {
		if(!options.hasOwnProperty('isNullish') && (value === undefined || value === null)
			|| Array.isArray(isNullish) && isNullish.includes(value)
			|| typeof isNullish === 'function' && isNullish(value)
			|| Object.is(isNullish, value)) {

			return $N(base, name)
		}

		return $V(value)
	}

	function $V(value) { return new Proxy(() => value, vHandler) }

	const $N = propagate.on === 'get'
		? (base, name) => $V(base[name] = Reflect.apply(propagate.value, base, [name]))
		: (base, name) => new Proxy(() => ([base, name]), nHandler)

	return value => $(value)
}

const $ = config({})
$.config = config
Object.assign($, symbols)

export default $