import { describe, expect, it } from 'vitest'
import { insertContentIntoBody } from '../src/body.js'

const marker = '<!-- marker -->'

describe('insertContentIntoBody', () => {
  describe('when the body is empty', () => {
    it('returns a wrapped content', () => {
      const content = `foo\nbar`
      expect(insertContentIntoBody('', content, marker)).toBe(`\

<!-- marker -->
foo
bar
<!-- marker -->
`)
    })
  })

  describe('when the body has a string', () => {
    it('appends the content', () => {
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
      expect(insertContentIntoBody(before, content, marker)).toBe(after)
    })
  })

  describe('when the body has a marker', () => {
    it('replaces the content', () => {
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
      expect(insertContentIntoBody(before, content, marker)).toBe(after)
    })
  })

  describe('when the body has a marker at the first', () => {
    it('replaces the content', () => {
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
      expect(insertContentIntoBody(before, content, marker)).toBe(after)
    })
  })

  describe('when the body has a marker at the last', () => {
    it('replaces the content', () => {
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
      expect(insertContentIntoBody(before, content, marker)).toBe(after)
    })
  })

  describe('when the body has multiple markers', () => {
    it('replaces the content consistently', () => {
      let body = `hello`
      body = insertContentIntoBody(body, 'foo', marker)
      expect(body).toBe(`\
hello
<!-- marker -->
foo
<!-- marker -->
`)
      body = insertContentIntoBody(body, 'foo\nbar', marker)
      expect(body).toBe(`\
hello
<!-- marker -->
foo
bar
<!-- marker -->
`)
      body = insertContentIntoBody(body, 'foo', marker)
      expect(body).toBe(`\
hello
<!-- marker -->
foo
<!-- marker -->
`)
    })
  })
})
