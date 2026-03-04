import { test, expect } from 'bun:test'
import { createRichTextTag, parseRichText, parseQuillDelta } from './icip7000.ts'

test('createRichTextTag / parseRichText round-trip', () => {
  const delta = JSON.stringify({ ops: [{ insert: 'Hello ' }, { insert: 'World', attributes: { bold: true } }] })
  const tag = createRichTextTag(delta)
  expect(tag[0]).toBe('rich_text')
  expect(tag[1]).toBe('quill_delta')

  const parsed = parseRichText([tag])
  expect(parsed?.protocol).toBe('quill_delta')
  expect(parsed?.content).toBe(delta)
})

test('parseRichText: missing → null', () => {
  expect(parseRichText([['p', 'abc']])).toBeNull()
})

test('parseQuillDelta parses JSON', () => {
  const delta = { ops: [{ insert: 'test\n' }] }
  const tag = createRichTextTag(JSON.stringify(delta))
  const parsed = parseQuillDelta([tag])
  expect(parsed.ops[0].insert).toBe('test\n')
})

test('parseQuillDelta: wrong protocol → null', () => {
  const tag = ['rich_text', 'unknown_protocol', '{}']
  expect(parseQuillDelta([tag])).toBeNull()
})
