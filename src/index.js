const symbols = {
	get: Symbol('$')
}

function safeNav(val, baseVal, refName){
	if(val === undefined || val === null){
		return nil(baseVal, refName)
	}

	return new Proxy(() => val, {
		get(target, prop, receiver){
			if(prop === symbols.get || prop === '$'){
				// eslint-disable-next-line no-unused-vars
				return def => val
			}
			return safeNav(Reflect.get(Object(val), prop, receiver))
		},
	})
}

function nil(){
	return new Proxy(() => nil(undefined, undefined), {
		get(target, prop){
			if(prop === symbols.get || prop === '$'){
				return def => def
			}
			return nil(undefined, undefined)
		},
	})
}

const $ = val => safeNav(val, undefined, undefined)
$.$ = symbols.get

export default $