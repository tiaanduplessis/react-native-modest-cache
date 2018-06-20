import dateAdd from '../date-add'

test('should add units to date', () => {
  const d = new Date('01/26/2019')

  expect(dateAdd(d, 'year', 1).getFullYear()).toBe(2020)
  expect(dateAdd(d, 'day', 1).getDate()).toBe(27)
})
