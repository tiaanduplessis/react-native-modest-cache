import dateAdd from './date-add'

class ModestCache {
  constructor ({ prefix = 'cache-', expire = 'cache-expire-', storage = require('react-native-modest-storage') } = {}) {
    this.prefix = prefix
    this.expire = expire
    this.storage = storage
  }

  /**
   * Persist value and expire date of cache.
   *
   * @param {string} key
   * @param {Any} value Value to persist
   * @param {Number or Object} [time=60]  Time in minutes
   * @returns {Promise}
   */
  set (key, value, time = 60) {
    let expireTime
    const cacheKey = `${this.prefix}${key}`
    const expireKey = `${this.expire}${key}`

    if (typeof time === 'number') {
      expireTime = dateAdd(Date.now(), 'minute', time)
    } else if (time !== null && typeof time === 'object' && time.interval && time.units) {
      expireTime = dateAdd(Date.now(), time.interval, time.units)
    } else {
      throw new Error('Invalid time provided for set')
    }

    return this.storage.set(expireKey, expireTime).then(() => this.storage.set(cacheKey, value))
  }

  /**
   * Remove cached value from storage
   * @param {String} key
   */
  remove (key) {
    if (typeof key !== 'string') {
      throw new Error('Invalid key provided for remove')
    }

    const keys = [`${this.prefix}${key}`, `${this.expire}${key}`]
    return this.storage.remove(keys)
  }

  /**
   * Determine if cache has expired
   * @param {String} key
   */
  isExpired (key) {
    const expireKey = `${this.expire}${key}`
    return this.storage
      .get(expireKey)
      .then(time => Promise.resolve(Date.now() >= new Date(time).getTime(), time))
  }

  /**
   * Retrieve value from cache. Remove if expired.
   * @param {String} key
   */
  get (key) {
    return this.isExpired(key).then(hasExpired => {
      if (hasExpired) {
        return this.remove(key).then(() => Promise.resolve(undefined))
      } else {
        return this.storage.get(`${this.prefix}${key}`)
      }
    })
  }

  /**
   * Remove all cached values from storage
   */
  flush () {
    return this.storage.keys().then(keys => {
      return this.storage.remove(
        keys.filter(key => key.indexOf(this.prefix) === 0 || key.indexOf(this.expire) === 0)
      )
    })
  }

  /**
   * Remove all expired values from storage
   */
  flushExpired () {
    return this.storage.keys().then(keys => {
      const cacheKeys = keys.filter(key => key.indexOf(this.expire) === 0)
      return Promise.all(cacheKeys.map(key => this.get(key.slice(this.prefix.length))))
    })
  }
}

export default ModestCache
