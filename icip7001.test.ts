import { test, expect } from 'bun:test'
import { createPMOTag, parsePMOTags, applyPMO } from './icip7001.ts'

test('createPMOTag format', () => {
  const tag = createPMOTag(5, 10, '**bold**')
  expect(tag).toEqual(['pmo', '5:10', '**bold**'])
})

test('parsePMOTags extracts entries', () => {
  const tags = [
    ['pmo', '0:5', '**hello**'],
    ['pmo', '10:15', '_world_'],
    ['p', 'abc'],
  ]
  const entries = parsePMOTags(tags)
  expect(entries.length).toBe(2)
  expect(entries[0].startIndex).toBe(0)
  expect(entries[0].endIndex).toBe(5)
  expect(entries[0].markdown).toBe('**hello**')
})

test('applyPMO replaces text portions', () => {
  const content = 'Hello World Test'
  const entries = [
    { startIndex: 0, endIndex: 5, markdown: '**Hello**' },
    { startIndex: 6, endIndex: 11, markdown: '_World_' },
  ]
  const result = applyPMO(content, entries)
  expect(result).toBe('**Hello** _World_ Test')
})

test('applyPMO: empty entries → original content', () => {
  expect(applyPMO('hello', [])).toBe('hello')
})
