// Uses process.env.NODE_ENV to remove non-production code with rollup
/* global process */

const symUnwrap = Symbol()
const symReflect = Symbol()

const asFunction = value => typeof value === 'function' ? value : () => value

const defaults = {
	isNullish: value => value === undefined || value === null,
	noConflict: prop => prop === symUnwrap || prop === '$',
	nil: {
		// apply
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
			return Array.prototype.includes.bind(value)
		} else if(typeof value === 'function') {
			return value
		} else {
			return Object.is.bind(null, value)
		}
	},
	noConflict: value => {
		if(Array.isArray(value)) {
			return prop => prop === symUnwrap || value.includes(prop)
		} else if(typeof value === 'function') {
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
	// Valued proxy handler
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

			const value = Object(target())
			return $P(value[prop], value, prop)
		},
		set(target, prop, to) {
			const value = Object(target())
			return Reflect.set(value, prop, to, value)
		},
		apply(target, context, args) {
			return $P(Reflect.apply(
				target(),
				context ? context[symUnwrap]() : context,
				args))
		}
	}

	// Nil handler
	const nHandler = {
		get(target, prop, proxy) {
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

			return base === undefined || config.propagate.on === false
				? $N() : $N(proxy, prop)
		},
		set(target, prop, to) {
			if(config.propagate.on === false) {
				return true
			}
			
			const [base, name] = target()
			const obase = Object(base)
			return Reflect.set(
				obase,
				name,
				Reflect.apply(config.propagate.value, $N(obase, name), [prop, to]),
				obase)
		},
		apply(target, context, args) {
			return Reflect.apply(config.nil.apply, context, args)
		}
	}

	// Proxy factories
	const $P = (value, base, name) => {
		if(config.propagate.on === 'get' && config.isNullish(value)) {
			const obase = Object(base)
			value = obase[name] = Reflect.apply(config.propagate.value, obase, [name])
		}
		return config.isNullish(value) ? $N(base, name) : $V(value)
	}

	const $V = value => new Proxy(() => value, vHandler)

	const $D = new Proxy(() => [], nHandler) // Detached nil
	const $N = (base, name) => Object(base) !== base
		? $D : new Proxy(() => [base, name], nHandler)

	if(!config.nil.apply) {
		config.nil.apply = () => $D
	}

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