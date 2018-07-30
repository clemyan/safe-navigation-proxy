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

The build output is in the `dist` directory. `dist/index.js` is in the revaling module pattern. I.e. it is an IIFE whose return value is assigned to a global variable, which makes it suitable for use in a browser environment. In this case, a function is assigned to `safeNav` (documented below as `$`).

Files for other module loader styles are also available in the respective directories.

## Example

```JavaScript
import $ from 'safe-navigation-proxy'

const proxy = $({a: {b: {c: 1}}})
console.log(proxy.a.b.c.$()) // 1
console.log(proxy.non.existent.property.$()) // undefined
```

## Documentation

### Safe navigaion proxies

Safe navigation proxies are, as you may have guessed, the basis of `safe-navigation-proxy`. A safe navigation proxy either contains a value, or is a nil reference. This section specifies the operations on and the behavior of safe navigation proxies.

The test suite in the `test` directory is also a pretty thorough specification of `safe-navigation-proxy`.

### Construction

The default export of `safe-navigation-proxy` is a function that constructs a safe navigation proxy. This function is documented as `$` below. But note that the revealing module (`dist/index.js`) and the UMD module (in revealing module mode) distributables assign this function to the global variable `safeNav` instead of `$` to prevent conflict with other libraries.

`$(value)` returns a safe navigation proxy constructed from `value`. That means a nil reference if value is nullish (by default, `undefined` and `null` are nullish), or a proxy containing that value otherwise.

### Unwrapping

To retrive values from safe navigation proxies, they have a method keyed by the symbol `$.$`. By default, this method is also be keyed by the property name `$`.

The unwrap method takes a default value argument, which will be returned if the proxy is a nil reference. Unwrapping a non-nil proxy returns the contained value, and the argument is ignored. Note that the argument is `undefined` if none is explicitly passed.

Note that this allows safe navigation proxies to be used for nullish-coalescing

```JavaScript
console.log($(undefined).$(2)) // 2
console.log($(null).$(2)) // 2
console.log($(1).$(2)) // 1
```

### Get

Property access is the primary use case of safe navigation proxies. Getting a property of a nil reference returns a nil reference to that property. Getting a property of a non-nil proxy returns a safe navigation proxy constructed from the accessing the corresponding property of the contained value. That means, since `undefined` is nullish by default, accessing an undefined property via a safe navigation proxy returns a nil reference.

```JavaScript
const proxy = $({a: {b: {c: 1}}})
console.log(proxy.a.b.c.$()) // 1
console.log(proxy.non.existent.property.$(2)) // 2
console.log(proxy.non.existent.property.$()) // undefined
```
