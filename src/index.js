// Uses process.env.NODE_ENV to remove non-production code with rollup
/* global process */

const symUnwrap = Symbol()
const symReflect = Symbol()
const ref$D = {}

const isFunction = value => typeof value === 'function'
const asFunction = value => isFunction(value) ? value : () => value

const arrayIncludes = Array.prototype.includes

const defaults = {
	isNullish: value => value === undefined || value === null,
	noConflict: prop => prop === symUnwrap || prop === '$',
	nil: {
		apply: () => ref$D,
		unwrap: def => def
	},
	propagate: {
		on: 'set',
		value: (k, v) => ({[k]: v})
	}
}

const canonicalize = {
	isNullish: value => {
		if(Array.isArray(value)) {
			return arrayIncludes.bind(value)
		} else if(isFunction(value)) {
			return value
		} else {
			return Object.is.bind(null, value)
		}
	},
	noConflict: value => {
		if(Array.isArray(value)) {
			return prop => prop === symUnwrap || arrayIncludes.call(value, prop)
		} else if(isFunction(value)) {
			return value
		} else {
			return prop => prop === symUnwrap || prop === value
		}
	},
	nil: {
		unwrap: asFunction,
		apply: asFunction
	},
	propagate: value => {
		if(value === 'onSet') {
			return defaults.propagate
		} else if(value === 'onGet') {
			return { on: 'get', value: () => ({}) }
		} else if(value === 'ignore' || value === false) {
			return { on: false }
		} else {
			return value
		}
	}
}
const merge = (obj1, obj2, funcs = canonicalize) => {
	const temp = {}
	for(const key in funcs) {
		if(Object.prototype.hasOwnProperty.call(obj2, key)) {
			temp[key] = typeof funcs[key] === 'function'
				? funcs[key](obj2[key])
				: merge(obj1[key], obj2[key], funcs[key])
		}
	}
	return Object.assign({}, obj1, temp)
}

const instance = config => {
	const havePropagation = base => Object(base) === base && config.propagate.on === 'set'

	const vHandler = {
		get(target, prop) {
			if(config.noConflict(prop)) {
				return target
			}

			if(process.env.NODE_ENV === 'test' && prop === symReflect) {
				return {
					safeNav: true,
					config: config,
					nil: false,
					value: target()
				}
			}

			const base = target()
			let value = base[prop]

			if(isFunction(value)) {
				value = Function.prototype.bind.call(value, base)
			}

			return $P(value, base, prop)
		},
		set(target, prop, to) {
			const value = target()
			return Reflect.set(Object(value), prop, to, value)
		},
		apply(target, context, args) {
			return $P(Reflect.apply(target(), context, args))
		}
	}

	const nHandler = {
		get(target, prop) {
			if(config.noConflict(prop)) {
				return config.nil.unwrap
			}

			const [base, name] = target()

			if(process.env.NODE_ENV === 'test' && prop === symReflect) {
				return {
					safeNav: true,
					config: config,
					nil: true,
					set: val => Object(base)[name] = val
				}
			}

			return havePropagation(base) ? $N($N(base, name), prop) : $D
		},
		set(target, prop, to) {
			const [base, name] = target()
			if(!havePropagation(base)) {
				return true
			}
			
			return Reflect.set(
				base,
				name,
				Reflect.apply(config.propagate.value, $N(base, name), [prop, to]),
				base)
		},
		apply(target, context, args) {
			const value = Reflect.apply(config.nil.apply, context, args)
			return value === ref$D ? $D : value
		}
	}

	// Proxy factory
	const $P = (value, base, name) => {
		if(config.propagate.on === 'get' && config.isNullish(value)) {
			value = Object(base)[name] = Reflect.apply(config.propagate.value, base, [name])
		}
		return config.isNullish(value) ? $N(base, name) : $V(value)
	}

	// Valued proxy factory
	const $V = value => new Proxy(() => value, vHandler)
	// Nil factory
	const $N = (base, name) => new Proxy(() => [base, name], nHandler)
	// Shared detached nil instance
	const $D = $N()

	const $ = value => $P(value)
	$.config = options => instance(merge(config, options))

	return $
}

const $ = instance(defaults)
$[Symbol.toPrimitive] = () => symUnwrap
if(process.env.NODE_ENV === 'test') {
	$._ = symReflect
}

export default $
