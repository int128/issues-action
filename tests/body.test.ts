import { describe, test, expect } from 'vitest'
import { computeBody } from '../src/body.js'

const marker = '<!-- marker -->'

describe('it sholud replace content in body', () => {
  test('if body is empty, it should return content', () => {
    const content = `foo\nbar`
    expect(computeBody('', content, marker)).toBe(`\

<!-- marker -->
foo
bar
<!-- marker -->
`)
  })

  test('if body is something, it should append content', () => {
    const content = `foo\nbar`
    const before = `\
foo
bar`
    const after = `\
foo
bar
<!-- marker -->
foo
bar
<!-- marker -->
`
    expect(computeBody(before, content, marker)).toBe(after)
  })

  test('if body has marker, it should replace content', () => {
    const content = `foo\nbar`
    const before = `\
hello
<!-- marker -->
foo
<!-- marker -->
bar`
    const after = `\
hello
<!-- marker -->
foo
bar
<!-- marker -->
bar`
    expect(computeBody(before, content, marker)).toBe(after)
  })

  test('if body has marker at first, it should replace content', () => {
    const content = `foo\nbar`
    const before = `\

<!-- marker -->
foo
<!-- marker -->
bar`
    const after = `\

<!-- marker -->
foo
bar
<!-- marker -->
bar`
    expect(computeBody(before, content, marker)).toBe(after)
  })

  test('if body has marker at last, it should replace content', () => {
    const content = `foo\nbar`
    const before = `\
hello
<!-- marker -->
foo
<!-- marker -->
`
    const after = `\
hello
<!-- marker -->
foo
bar
<!-- marker -->
`
    expect(computeBody(before, content, marker)).toBe(after)
  })
})

test('it should replace body multiple times consistently', () => {
  let body = `hello`
  body = computeBody(body, 'foo', marker)
  expect(body).toBe(`\
hello
<!-- marker -->
foo
<!-- marker -->
`)
  body = computeBody(body, 'foo\nbar', marker)
  expect(body).toBe(`\
hello
<!-- marker -->
foo
bar
<!-- marker -->
`)
  body = computeBody(body, 'foo', marker)
  expect(body).toBe(`\
hello
<!-- marker -->
foo
<!-- marker -->
`)
})
