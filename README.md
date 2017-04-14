<h1 align="center">💾 react-native-modest-cache</h1>
<div align="center">
  <strong>Simple cache for AsyncStorage</strong>
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
  <a href="https://dependencyci.com/github/tiaanduplessis/react-native-modest-cache">
    <img src="https://dependencyci.com/github/tiaanduplessis/react-native-modest-cache/badge?style=flat-square" alt="Dependency CI" />
  </a>
  <a href="https://github.com/tiaanduplessis/react-native-modest-cache/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/react-native-modest-cache.svg?style=flat-square" alt="License" />
  </a>
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs" />
  </a>
  <a href="https://www.paypal.me/tiaanduplessis/1">
    <img src="https://img.shields.io/badge/$-support-green.svg?style=flat-square" alt="Donate" />
  </a>
</div>
<br>
<div align="center">
  <a href="https://github.com/tiaanduplessis/react-native-modest-cache/watchers">
    <img src="https://img.shields.io/github/watchers/tiaanduplessis/react-native-modest-cache.svg?style=social" alt="Github Watch Badge" />
  </a>
  <a href="https://github.com/tiaanduplessis/react-native-modest-cache/stargazers">
    <img src="https://img.shields.io/github/stars/tiaanduplessis/react-native-modest-cache.svg?style=social" alt="Github Star Badge" />
  </a>
  <a href="https://twitter.com/intent/tweet?text=Check%20out%20react-native-modest-cache!%20https://github.com/tiaanduplessis/react-native-modest-cache%20%F0%9F%91%8D">
    <img src="https://img.shields.io/twitter/url/https/github.com/tiaanduplessis/react-native-modest-cache.svg?style=social" alt="Tweet" />
  </a>
</div>
<br>
<div align="center">
  Built with ❤︎ by <a href="https://github.com/tiaanduplessis">Tiaan</a> and <a href="https://github.com/tiaanduplessis/react-native-modest-cache/graphs/contributors">contributors</a>
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

cache.set('foo', 5, -5) // (key, value, expiryDateInMinutes)
cache.set('bar', 90) // Default to 60 min
cache.set('baz', {hello: 'Friend'})
cache.isExpired('foo').then(console.log) // true
cache.isExpired('bar').then(console.log) // false
cache.get('foo').then(console.log) // undefined
cache.get('bar').then(console.log) // 90
cache.get('baz').then(console.log) // Object {hello: "Friend"}

cache.remove('bar')
cache.get('bar').then(console.log) // undefined

cache.set('bar', 50, {
	interval: 'year', // 'year', 'quarter', 'month', 'week', 'day', 'minute' or 'second'
	units: 2
})
cache.isExpired('bar').then(console.log) // false
cache.get('bar').then(console.log) // 50

cache.flushExpired()
cache.flush().then(() => {
	cache.get('bar').then(console.log) // undefined
})
```

## Contribute

Contributions are welcome. Please open up an issue or create PR if you would like to help out.

Note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

Licensed under the MIT License.
