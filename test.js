const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

// Optional paths let the same suite check an unpacked npm artifact and older
// storage wrappers. Only AsyncStorage is mocked; no React Native or network runs.
const cachePath = process.argv[2] || path.join(__dirname, 'index.js')
const storagePath = process.argv[3] || require.resolve('react-native-modest-storage')
const cacheSource = fs.readFileSync(cachePath, 'utf8')
const storageSource = fs.readFileSync(storagePath, 'utf8')
const initialTime = Date.UTC(2026, 0, 1)
const tests = []

function test (name, run) {
  tests.push({ name, run })
}

function createCache (options = {}) {
  const items = new Map()
  const removals = []
  const reads = []
  const clock = { now: initialTime }
  class FixedDate extends Date {
    constructor (...args) {
      super(...(args.length ? args : [clock.now]))
    }

    static now () { return clock.now }
  }

  const AsyncStorage = {
    getItem (key) {
      reads.push(key)
      if (options.readError && key === options.readErrorKey) {
        return Promise.reject(options.readError)
      }
      return Promise.resolve(items.has(key) ? items.get(key) : null)
    },
    setItem (key, value) {
      items.set(key, value)
      return Promise.resolve()
    },
    getAllKeys () {
      if (options.keysError) return Promise.reject(options.keysError)
      return Promise.resolve(Array.from(items.keys()))
    },
    multiRemove (keys) {
      removals.push(Array.from(keys))
      if (options.removeError) return Promise.reject(options.removeError)
      const remove = () => keys.forEach(key => items.delete(key))
      if (options.deferRemoval) return options.deferRemoval(remove)
      remove()
      return Promise.resolve()
    }
  }

  // Adapt module syntax only. Execute the real storage implementation against
  // the in-memory native boundary, including its JSON/null conversion behavior.
  const storageContext = {
    module: { exports: {} },
    AsyncStorage,
    require (name) {
      assert.strictEqual(name, 'react-native', 'Unexpected dependency in storage')
      return { AsyncStorage }
    }
  }
  vm.runInNewContext(storageSource
    .replace("import { AsyncStorage } from 'react-native'", '')
    .replace('export default', 'module.exports ='), storageContext,
  { filename: storagePath, timeout: 1000 })

  const context = {
    module: { exports: {} },
    storage: storageContext.module.exports,
    Date: FixedDate
  }
  vm.runInNewContext(cacheSource
    .replace("import storage from 'react-native-modest-storage'", '')
    .replace('export default', 'module.exports ='), context,
  { filename: cachePath, timeout: 1000 })

  return { cache: context.module.exports, items, removals, reads, clock }
}

async function rejectsWith (promise, expected) {
  let rejected = false
  try {
    await promise
  } catch (error) {
    rejected = true
    assert.strictEqual(error, expected)
  }
  assert.strictEqual(rejected, true, 'Expected rejection')
}

test('empty storage completes without removing anything', async () => {
  const { cache, items, removals } = createCache()
  assert.deepStrictEqual(Array.from(await cache.flushExpired()), [])
  assert.strictEqual(items.size, 0)
  assert.deepStrictEqual(removals, [])
})

test('removes expired pairs while preserving active pairs and unrelated data', async () => {
  const { cache, items, removals } = createCache()
  await cache.set('expired', 'old', -5)
  await cache.set('active', 'new', 60)
  await cache.storage.set('unrelated', { keep: true })
  const activeExpiry = items.get('cache-expire-active')
  const activeValue = items.get('cache-active')
  const unrelated = items.get('unrelated')

  const results = await cache.flushExpired()

  // Check the underlying keys before get() can perform its own lazy cleanup.
  assert.strictEqual(items.has('cache-expired'), false)
  assert.strictEqual(items.has('cache-expire-expired'), false)
  assert.strictEqual(items.get('cache-expire-active'), activeExpiry)
  assert.strictEqual(items.get('cache-active'), activeValue)
  assert.strictEqual(items.get('unrelated'), unrelated)
  assert.deepStrictEqual(removals, [['cache-expired', 'cache-expire-expired']])
  assert.deepStrictEqual(Array.from(results), [undefined, 'new'])
  assert.strictEqual(await cache.isExpired('active'), false)
  assert.strictEqual(await cache.get('active'), 'new')
})

test('retains all active values and their expiry metadata', async () => {
  const { cache, items, removals } = createCache()
  await cache.set('object', { nested: ['value'] }, 60)
  await cache.set('zero', 0, 60)
  await cache.set('false', false, 60)
  const before = Array.from(items)
  await cache.flushExpired()
  assert.deepStrictEqual(Array.from(items), before)
  assert.deepStrictEqual(removals, [])
})

test('negative and zero durations expire immediately; positive durations remain', async () => {
  const { cache, items } = createCache()
  await cache.set('negative', 'old', -5)
  await cache.set('zero', 'now', 0)
  await cache.set('positive', 'later', 60)
  await cache.flushExpired()
  assert.deepStrictEqual(Array.from(items.keys()), ['cache-expire-positive', 'cache-positive'])
})

test('expires at the exact boundary, but not one millisecond before it', async () => {
  const { cache, items, clock } = createCache()
  await cache.set('boundary', 'value', 1 / 60000)
  await cache.flushExpired()
  assert.strictEqual(items.size, 2)
  clock.now += 1
  await cache.flushExpired()
  assert.strictEqual(items.size, 0)
})

test('expires entries after their boundary', async () => {
  const { cache, items, clock } = createCache()
  await cache.set('past', 'value', 1)
  clock.now += 60001
  await cache.flushExpired()
  assert.strictEqual(items.size, 0)
})

test('preserves default and interval-object expiry behavior', async () => {
  const { cache, items, clock } = createCache()
  await cache.set('default', 'hour')
  await cache.set('interval', 'second', { interval: 'second', units: 1 })
  clock.now += 1000
  await cache.flushExpired()
  assert.deepStrictEqual(Array.from(items.keys()), ['cache-expire-default', 'cache-default'])
  clock.now = initialTime + 3600000
  await cache.flushExpired()
  assert.strictEqual(items.size, 0)
})

test('ignores values without expiry metadata and non-cache prefixes', async () => {
  const { cache, items, removals, reads } = createCache()
  await cache.storage.set('cache-orphan', 'no metadata')
  await cache.storage.set('other-cache-expire-key', 'keep')
  await cache.storage.set('cache-expire', 'keep')
  await cache.storage.set('cache-expiry-key', 'keep')
  const before = Array.from(items)
  await cache.flushExpired()
  assert.deepStrictEqual(Array.from(items), before)
  assert.deepStrictEqual(removals, [])
  assert.deepStrictEqual(reads, [])
})

test('cleans up expired metadata whose value is already missing', async () => {
  const { cache, items } = createCache()
  await cache.storage.set('cache-expire-missing', new Date(initialTime - 1))
  await cache.flushExpired()
  assert.strictEqual(items.size, 0)
})

test('strips only the leading expiry prefix from logical keys', async () => {
  const { cache, items } = createCache()
  for (const key of ['', 'cache-foo', 'foo-cache-expire-bar', 'spaces and /slashes']) {
    await cache.set(key, 'expired value', -1)
  }
  await cache.flushExpired()
  assert.strictEqual(items.size, 0)
})

test('preserves an active expire-prefixed key without inventing another prefix', async () => {
  const { cache, items } = createCache()
  // The existing schema cannot represent both foo and expire-foo safely.
  // This single non-colliding key checks prefix slicing, not a schema migration.
  await cache.set('expire-foo', 'ordinary non-date value', 60)
  const before = Array.from(items)
  await cache.flushExpired()
  assert.deepStrictEqual(Array.from(items), before)
  assert.strictEqual(await cache.get('expire-foo'), 'ordinary non-date value')
})

test('removes an expired expire-prefixed key and its own metadata', async () => {
  const { cache, items, removals } = createCache()
  await cache.set('expire-foo', 'ordinary non-date value', -1)
  await cache.flushExpired()
  assert.strictEqual(items.size, 0)
  assert.deepStrictEqual(removals, [['cache-expire-foo', 'cache-expire-expire-foo']])
})

test('repeated cleanup is harmless and later expiry still works', async () => {
  const { cache, items, removals, clock } = createCache()
  await cache.set('old', 'expired', -1)
  await cache.set('fresh', 'active', 1)
  await cache.flushExpired()
  const before = Array.from(items)
  await cache.flushExpired()
  assert.deepStrictEqual(Array.from(items), before)
  assert.strictEqual(removals.length, 1)
  clock.now += 60000
  await cache.flushExpired()
  await cache.flushExpired()
  assert.strictEqual(items.size, 0)
  assert.strictEqual(removals.length, 2)
})

test('propagates key enumeration errors without removing data', async () => {
  const error = new Error('keys failed')
  const { cache, items, removals } = createCache({ keysError: error })
  await cache.set('old', 'value', -1)
  const before = Array.from(items)
  await rejectsWith(cache.flushExpired(), error)
  assert.deepStrictEqual(Array.from(items), before)
  assert.deepStrictEqual(removals, [])
})

test('propagates expiry-read errors without removing the affected pair', async () => {
  const error = new Error('read failed')
  const { cache, items, removals } = createCache({ readError: error, readErrorKey: 'cache-expire-old' })
  await cache.set('old', 'value', -1)
  const before = Array.from(items)
  await rejectsWith(cache.flushExpired(), error)
  assert.deepStrictEqual(Array.from(items), before)
  assert.deepStrictEqual(removals, [])
})

test('propagates removal errors and allows retry', async () => {
  const error = new Error('remove failed')
  const options = { removeError: error }
  const { cache, items, removals } = createCache(options)
  await cache.set('old', 'value', -1)
  const before = Array.from(items)
  await rejectsWith(cache.flushExpired(), error)
  assert.deepStrictEqual(Array.from(items), before)
  assert.deepStrictEqual(removals, [['cache-old', 'cache-expire-old']])
  options.removeError = null
  await cache.flushExpired()
  assert.strictEqual(items.size, 0)
})

test('propagates active-value read errors without invalidating the entry', async () => {
  const error = new Error('value read failed')
  const { cache, items, removals } = createCache({ readError: error, readErrorKey: 'cache-active' })
  await cache.set('active', 'value', 60)
  const before = Array.from(items)
  await rejectsWith(cache.flushExpired(), error)
  assert.deepStrictEqual(Array.from(items), before)
  assert.deepStrictEqual(removals, [])
})

test('waits for asynchronous removal before resolving', async () => {
  let release
  let started
  const removalStarted = new Promise(resolve => { started = resolve })
  const { cache, items } = createCache({
    deferRemoval: remove => new Promise(resolve => {
      release = () => { remove(); resolve() }
      started()
    })
  })
  await cache.set('old', 'value', -1)
  let complete = false
  const pending = cache.flushExpired().then(() => { complete = true })
  await removalStarted
  await Promise.resolve()
  assert.strictEqual(complete, false)
  assert.strictEqual(items.size, 2)
  release()
  await pending
  assert.strictEqual(complete, true)
  assert.strictEqual(items.size, 0)
})

;(async () => {
  let failures = 0
  for (const { name, run } of tests) {
    let timer
    try {
      await Promise.race([
        Promise.resolve().then(run),
        new Promise((resolve, reject) => {
          timer = setTimeout(() => reject(new Error('Test timed out')), 3000)
        })
      ])
      console.log(`ok - ${name}`)
    } catch (error) {
      failures += 1
      console.error(`not ok - ${name}`)
      console.error(error)
    } finally {
      clearTimeout(timer)
    }
  }
  console.log(`${tests.length - failures}/${tests.length} tests passed`)
  if (failures) process.exitCode = 1
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
