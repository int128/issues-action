import { parseIssueNumbers } from '../src/main'

describe('parseIssueNumbers', () => {
  test('a number', () => {
    expect(parseIssueNumbers('100')).toStrictEqual([100])
  })
  test('an array of numbers', () => {
    expect(parseIssueNumbers('[100, 200, 300]')).toStrictEqual([100, 200, 300])
  })
  test('not a number', () => {
    expect(() => parseIssueNumbers('"foo"')).toThrowError()
    expect(() => parseIssueNumbers('{"foo": 100}')).toThrowError()
  })
  test('not an array of numbers', () => {
    expect(() => parseIssueNumbers('[100, "foo"]')).toThrowError()
  })
  test('invalid JSON', () => {
    expect(() => parseIssueNumbers('//')).toThrowError()
  })
  test('an empty string', () => {
    expect(() => parseIssueNumbers('')).toThrowError()
  })
})
