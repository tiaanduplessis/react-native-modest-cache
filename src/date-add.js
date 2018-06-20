/**
* Utility function to add units to date based on interval
* @param {Date} date
* @param {String} interval
* @param {Number} units
*/
export default function dateAdd (date, interval, units) {
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
