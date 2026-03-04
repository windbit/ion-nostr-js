import { test, expect } from 'bun:test'
import {
  createPollTag,
  parsePollTag,
  isPollExpired,
  createVote,
  parseVote,
} from './icip5000.ts'
import { finalizeEvent, generateSecretKey } from './pure.ts'
import { PollVote } from './kinds.ts'

test('createPollTag / parsePollTag round-trip', () => {
  const poll = { type: 'single' as const, ttl: 3600, title: 'Favorite color?', options: ['Red', 'Blue', 'Green'] }
  const tag = createPollTag(poll)
  const parsed = parsePollTag([tag])
  expect(parsed?.type).toBe('single')
  expect(parsed?.ttl).toBe(3600)
  expect(parsed?.title).toBe('Favorite color?')
  expect(parsed?.options).toEqual(['Red', 'Blue', 'Green'])
})

test('parsePollTag: no poll → null', () => {
  expect(parsePollTag([['p', 'abc']])).toBeNull()
})

test('isPollExpired: ttl 0 → never expires', () => {
  expect(isPollExpired(1000, 0, 999999999)).toBe(false)
})

test('isPollExpired: within TTL', () => {
  expect(isPollExpired(1000, 3600, 2000)).toBe(false)
})

test('isPollExpired: past TTL', () => {
  expect(isPollExpired(1000, 3600, 5000)).toBe(true)
})

test('createVote / parseVote round-trip', () => {
  const sk = generateSecretKey()
  const voteTemplate = createVote('poll-event-id', [0, 2], 'poll-author-pk')
  expect(voteTemplate.kind).toBe(PollVote)

  const event = finalizeEvent(voteTemplate, sk)
  const parsed = parseVote(event)
  expect(parsed.pollEventId).toBe('poll-event-id')
  expect(parsed.selectedOptions).toEqual([0, 2])
})
