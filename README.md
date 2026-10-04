<h1 align="center">💾 react-native-modest-cache</h1>
<div align="center">
  <strong>Simple cache wrapper for AsyncStorage</strong>
</div>
<br>
<div align="center">
  <a href="https://npmjs.org/package/react-native-modest-cache">
    <img src="https://img.shields.io/npm/v/react-native-modest-cache.svg?style=flat-square" alt="Package version" />
  </a>
  <a href="https://npmjs.org/package/react-native-modest-cache">
  <img src="https://img.shields.io/npm/dm/react-native-modest-cache.svg?style=flat-square" alt="Downloads" />
  </a>
  <a href="https://github.com/feross/standard">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square" alt="Standard" />
  </a>
  <a href="https://travis-ci.org/tiaanduplessis/react-native-modest-cache">
    <img src="https://img.shields.io/travis/tiaanduplessis/react-native-modest-cache.svg?style=flat-square" alt="Travis Build" />
  </a>
  <a href="https://github.com/RichardLitt/standard-readme)">
    <img src="https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square" alt="Standard Readme" />
  </a>
  <a href="https://github.com/tiaanduplessis/react-native-modest-cache/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/react-native-modest-cache.svg?style=flat-square" alt="License" />
  </a>
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs" />
  </a>
	  <a href="https://greenkeeper.io/">
    <img src="https://badges.greenkeeper.io/tiaanduplessis/react-native-modest-cache.svg" alt="Greenkeeper" />
  </a>
</div>

<h2>Table of Contents</h2>
<details>
  <summary>Table of Contents</summary>
  <li><a href="#about">About</a></li>
  <li><a href="#install">Install</a></li>
  <li><a href="#usage">Usage</a></li>
  <li><a href="#contribute">Contribute</a></li>
  <li><a href="#license">License</a></li>
</details>

## About

This module is a wrapper around [react-native-modest-storage](https://github.com/tiaanduplessis/react-native-modest-storage) that extends it for handling cached values.

## Install

```sh
$ npm install --save react-native-modest-cache
# OR
$ yarn add react-native-modest-cache
```

## Usage

```js
import cache from 'react-native-modest-cache'

async function example () {
  await cache.set('foo', 5, 60) // (key, value, expiryInMinutes)
  await cache.set('bar', 90) // Defaults to 60 minutes
  await cache.set('baz', { hello: 'Friend' })
  console.log(await cache.isExpired('foo')) // false
  console.log(await cache.get('foo')) // 5
  console.log(await cache.get('baz')) // Object {hello: "Friend"}

  // A negative duration is only useful here to demonstrate an expired entry.
  await cache.set('expired', 5, -5)
  console.log(await cache.isExpired('expired')) // true
  console.log(await cache.get('expired')) // undefined (also removes the entry)

  await cache.remove('bar')
  console.log(await cache.get('bar')) // undefined

  await cache.set('bar', 50, {
    interval: 'year', // 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute' or 'second'
    units: 2
  })
  console.log(await cache.isExpired('bar')) // false
  console.log(await cache.get('bar')) // 50

  await cache.flushExpired()
  await cache.flush()
  console.log(await cache.get('bar')) // undefined
}

example().catch(console.error)
```

### Expiry and cleanup

The third argument to `set` is a duration from now, in minutes. Use a positive
number such as `60` to keep an entry for an hour. It defaults to `60` when omitted;
zero and negative durations expire immediately. An entry expires when the current
time reaches its expiry time. There is no background cleanup timer.

- `remove(key)` invalidates one entry, deleting its value and expiry metadata
- `get(key)` returns an unexpired value, or removes an expired entry and returns `undefined`
- `flushExpired()` removes expired entries while retaining unexpired entries
- `flush()` removes all cache entries, whether expired or not, while leaving storage keys outside the cache namespace alone

These operations return promises. Await them when later work depends on cleanup
having finished. `flushExpired()` scans expiry metadata; it does not repair values
whose metadata is already missing. Cache keys use the shared `cache-` and
`cache-expire-` storage prefixes, so avoid writing unrelated data under those
prefixes or using logical keys beginning with `expire-`, which can collide with
another entry's metadata.

The `flushExpired()` prefix correction in this branch is unreleased. Version
`1.0.3` can remove unexpired entries' metadata during cleanup; the corrected
behavior needs a new package release before it is available to npm users.

## Contribute

Contributions are welcome. Please open up an issue or create PR if you would like to help out.

## License

Licensed under the MIT License.
