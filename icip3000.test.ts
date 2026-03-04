import { test, expect } from 'bun:test'
import {
  createCommunityDefinition,
  parseCommunityDefinition,
  createCommunityJoin,
  createCommunityTransfer,
  createCommunityBan,
  createCommunityChange,
  getCommunityId,
  hasRole,
  isAdmin,
} from './icip3000.ts'
import { finalizeEvent, generateSecretKey, getPublicKey } from './pure.ts'
import { IONCommunityDefinition, CommunityJoin, CommunityTransfer, CommunityBan, CommunityChange } from './kinds.ts'

const communityId = '01946ef2-e9ec-7524-8e80-7cd58f0bab14'

test('createCommunityDefinition: correct kind and tags', () => {
  const t = createCommunityDefinition({
    id: communityId,
    name: 'Test Community',
    description: 'A test',
    openness: 'open',
    visibility: 'public',
    members: [
      { pubkey: 'admin1', role: 'admin' },
      { pubkey: 'mod1', role: 'moderator', relay: 'wss://r.com' },
    ],
  })
  expect(t.kind).toBe(IONCommunityDefinition)
  expect(t.tags.find(t => t[0] === 'h')?.[1]).toBe(communityId)
  expect(t.tags.find(t => t[0] === 'name')?.[1]).toBe('Test Community')
  expect(t.tags.filter(t => t[0] === 'p').length).toBe(2)
})

test('parseCommunityDefinition round-trip', () => {
  const sk = generateSecretKey()
  const event = finalizeEvent(
    createCommunityDefinition({
      id: communityId,
      name: 'My Community',
      description: 'desc',
      openness: 'closed',
      visibility: 'private',
      members: [
        { pubkey: 'admin1', role: 'admin' },
        { pubkey: 'mod1', role: 'moderator' },
      ],
    }),
    sk,
  )
  const parsed = parseCommunityDefinition(event)
  expect(parsed.id).toBe(communityId)
  expect(parsed.name).toBe('My Community')
  expect(parsed.openness).toBe('closed')
  expect(parsed.visibility).toBe('private')
  expect(parsed.admins).toEqual(['admin1'])
  expect(parsed.moderators).toEqual(['mod1'])
})

test('createCommunityJoin: correct kind', () => {
  const t = createCommunityJoin(communityId)
  expect(t.kind).toBe(CommunityJoin)
  expect(getCommunityId(t)).toBe(communityId)
})

test('createCommunityTransfer: correct tags', () => {
  const t = createCommunityTransfer(communityId, 'new-owner-pk')
  expect(t.kind).toBe(CommunityTransfer)
  expect(t.tags.find(t => t[0] === 'p')?.[1]).toBe('new-owner-pk')
})

test('createCommunityBan: with reason', () => {
  const t = createCommunityBan(communityId, 'bad-user', 'spam')
  expect(t.kind).toBe(CommunityBan)
  expect(t.content).toBe('spam')
})

test('createCommunityChange: additive patch', () => {
  const t = createCommunityChange(communityId, [['name', 'New Name']])
  expect(t.kind).toBe(CommunityChange)
  expect(t.tags.find(t => t[0] === 'name')?.[1]).toBe('New Name')
})

test('hasRole checks role in tags', () => {
  const sk = generateSecretKey()
  const event = finalizeEvent(
    createCommunityDefinition({
      id: communityId,
      name: 'test',
      members: [{ pubkey: 'mod1', role: 'moderator' }],
    }),
    sk,
  )
  expect(hasRole(event, 'mod1', 'moderator')).toBe(true)
  expect(hasRole(event, 'mod1', 'admin')).toBe(false)
  expect(hasRole(event, 'anyone', 'user')).toBe(true)
})

test('isAdmin: creator is admin', () => {
  const sk = generateSecretKey()
  const pk = getPublicKey(sk)
  const event = finalizeEvent(
    createCommunityDefinition({ id: communityId, name: 'test' }),
    sk,
  )
  expect(isAdmin(event, pk)).toBe(true)
  expect(isAdmin(event, 'random')).toBe(false)
})
