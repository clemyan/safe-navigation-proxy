const symbols = {
	unwrap: Symbol('$')
}

const vHandler = {
	get(target, prop, receiver) {
		if(prop === symbols.unwrap || prop === '$') {
			// eslint-disable-next-line no-unused-vars
			return def => target()
		}
		return safeNav(Reflect.get(Object(target()), prop, receiver))
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

function safeNav(val, base, name) {
	if(val === undefined || val === null) {
		return nil(base, name)
	}

	return new Proxy(() => val, vHandler)
}

function nil() {
	return new Proxy(() => nil(undefined, undefined), nHandler)
}

const $ = val => safeNav(val, undefined, undefined)
$.$ = symbols.unwrap

export default $