
# react-native-modest-cache
[![package version](https://img.shields.io/npm/v/react-native-modest-cache.svg?style=flat-square)](https://npmjs.org/package/react-native-modest-cache)
[![package downloads](https://img.shields.io/npm/dm/react-native-modest-cache.svg?style=flat-square)](https://npmjs.org/package/react-native-modest-cache)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![package license](https://img.shields.io/npm/l/react-native-modest-cache.svg?style=flat-square)](https://npmjs.org/package/react-native-modest-cache)
[![make a pull request](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

> Simple cache for AsyncStorage

## Table of Contents

- [About](#about)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#License)

## About

This module is a wrapper around [react-native-modest-storage](https://github.com/tiaanduplessis/react-native-modest-storage) that extends it for handling cached values.


## Install

This project uses [node](https://nodejs.org) and [npm](https://www.npmjs.com). 

```sh
$ npm install react-native-modest-cache
$ # OR
$ yarn add react-native-modest-cache
```

## Usage

```js
import ModestCache from 'react-native-modest-cache'

const cache = new ModestCache()

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

1. Fork it and create your feature branch: git checkout -b my-new-feature
2. Commit your changes: git commit -am 'Add some feature'
3. Push to the branch: git push origin my-new-feature 
4. Submit a pull request

## License

MIT
    