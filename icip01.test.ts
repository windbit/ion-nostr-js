import { test, expect } from 'bun:test'
import {
  createModifiableNote,
  parseModifiableNote,
  isEditingAllowed,
  createStoryNote,
  createQTag,
  parseQTag,
  getQTags,
  parseIONProfile,
  mergeIONProfile,
  createEphemeralEmbed,
  parseEphemeralEmbed,
} from './icip01.ts'
import { finalizeEvent, generateSecretKey } from './pure.ts'
import { ModifiableNote, StoryNote, EphemeralEventEmbed } from './kinds.ts'

// --- Modifiable Note ---

test('createModifiableNote produces correct kind and tags', () => {
  const t = createModifiableNote({
    content: 'hello',
    dTag: '01946ef2-e9ec-7524-8e80-7cd58f0bab14',
    publishedAt: 1296962229,
    editingEndedAt: 1297962229,
  })
  expect(t.kind).toBe(ModifiableNote)
  expect(t.tags.find(t => t[0] === 'd')?.[1]).toBe('01946ef2-e9ec-7524-8e80-7cd58f0bab14')
  expect(t.tags.find(t => t[0] === 'published_at')?.[1]).toBe('1296962229')
  expect(t.tags.find(t => t[0] === 'editing_ended_at')?.[1]).toBe('1297962229')
})

test('parseModifiableNote round-trip', () => {
  const sk = generateSecretKey()
  const event = finalizeEvent(
    createModifiableNote({ content: 'test', dTag: 'abc', publishedAt: 1000, editingEndedAt: 2000 }),
    sk,
  )
  const parsed = parseModifiableNote(event)
  expect(parsed.dTag).toBe('abc')
  expect(parsed.publishedAt).toBe(1000)
  expect(parsed.editingEndedAt).toBe(2000)
  expect(parsed.content).toBe('test')
})

test('isEditingAllowed: no end time → always allowed', () => {
  const sk = generateSecretKey()
  const event = finalizeEvent(
    createModifiableNote({ content: 'test', dTag: 'abc', publishedAt: 1000 }),
    sk,
  )
  expect(isEditingAllowed(event, 9999999999)).toBe(true)
})

test('isEditingAllowed: before deadline → allowed', () => {
  const sk = generateSecretKey()
  const event = finalizeEvent(
    createModifiableNote({ content: 'test', dTag: 'abc', publishedAt: 1000, editingEndedAt: 2000 }),
    sk,
  )
  expect(isEditingAllowed(event, 1500)).toBe(true)
})

test('isEditingAllowed: after deadline → not allowed', () => {
  const sk = generateSecretKey()
  const event = finalizeEvent(
    createModifiableNote({ content: 'test', dTag: 'abc', publishedAt: 1000, editingEndedAt: 2000 }),
    sk,
  )
  expect(isEditingAllowed(event, 2500)).toBe(false)
})

// --- Story Note ---

test('createStoryNote produces correct kind', () => {
  const t = createStoryNote({ content: 'My story' })
  expect(t.kind).toBe(StoryNote)
})

// --- Q tag ---

test('createQTag / parseQTag round-trip', () => {
  const tag = createQTag(30175, 'a695f6b60119d9521934a691347d9f78e8770b56da16bb255ee286ddf9fda919', '01946ef2', 'wss://relay.example.com')
  expect(tag[0]).toBe('Q')
  const parsed = parseQTag(tag)
  expect(parsed?.kind).toBe(30175)
  expect(parsed?.pubkey).toBe('a695f6b60119d9521934a691347d9f78e8770b56da16bb255ee286ddf9fda919')
  expect(parsed?.dTag).toBe('01946ef2')
  expect(parsed?.relayUrl).toBe('wss://relay.example.com')
})

test('getQTags extracts Q tags from event', () => {
  const event = {
    kind: 1, tags: [['Q', '30175:pk:dtag', 'wss://r.com', 'pk'], ['e', 'other']],
    content: '', created_at: 0, pubkey: '', id: '', sig: '',
  }
  const qTags = getQTags(event as any)
  expect(qTags.length).toBe(1)
  expect(qTags[0].kind).toBe(30175)
})

// --- Extended Profile ---

test('parseIONProfile extracts ION fields', () => {
  const content = JSON.stringify({
    name: 'Alice',
    about: 'hi',
    location: 'NYC',
    registered_at: 1700000000,
    category: 'developer',
    wallets: { ethereum: '0xabc' },
    who_can_message_you: 'follows',
  })
  const extras = parseIONProfile(content)
  expect(extras.location).toBe('NYC')
  expect(extras.registered_at).toBe(1700000000)
  expect(extras.wallets?.ethereum).toBe('0xabc')
  expect(extras.who_can_message_you).toBe('follows')
})

test('mergeIONProfile merges extras into existing content', () => {
  const existing = JSON.stringify({ name: 'Alice' })
  const merged = mergeIONProfile(existing, { location: 'London', category: 'artist' })
  const data = JSON.parse(merged)
  expect(data.name).toBe('Alice')
  expect(data.location).toBe('London')
  expect(data.category).toBe('artist')
})

// --- Ephemeral Embed ---

test('createEphemeralEmbed / parseEphemeralEmbed round-trip', () => {
  const embedded = {
    kind: 10002, tags: [['r', 'wss://example.com']],
    content: '', created_at: 1700000000, pubkey: 'pk', id: 'eid', sig: 'esig',
  }
  const template = createEphemeralEmbed({
    embeddedEvent: embedded as any,
    reference: { type: 'e', id: 'b3e392b1' },
    masterPubkey: 'masterpk',
  })
  expect(template.kind).toBe(EphemeralEventEmbed)

  const mockEvent = { ...template, pubkey: 'pk', id: 'id', sig: 'sig' }
  const parsed = parseEphemeralEmbed(mockEvent as any)
  expect(parsed.embeddedEvent.kind).toBe(10002)
  expect(parsed.referenceId).toBe('b3e392b1')
  expect(parsed.masterPubkey).toBe('masterpk')
})
