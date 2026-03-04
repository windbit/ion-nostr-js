import { test, expect } from 'bun:test'
import { createChatsListEvent, parseChatsListEvent, addChat, removeChat } from './icip51.ts'
import { ChatsList } from './kinds.ts'

test('createChatsListEvent: correct kind and tags', () => {
  const t = createChatsListEvent(['conv-1', 'conv-2'])
  expect(t.kind).toBe(ChatsList)
  expect(t.tags).toEqual([['h', 'conv-1'], ['h', 'conv-2']])
  expect(t.content).toBe('')
})

test('createChatsListEvent: with encrypted content', () => {
  const t = createChatsListEvent(['conv-1'], 'encrypted-data')
  expect(t.content).toBe('encrypted-data')
})

test('parseChatsListEvent: extracts h tags', () => {
  const event = {
    kind: ChatsList, tags: [['h', 'c1'], ['h', 'c2'], ['p', 'pk']],
    content: '', created_at: 0, pubkey: 'pk', id: 'id', sig: 'sig',
  }
  const ids = parseChatsListEvent(event as any)
  expect(ids).toEqual(['c1', 'c2'])
})

test('parseChatsListEvent: wrong kind throws', () => {
  const event = {
    kind: 1, tags: [], content: '', created_at: 0, pubkey: 'pk', id: 'id', sig: 'sig',
  }
  expect(() => parseChatsListEvent(event as any)).toThrow()
})

test('addChat adds h tag', () => {
  const t = createChatsListEvent(['c1'])
  const updated = addChat(t, 'c2')
  expect(updated.tags.filter(t => t[0] === 'h').length).toBe(2)
})

test('removeChat removes h tag', () => {
  const t = createChatsListEvent(['c1', 'c2'])
  const updated = removeChat(t, 'c1')
  expect(updated.tags.filter(t => t[0] === 'h').length).toBe(1)
  expect(updated.tags.find(t => t[1] === 'c2')).toBeDefined()
})
