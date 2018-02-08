'use strict'

import storage from 'react-native-modest-storage'

const prefix = 'cache-'
const expire = 'cache-expire-'

/**
 * Utility function to add units to date based on interval
 * @param {Date} date
 * @param {String} interval
 * @param {Number} units
 */
function dateAdd (date, interval, units) {
  let result = new Date(date)

  switch (interval.toLowerCase()) {
    case 'year':
      result.setFullYear(result.getFullYear() + units)
      break
    case 'quarter':
      result.setMonth(result.getMonth() + 3 * units)
      break
    case 'month':
      result.setMonth(result.getMonth() + units)
      break
    case 'week':
      result.setDate(result.getDate() + 7 * units)
      break
    case 'day':
      result.setDate(result.getDate() + units)
      break
    case 'hour':
      result.setTime(result.getTime() + units * 3600000)
      break
    case 'minute':
      result.setTime(result.getTime() + units * 60000)
      break
    case 'second':
      result.setTime(result.getTime() + units * 1000)
      break
    default:
      result = undefined
      break
  }
  return result
}

/**
 * Persist value and expire date of cache.
 *
 * @param {string} key
 * @param {Any} value Value to persist
 * @param {Number or Object} [time=60]  Time in minutes
 * @returns {Promise}
 */
function set (key, value, time = 60) {
  let expireTime
  const cacheKey = `${prefix}${key}`
  const expireKey = `${expire}${key}`

  if (typeof time === 'number') {
    expireTime = dateAdd(Date.now(), 'minute', time)
  } else if (time !== null && typeof time === 'object' && time.interval && time.units) {
    expireTime = dateAdd(Date.now(), time.interval, time.units)
  } else {
    throw new Error('Invalid time provided for set')
  }

  return storage.set(expireKey, expireTime).then(() => storage.set(cacheKey, value))
}

/**
 * Remove cached value from storage
 * @param {String} key
 */
function remove (key) {
  if (typeof key !== 'string') {
    throw new Error('Invalid key provided for remove')
  }

  const keys = [`${prefix}${key}`, `${expire}${key}`]
  return storage.remove(keys)
}

/**
 * Determine if cache has expired
 * @param {String} key
 */
function isExpired (key) {
  const expireKey = `${expire}${key}`
  return storage
    .get(expireKey)
    .then(time => Promise.resolve(Date.now() >= new Date(time).getTime(), time))
}

/**
 * Retrieve value from cache. Remove if expired.
 * @param {String} key
 */
function get (key) {
  return isExpired(key).then(hasExpired => {
    if (hasExpired) {
      return remove(key).then(() => Promise.resolve(undefined))
    } else {
      return storage.get(`${prefix}${key}`)
    }
  })
}

/**
 * Remove all cached values from storage
 */
function flush () {
  return storage.keys().then(keys => {
    return storage.remove(
      keys.filter(key => key.indexOf(prefix) === 0 || key.indexOf(expire) === 0)
     )
  })
}

/**
 * Remove all expired values from storage
 */
function flushExpired () {
  return storage.keys().then(keys => {
    const cacheKeys = keys.filter(key => key.indexOf(expire) === 0)
    return Promise.all(cacheKeys.map(key => get(key.slice(prefix.length))))
  })
}

export default {
  set,
  get,
  remove,
  isExpired,
  flush,
  flushExpired,
  storage
}
