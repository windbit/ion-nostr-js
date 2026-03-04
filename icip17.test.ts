import { test, expect } from 'bun:test'
import {
  createModifiableDM,
  createBlockUser,
  createArchiveConversation,
  createMuteUser,
  getTargetPubkey,
  getConversationId,
} from './icip17.ts'
import { ModifiableDirectMessage, BlockUser, ArchiveConversation, MuteUser } from './kinds.ts'

test('createModifiableDM: correct kind and tags', () => {
  const t = createModifiableDM({
    dTag: 'msg-uuid-v7',
    content: 'Hello!',
    recipients: [
      { pubkey: 'recip1', relay: 'wss://r.com' },
      { pubkey: 'recip2' },
    ],
    subject: 'Test',
  })
  expect(t.kind).toBe(ModifiableDirectMessage)
  expect(t.tags.find(t => t[0] === 'd')?.[1]).toBe('msg-uuid-v7')
  expect(t.tags.filter(t => t[0] === 'p').length).toBe(2)
  expect(t.tags.find(t => t[0] === 'subject')?.[1]).toBe('Test')
})

test('createModifiableDM: with parent reference', () => {
  const t = createModifiableDM({
    dTag: 'reply-uuid',
    content: 'reply',
    recipients: [{ pubkey: 'recip1' }],
    parentRef: { pubkey: 'parentpk', dTag: 'parent-d', relay: 'wss://r.com' },
  })
  const aTag = t.tags.find(t => t[0] === 'a')
  expect(aTag?.[1]).toBe('30014:parentpk:parent-d')
  expect(aTag?.[2]).toBe('wss://r.com')
})

test('createBlockUser: correct kind', () => {
  const t = createBlockUser({ targetPubkey: 'target', masterPubkey: 'master' })
  expect(t.kind).toBe(BlockUser)
  expect(t.tags.find(t => t[0] === 'b')?.[1]).toBe('master')
  expect(t.tags.find(t => t[0] === 'p')?.[1]).toBe('target')
})

test('createArchiveConversation: correct kind and h tag', () => {
  const t = createArchiveConversation({ conversationId: 'conv-123' })
  expect(t.kind).toBe(ArchiveConversation)
  expect(t.tags.find(t => t[0] === 'h')?.[1]).toBe('conv-123')
})

test('createMuteUser: correct kind', () => {
  const t = createMuteUser({ targetPubkey: 'target', content: 'too noisy' })
  expect(t.kind).toBe(MuteUser)
  expect(t.content).toBe('too noisy')
})

test('getTargetPubkey extracts p tag', () => {
  const t = createBlockUser({ targetPubkey: 'victim' })
  expect(getTargetPubkey(t)).toBe('victim')
})

test('getConversationId extracts h tag', () => {
  const t = createArchiveConversation({ conversationId: 'conv-456' })
  expect(getConversationId(t)).toBe('conv-456')
})
