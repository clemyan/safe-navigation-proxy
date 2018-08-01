const symbols = {
	unwrap: Symbol('$')
}

const vHandler = {
	get(target, prop) {
		if(prop === symbols.unwrap || prop === '$') {
			// eslint-disable-next-line no-unused-vars
			return def => target()
		}
		const value = Object(target())
		return safeNav(Reflect.get(value, prop, value), value, prop)
	},
	set(target, prop, to) {
		const value = Object(target())
		return Reflect.set(value, prop, to, value)
	},
	apply(target, proxy, args) {
		const context = proxy ? proxy[symbols.unwrap]() : proxy
		return safeNav(Reflect.apply(target(), context, args))
	}
}

const nHandler = {
	get(target, prop, proxy) {
		if(prop === symbols.unwrap || prop === '$') {
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

function safeNav(value, base, name) {
	if(value === undefined || value === null) {
		return $N(base, name)
	}

	return new Proxy(() => value, vHandler)
}

function $N(base, name) {
	return new Proxy(() => ({base, name}), nHandler)
}

const $ = value => safeNav(value)
$.$ = symbols.unwrap

export default $