const symbols = {
	$: Symbol('unwrap')
}

function merge(obj1, obj2) {
	if(typeof obj2 === 'object' || Array.isArray(obj2)) {
		return obj2
	}

	const common = {}
	for(const key in obj2) {
		if(obj1.hasOwnProperty(key) && obj2.hasOwnProperty(key)) {
			common[key] = merge(obj1, obj2)
		}
	}

	return Object.assign({}, obj1, obj2, common)
}

const defaults = {

}

function config(options) {
	options = merge(defaults, options)

	const vHandler = {
		get(target, prop) {
			if(prop === symbols.$ || prop === '$') {
				// eslint-disable-next-line no-unused-vars
				return def => target()
			}
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
			if(prop === symbols.$ || prop === '$') {
				return def => def
			}
			return $N(proxy, prop)
		},
		set(target, prop, to) {
			const {base, name} = target()
			const obase = Object(base)
			return Reflect.set(obase, name, {[prop]: to}, obase)
		},
		apply() {
			return $N()
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

		return new Proxy(() => value, vHandler)
	}

	function $N(base, name) {
		return new Proxy(() => ({base, name}), nHandler)
	}

	return value => $(value)
}

const $ = config({})
$.config = config
Object.assign($, symbols)

export default $