import { test, expect } from 'bun:test'
import { createAffiliationRequest, parseAffiliationRequest, isMutualAffiliation } from './icip2001.ts'
import { finalizeEvent, generateSecretKey, getPublicKey } from './pure.ts'
import { AffiliationRequest } from './kinds.ts'

test('createAffiliationRequest: correct kind and tags', () => {
  const t = createAffiliationRequest({ targetPubkey: 'target-pk', request: 'affiliate' })
  expect(t.kind).toBe(AffiliationRequest)
  expect(t.tags.find(t => t[0] === 'p')?.[1]).toBe('target-pk')
  expect(t.tags.find(t => t[0] === 'request')?.[1]).toBe('affiliate')
})

test('parseAffiliationRequest round-trip', () => {
  const sk = generateSecretKey()
  const event = finalizeEvent(
    createAffiliationRequest({ targetPubkey: 'target' }),
    sk,
  )
  const parsed = parseAffiliationRequest(event)
  expect(parsed.targetPubkey).toBe('target')
  expect(parsed.proofs).toEqual([])
})

test('isMutualAffiliation: valid mutual', () => {
  const skA = generateSecretKey()
  const skB = generateSecretKey()
  const pkA = getPublicKey(skA)
  const pkB = getPublicKey(skB)

  const eventA = finalizeEvent(createAffiliationRequest({ targetPubkey: pkB }), skA)
  const eventB = finalizeEvent(createAffiliationRequest({ targetPubkey: pkA }), skB)

  expect(isMutualAffiliation(eventA, eventB)).toBe(true)
})

test('isMutualAffiliation: not mutual', () => {
  const skA = generateSecretKey()
  const skB = generateSecretKey()
  const pkB = getPublicKey(skB)

  const eventA = finalizeEvent(createAffiliationRequest({ targetPubkey: pkB }), skA)
  const eventB = finalizeEvent(createAffiliationRequest({ targetPubkey: 'other' }), skB)

  expect(isMutualAffiliation(eventA, eventB)).toBe(false)
})
