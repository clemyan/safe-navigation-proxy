const symbols = {
	$: Symbol('unwrap'),
	// #if REFLECT
	_: Symbol('reflect')
	// #endif
}

const defaults = {
	isNullish: value => value === undefined || value === null,
	noConflict: prop => prop === symbols.$ || prop === '$',
	nil: {
		unwrap: def => def
	},
	propagate: {
		on: 'set',
		value: (k, v) => ({[k]: v})
	}
}

const asFunction = value =>
	typeof value === 'function' ? value : () => value

const instance = options => {
	const config = {nil: {}, propagate: {}}

	// Valued proxy handler
	const vHandler = {
		get(target, prop) {
			if(config.noConflict(prop)) {
				return target
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
			return $P(value[prop], value, prop)
		},
		set(target, prop, to) {
			const value = Object(target())
			return Reflect.set(value, prop, to, value)
		},
		apply(target, context, args) {
			return $P(Reflect.apply(
				target(),
				context ? context[symbols.$]() : context,
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

			// #if REFLECT
			if(prop === symbols._) {
				return {
					safeNav: true,
					config: options,
					nil: true,
					set: val => Object(base)[name] = val
				}
			}
			// #endif

			return base === undefined ? $N() : $N(proxy, prop)
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
		? $D
		: new Proxy(() => [base, name], nHandler)

	// Canonicalize config
	if(Array.isArray(options.isNullish)) {
		config.isNullish = Array.prototype.includes.bind(options.isNullish)
	} else if(typeof options.isNullish === 'function') {
		config.isNullish = options.isNullish
	} else {
		config.isNullish = Object.is.bind(null, options.isNullish)
	}

	if(Array.isArray(options.noConflict)) {
		config.noConflict = prop => prop === symbols.$ || options.noConflict.includes(prop)
	} else if(typeof options.noConflict === 'function') {
		config.noConflict = options.noConflict
	} else {
		config.noConflict = prop => prop === symbols.$ || prop === options.noConflict
	}

	config.nil.unwrap = asFunction(options.nil.unwrap)
	config.nil.apply = Reflect.getOwnPropertyDescriptor(options.nil, 'apply')
		? asFunction(options.nil.apply)
		: () => $D
	
	if(options.propagate === 'onSet') {
		config.propagate = defaults.propagate
	} else if(options.propagate === 'onGet') {
		config.propagate = { on: 'get', value: () => ({}) }
	} else if(options.propagate === 'ignore' || options.propagate === false) {
		config.propagate = { on: false }
	} else {
		config.propagate = options.propagate
	}

	return value => $P(value)
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

const $ = instance(defaults)
$.config = options => instance(merge(defaults, options))
Object.assign($, symbols)

export default $