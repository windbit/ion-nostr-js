import { test, expect } from 'bun:test'
import {
  createTokenDefinition,
  parseTokenDefinition,
  createTokenAction,
  parseTokenAction,
  createActivityConsent,
} from './icip11000.ts'
import { finalizeEvent, generateSecretKey } from './pure.ts'
import { CommunityTokenDefinition, TokenAction, ActivityConsent } from './kinds.ts'

test('createTokenDefinition: correct kind and tags', () => {
  const t = createTokenDefinition({
    sourceRef: { type: 'a', coordinate: '0:pk:d-tag' },
    network: 'ion',
    bondingCurveAddress: '0:bc-addr',
    tokenAddress: '0:token-addr',
    tokenSymbol: 'TEST',
    masterPubkey: 'master-pk',
    kinds: [0, 1],
  })
  expect(t.kind).toBe(CommunityTokenDefinition)
  expect(t.tags.find(t => t[0] === 'network')?.[1]).toBe('ion')
  expect(t.tags.find(t => t[0] === 'token_symbol')?.[1]).toBe('TEST')
  expect(t.tags.filter(t => t[0] === 'k').length).toBe(2)
})

test('parseTokenDefinition round-trip', () => {
  const sk = generateSecretKey()
  const event = finalizeEvent(
    createTokenDefinition({
      sourceRef: { type: 'e', id: 'evt-id' },
      network: 'ethereum',
      bondingCurveAddress: '0xbc',
      tokenAddress: '0xtok',
      tokenSymbol: 'ETH',
    }),
    sk,
  )
  const parsed = parseTokenDefinition(event)
  expect(parsed.network).toBe('ethereum')
  expect(parsed.tokenAddress).toBe('0xtok')
  expect(parsed.tokenSymbol).toBe('ETH')
})

test('createTokenAction: correct kind', () => {
  const t = createTokenAction({
    txType: 'buy',
    txAddress: '0xtx',
    txAmount: '1000000',
    network: 'ion',
    tokenAddress: '0xtok',
    tokenSymbol: 'ICE',
  })
  expect(t.kind).toBe(TokenAction)
  expect(t.tags.find(t => t[0] === 'tx_type')?.[1]).toBe('buy')
})

test('parseTokenAction round-trip', () => {
  const sk = generateSecretKey()
  const event = finalizeEvent(
    createTokenAction({
      txType: 'sell',
      txAddress: '0xabc',
      txAmount: '500',
      network: 'ion',
      tokenAddress: '0xtok',
      masterPubkey: 'mpk',
    }),
    sk,
  )
  const parsed = parseTokenAction(event)
  expect(parsed.txType).toBe('sell')
  expect(parsed.txAmount).toBe('500')
  expect(parsed.masterPubkey).toBe('mpk')
})

test('createActivityConsent: correct kind', () => {
  const t = createActivityConsent()
  expect(t.kind).toBe(ActivityConsent)
  expect(t.content).toBe('')
})
