# [WIP] safe-navigation-proxy

Safe navigation using ES2015 Proxies

This is a WIP

## Installation and Usage

For the time being, you must clone/download the repo and build it yourself.

First, install all dependencies. Dependencies are originally managed using [`pnpm`](https://pnpm.js.org/), though `npm` and `yarn` should work fine.
```
$ npm install # or yarn install or pnpm install
```
which should also run the build. If not, run
```
$ npm run build
```

The build output is in the `dist` directory. `dist/index.js` is in the revealing module pattern. I.e. it is an IIFE whose return value is assigned to a global variable, which makes it suitable for use in a browser environment. In this case, a function is assigned to `safeNav` (documented below as `$`).

Files for other module loader styles are also available in the respective directories.

## Example

```JavaScript
import $ from 'safe-navigation-proxy'

const obj = {n: {e: {s: {t: {e: {d: {
	one: 1,
	func: () => 1
}}}}}}}
const proxy = $(obj)

// Get
console.log(proxy.n.e.s.t.e.d.one.$()) // 1
console.log(proxy.non.existent.property.$()) // undefined
console.log(proxy.non.existent.property.$(2)) // 2

// Set
proxy.x.y.z = 2 // Now obj.x is {y: {z: 2}}

// Apply
console.log(proxy.n.e.s.t.e.d.func().$()) // 1
console.log(proxy.non.existent.func().$()) // undefined
```

## Documentation

### Safe navigation proxies

Safe navigation proxies are, as you may have guessed, the basis of `safe-navigation-proxy`. As shown in the examples above, they allow access and other operations on nested properties of objects without throwing `TypeError`s for `undefined` or `null` intermediate values (a.k.a. safe navigation).

A safe navigation proxy either

- is a nil reference, denoted as `$N` or `$N{ref}`; or
- contains a value. They are denoted `$V` or `$V{value}`.

This section specifies the operations on and the behavior of safe navigation proxies.

> _You may notice that nil is said to be a **reference** above. This is an abstract concept that operations on the nil reference can modify the object being referred to (a.k.a. the referent). This is necessary to implement assignment propagation (documented below). Since JavaScript does not have reference types, the operations on nil references cannot be specified to carry out operations not possible in userland code (e.g. reassigning variables). On the other hand, how the specified effects are achieved is implementation detail._

The test suite in the `test` directory is also a pretty thorough specification of `safe-navigation-proxy`.

### Construction

The default export of `safe-navigation-proxy` is a function that constructs a safe navigation proxy. This function is denoted as `$` below. But note that the revealing module (`dist/index.js`) and the UMD module (in revealing module mode) distributables assign this function to the global variable `safeNav` instead of `$` to prevent conflict with other libraries.

`$(value)` returns `value` wrapped in a safe navigation proxy. That means a nil reference to an empty object if `value` is nullish (by default, `undefined` and `null` are nullish), or a proxy containing that value otherwise.

That is

- `$(value)` returns `$N{{}}` if `value` is nullish
- `$(value)` returns `$V{value}` otherwise

> _Here, we have a nil reference to an empty object literal. Since outside code cannot get a handle on that object, this is a shorthand to say operations on this nil reference will not modify any visible objects._

### Unwrapping

To retrieve values from safe navigation proxies, they have a method keyed by the symbol `$.$`. By default, this method is also be keyed by the property name `$`.

The unwrap method takes a default value argument, which will be returned if the proxy is a nil reference. Unwrapping a non-nil proxy returns the contained value, and the argument is ignored. Note that the argument is `undefined` if none is explicitly passed.

That is,

- `$N.$(def)` and `$N[$.$](def)` returns `def`
- `$V{value}.$(def)` and `$V{value}[$.$](def)` returns `value`

Note that this allows safe navigation proxies to be used for nullish-coalescing

```JavaScript
console.log($(undefined).$(2)) // 2
console.log($(null).$(2)) // 2
console.log($(1).$(2)) // 1
```

### Get

Property access is the primary use case of safe navigation proxies. Getting a property of a nil reference returns a nil reference to that property. Getting a property of a non-nil proxy returns either a proxy with value equal to that property of the contained value if that is not nullish, or a nil reference to it otherwise

That is

- `$N{ref}.prop` returns `$N{$N{ref}.prop}`
- `$V{value}.prop` returns `$N{value.prop}` if `value.prop` is nullish
- `$V{value}.prop` returns `$V{value.prop}` if `value.prop` is not nullish

Since `undefined` is nullish by default, accessing an undefined property via a safe navigation proxy returns a nil reference.

### Set

Besides accessing properties, creating nested properties are also troublesome. One often have to create a stack of empty objects in order to create a nested property. `safe-navigation-proxy` simplifies this by supporting assignment propagation.

When assignment propagation is enabled (which is the default), assigning a value to a property of a nil reference sets the referent to (by default) an object with only one own property -- the key-value pair being assigned.

Assigning a value to a property of a non-nil proxy delegates to a normal assignment to the contained value.

That is

- Setting `$N{ref}.prop = v` sets `ref = {prop: v}`
- Setting `$V{value}.prop = v` sets `value.prop = v`

Note that this means assignment propagates from deeply nested properties up to shallow properties. Assuming `obj.a` is nullish, `$(obj).a.b.c.d = 1` is `$N{$N{$N{obj.a}.b}.c}.d = 1`. That resolves as:

1. `N{$N{obj.a}.b}.c = {d: 1}`
2. `$N{obj.a}.b = {c: {d: 1}}`
3. `obj.a = {b: {c: {d: 1}}}`

This distinction is important when configuration comes into the mix.

### Apply

In JavaScript, functions are first class objects and can be assigned to object properties. These methods can be accessed using safe navigation proxies, but working with them only using proxy get is cumbersome. One have to unwrap with a default implementation, call, then rewrap.

To facilitate safely navigating to and through methods, safe navigation proxies can be called as functions to effectively perform the process outlined above. In particular, calling a non-nil proxy calls the contained value as a function and wraps the return value in a safe navigation proxy; and calling a nil reference return a nil reference to an empty object.

That is,

- `$N(args)` returns `$N{{}}`
- `$V{value}(args)` returns `$(value(args))`

Note that if a non-nil proxy with a non-function value is called, the value will be called as a function, resulting in `TypeError` being thrown by default.

### Configuration

While the sections above have detailed the default behavior of safe navigation proxies. However, their true power lies in their configurability.

#### `$.config(options)`

The `$.config` function creates a configured instance of `$`

```JavaScript
const $conf = $.config({ /* some options */ })

// Then $conf can be used in place of $
const value = $conf(obj).n.e.s.t.e.d.$()
```

Any safe navigation proxy created from operations on a configured proxy also inherits the configuration. So, proxies in a get/apply chain exhibits the same behavior.

The following sections details each option.

#### `options.isNullish`

The default `$` treats `undefined` and `null` as nullish. The `isNullish` configuration changes what value(s) is/are considered nullish.

If `isNullish` is an array, then a value is considered nullish if and only if it is contained within `isNullish`, determined with [`Array.prototype.includes`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes).

If `isNullish` is a function, then it will be called with the value as the only argument. A value is considered nullish if and only if `isNullish(value)` returns a truthy value. Note that if `isNullish` throws, `$conf(value)` also throws with the same error.

For all other values of `isNullish`, then only that value is considered nullish. Values that are the same as the `isNullish` value according to [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) are nullish.

Note that if `options.isNullish` explicitly set to or declared as `undefined`, then `null` is not considered nullish since only `undefined` is. To trigger the default behavior, make sure `options` does not have `isNullish` as an own property or use the array `[undefined, null]`.