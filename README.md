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

const obj = {a: {b: {c: 1}}}
const proxy = $(obj)

// Get
console.log(proxy.a.b.c.$()) // 1
console.log(proxy.non.existent.property.$()) // undefined

// Set
proxy.x.y.z = 2 // Now obj is {a: {b: {c: 1}}, x: {y: {z: 2}}}
```

## Documentation

### Safe navigation proxies

Safe navigation proxies are, as you may have guessed, the basis of `safe-navigation-proxy`. As shown in the examples above, they allow access and other operations on nested properties of objects without throwing `TypeError`s for `undefined` or `null` intermediate values (a.k.a. safe navigation).

A safe navigation proxy either

- is a nil reference, denoted as `$N` or `$N(base,name)` below; or
- contains a value. They are denoted `$V` or `$V(value)` below.

This section specifies the operations on and the behavior of safe navigation proxies.

The test suite in the `test` directory is also a pretty thorough specification of `safe-navigation-proxy`.

### Construction

The default export of `safe-navigation-proxy` is a function that constructs a safe navigation proxy. This function is denoted as `$` below. But note that the revealing module (`dist/index.js`) and the UMD module (in revealing module mode) distributables assign this function to the global variable `safeNav` instead of `$` to prevent conflict with other libraries.

`$(value)` returns `value` wrapped in a safe navigation proxy. That means a nil reference if `value` is nullish (by default, `undefined` and `null` are nullish), or a proxy containing that value otherwise.

That is

- `$(value)` returns `$N` if `value` is nullish
- `$(value)` returns `$V(value)` otherwise

### Unwrapping

To retrieve values from safe navigation proxies, they have a method keyed by the symbol `$.$`. By default, this method is also be keyed by the property name `$`.

The unwrap method takes a default value argument, which will be returned if the proxy is a nil reference. Unwrapping a non-nil proxy returns the contained value, and the argument is ignored. Note that the argument is `undefined` if none is explicitly passed.

That is,

- `$N.$(def)` and `$N[$.$](def)` returns `def`
- `$V(value).$(def)` and `$V(value)[$.$](def)` returns `value`

Note that this allows safe navigation proxies to be used for nullish-coalescing

```JavaScript
console.log($(undefined).$(2)) // 2
console.log($(null).$(2)) // 2
console.log($(1).$(2)) // 1
```

### Get

Property access is the primary use case of safe navigation proxies. Getting a property of a nil reference returns a nil reference to that property. Getting a property of a non-nil proxy returns the result of accessing the corresponding property of the contained value, wrapped in a safe navigation proxy.

That is, roughly

- `$N(base,name).prop` returns `$N($N(base,name), prop)`
- `$V(value).prop` returns `$N(value,prop)` if `value.prop` is nullish
- `$V(value).prop` returns `$V(value.prop)` if `value.prop` is not nullish

Since `undefined` is nullish by default, accessing an undefined property via a safe navigation proxy returns a nil reference.

```JavaScript
const proxy = $({a: {b: {c: 1}}})
console.log(proxy.a.b.c.$()) // 1
console.log(proxy.non.existent.property.$(2)) // 2
console.log(proxy.non.existent.property.$()) // undefined
```

### Set

Besides accessing properties, creating nested properties are also troublesome. One often have to create a stack of empty objects in order to create a nested property. `safe-navigation-proxy` simplifies this by supporting assignment propagation.

When assignment propagation is enabled (which is the default), assigning a value to a property of a nil reference sets the referent to (by default) an object with only one own property with the key-value pair being assigned.

Assigning a value to a property of a non-nil proxy delegates to a normal assignment to the contained value.

That is

- Setting `$N(base,name).prop = v` sets `base.name = {prop: v}`
- Setting `$V(value).prop = v` sets `value.prop = v`

Note that this means assignment propagates from nested properties up. `$(obj).a.b.c.d = 1` is `$N($N($N(obj,a),b),c).d = 1` assuming `obj.a` is nullish. That resolves as:

1. `$N($N(obj,a),b).c = {d: 1}`
2. `$N(obj,a).b = {c: {d: 1}}`
3. `obj.a = {b: {c: {d: 1}}}`

This distiction is important when configuration comes into the mix.