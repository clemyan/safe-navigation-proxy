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
		return safeNav(Reflect.get(value, prop, value))
	}
}

const nHandler = {
	get(target, prop) {
		if(prop === symbols.unwrap || prop === '$') {
			return def => def
		}
		return nil(undefined, undefined)
	}
}

function safeNav(value, base, name) {
	if(value === undefined || value === null) {
		return nil(base, name)
	}

	return new Proxy(() => value, vHandler)
}

function nil() {
	return new Proxy(() => nil(undefined, undefined), nHandler)
}

const $ = value => safeNav(value, undefined, undefined)
$.$ = symbols.unwrap

export default $