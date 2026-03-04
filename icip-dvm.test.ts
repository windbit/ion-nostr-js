import { test, expect } from 'bun:test'
import {
  createHashtagStatsRequest,
  parseHashtagStatsResponse,
  createPriceChangeRequest,
  parsePriceChangeResponse,
  createTokenStatsRequest,
  parseTokenStatsResponse,
  createBuyingActivityRequest,
  parseBuyingActivityResponse,
} from './icip-dvm.ts'
import {
  DVMHashtagStats,
  DVMPriceChanges,
  DVMTokenStats,
  DVMBuyingActivity,
} from './kinds.ts'

// --- Hashtag Stats ---

test('createHashtagStatsRequest: basic', () => {
  const t = createHashtagStatsRequest()
  expect(t.kind).toBe(DVMHashtagStats)
})

test('createHashtagStatsRequest: with prefix and limit', () => {
  const t = createHashtagStatsRequest('crypto', 20)
  expect(t.tags.find(t => t[0] === 'i')?.[1]).toBe('crypto')
  expect(t.tags.find(t => t[0] === 'param')?.[2]).toBe('20')
})

test('parseHashtagStatsResponse', () => {
  const event = {
    kind: 6175, tags: [], content: '["bitcoin","nostr","ion"]',
    created_at: 0, pubkey: 'pk', id: 'id', sig: 'sig',
  }
  const hashtags = parseHashtagStatsResponse(event as any)
  expect(hashtags).toEqual(['bitcoin', 'nostr', 'ion'])
})

// --- Price Changes ---

test('createPriceChangeRequest', () => {
  const t = createPriceChangeRequest({
    tokenRef: '31175:pk:d',
    timeWindow: 3600,
    deltaPercentage: 5.0,
  })
  expect(t.kind).toBe(DVMPriceChanges)
  expect(t.tags.find(t => t[1] === 'token')?.[2]).toBe('31175:pk:d')
})

test('parsePriceChangeResponse: empty', () => {
  const event = {
    kind: 6176, tags: [], content: '',
    created_at: 0, pubkey: 'pk', id: 'id', sig: 'sig',
  }
  expect(parsePriceChangeResponse(event as any)).toEqual([])
})

// --- Token Stats ---

test('createTokenStatsRequest', () => {
  const t = createTokenStatsRequest()
  expect(t.kind).toBe(DVMTokenStats)
  expect(t.tags[0]).toEqual(['i', 'trending', 'text'])
})

test('parseTokenStatsResponse', () => {
  const events = [{ kind: 1175, tags: [], content: '', created_at: 0, pubkey: 'pk', id: 'id', sig: 'sig' }]
  const event = {
    kind: 6177, tags: [], content: JSON.stringify(events),
    created_at: 0, pubkey: 'pk', id: 'id', sig: 'sig',
  }
  const parsed = parseTokenStatsResponse(event as any)
  expect(parsed.length).toBe(1)
  expect(parsed[0].kind).toBe(1175)
})

// --- Buying Activity ---

test('createBuyingActivityRequest', () => {
  const t = createBuyingActivityRequest('author-pk')
  expect(t.kind).toBe(DVMBuyingActivity)
  expect(t.tags.find(t => t[1] === 'author')?.[2]).toBe('author-pk')
})

test('parseBuyingActivityResponse: with buying-activity tag', () => {
  const event = {
    kind: 6178,
    tags: [['buying-activity', '42', '3600']],
    content: '[]',
    created_at: 0, pubkey: 'pk', id: 'id', sig: 'sig',
  }
  const parsed = parseBuyingActivityResponse(event as any)
  expect(parsed.events).toEqual([])
  expect(parsed.buyingActivity?.userCount).toBe('42')
  expect(parsed.buyingActivity?.timeWindow).toBe('3600')
})
