import { test, expect } from 'bun:test'
import {
  getPureNostrKind,
  createPureNostrEmbed,
  extractPureNostrEvent,
  hasPureNostrEquivalent,
} from './icip10000.ts'
import { EphemeralEventEmbed } from './kinds.ts'

test('getPureNostrKind: maps 30175 → 1', () => {
  expect(getPureNostrKind(30175)).toBe(1)
})

test('getPureNostrKind: unmapped kind returns itself', () => {
  expect(getPureNostrKind(7)).toBe(7)
})

test('hasPureNostrEquivalent', () => {
  expect(hasPureNostrEquivalent(30175)).toBe(true)
  expect(hasPureNostrEquivalent(42)).toBe(false)
})

test('createPureNostrEmbed / extractPureNostrEvent round-trip', () => {
  const sourceEvent = {
    kind: 30175, tags: [['d', 'test']], content: 'hello',
    created_at: 1000, pubkey: 'pk1', id: 'src-id', sig: 'sig1',
  }
  const pureEvent = {
    kind: 1, tags: [], content: 'hello',
    created_at: 1000, pubkey: 'pk2', id: 'pure-id', sig: 'sig2',
  }

  const embed = createPureNostrEmbed(sourceEvent as any, pureEvent as any, 'master-pk')
  expect(embed.kind).toBe(EphemeralEventEmbed)
  expect(embed.tags.find(t => t[0] === 'b')?.[1]).toBe('master-pk')
  expect(embed.tags.find(t => t[0] === 'e')?.[1]).toBe('src-id')

  const mockEmbed = { ...embed, pubkey: 'pk', id: 'id', sig: 'sig' }
  const extracted = extractPureNostrEvent(mockEmbed as any)
  expect(extracted.kind).toBe(1)
  expect(extracted.content).toBe('hello')
})
