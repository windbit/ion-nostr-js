import { test, expect } from 'bun:test'
import {
  parseAttestationString,
  formatAttestationString,
  parseAttestationList,
  createAttestationListEvent,
  resolveSubKeyState,
  getOnBehalfMaster,
  isValidOnBehalf,
  isSubKeyRevoked,
  createOnBehalfEvent,
} from './icip2000.ts'
import { finalizeEvent, generateSecretKey, getPublicKey } from './pure.ts'

// --- parseAttestationString ---

test('parse active attestation with kinds', () => {
  const r = parseAttestationString('active:1674834236:1,7')
  expect(r.state).toBe('active')
  expect(r.timestamp).toBe(1674834236)
  expect(r.kinds).toEqual([1, 7])
})

test('parse active attestation without kinds', () => {
  const r = parseAttestationString('active:1721934607')
  expect(r.state).toBe('active')
  expect(r.timestamp).toBe(1721934607)
  expect(r.kinds).toBeUndefined()
})

test('parse inactive attestation', () => {
  const r = parseAttestationString('inactive:1722343578')
  expect(r.state).toBe('inactive')
  expect(r.timestamp).toBe(1722343578)
})

test('parse revoked attestation', () => {
  const r = parseAttestationString('revoked:1722343578')
  expect(r.state).toBe('revoked')
  expect(r.timestamp).toBe(1722343578)
})

test('invalid state throws', () => {
  expect(() => parseAttestationString('unknown:123')).toThrow('invalid attestation state')
})

// --- formatAttestationString ---

test('format active with kinds', () => {
  expect(formatAttestationString('active', 1674834236, [1, 7])).toBe('active:1674834236:1,7')
})

test('format active without kinds', () => {
  expect(formatAttestationString('active', 1721934607)).toBe('active:1721934607')
})

test('format revoked', () => {
  expect(formatAttestationString('revoked', 1722343578)).toBe('revoked:1722343578')
})

// --- parseAttestationList / createAttestationListEvent round-trip ---

test('round-trip attestation list', () => {
  const attestations = [
    { pubkey: 'aabb', relay: '', state: 'active' as const, timestamp: 1000, kinds: [1, 7] },
    { pubkey: 'aabb', relay: '', state: 'active' as const, timestamp: 2000 },
    { pubkey: 'ccdd', relay: 'wss://relay.example.com', state: 'revoked' as const, timestamp: 3000 },
  ]

  const template = createAttestationListEvent(attestations)
  expect(template.kind).toBe(10100)
  expect(template.content).toBe('')

  // Simulate finalization to parse back
  const mockEvent = {
    ...template,
    pubkey: 'masterpk',
    id: 'fakeid',
    sig: 'fakesig',
  }

  const parsed = parseAttestationList(mockEvent as any)
  expect(parsed.length).toBe(3)
  expect(parsed[0].pubkey).toBe('aabb')
  expect(parsed[0].state).toBe('active')
  expect(parsed[0].timestamp).toBe(1000)
  expect(parsed[0].kinds).toEqual([1, 7])
  expect(parsed[1].kinds).toBeUndefined()
  expect(parsed[2].pubkey).toBe('ccdd')
  expect(parsed[2].state).toBe('revoked')
  expect(parsed[2].relay).toBe('wss://relay.example.com')
})

// --- resolveSubKeyState ---

test('resolve active sub-key', () => {
  const attestations = [
    { pubkey: 'sub1', relay: '', state: 'active' as const, timestamp: 1000, kinds: [1] },
  ]
  const r = resolveSubKeyState(attestations, 'sub1')
  expect(r?.state).toBe('active')
  expect(r?.allowedKinds).toEqual([1])
})

test('resolve active then inactive', () => {
  const attestations = [
    { pubkey: 'sub1', relay: '', state: 'active' as const, timestamp: 1000 },
    { pubkey: 'sub1', relay: '', state: 'inactive' as const, timestamp: 2000 },
  ]
  const r = resolveSubKeyState(attestations, 'sub1')
  expect(r?.state).toBe('inactive')
})

test('active after revoked is invalid', () => {
  const attestations = [
    { pubkey: 'sub1', relay: '', state: 'active' as const, timestamp: 1000 },
    { pubkey: 'sub1', relay: '', state: 'revoked' as const, timestamp: 2000 },
    { pubkey: 'sub1', relay: '', state: 'active' as const, timestamp: 3000 },
  ]
  const r = resolveSubKeyState(attestations, 'sub1')
  expect(r?.state).toBe('revoked')
})

test('resolve at specific timestamp', () => {
  const attestations = [
    { pubkey: 'sub1', relay: '', state: 'active' as const, timestamp: 1000 },
    { pubkey: 'sub1', relay: '', state: 'inactive' as const, timestamp: 3000 },
  ]
  // At timestamp 2000, sub-key is still active
  const r = resolveSubKeyState(attestations, 'sub1', 2000)
  expect(r?.state).toBe('active')
})

test('resolve unknown pubkey returns null', () => {
  const attestations = [
    { pubkey: 'sub1', relay: '', state: 'active' as const, timestamp: 1000 },
  ]
  expect(resolveSubKeyState(attestations, 'unknown')).toBeNull()
})

// --- isValidOnBehalf full integration ---

test('isValidOnBehalf: valid delegation', () => {
  const masterSk = generateSecretKey()
  const subSk = generateSecretKey()
  const masterPk = getPublicKey(masterSk)
  const subPk = getPublicKey(subSk)

  // Master creates attestation list
  const listTemplate = createAttestationListEvent([
    { pubkey: subPk, relay: '', state: 'active', timestamp: 1000 },
  ])
  const attestationList = finalizeEvent(listTemplate, masterSk)

  // Sub-key publishes on behalf
  const eventTemplate = createOnBehalfEvent(
    { kind: 1, tags: [], content: 'hello', created_at: 1500 },
    masterPk,
  )
  const event = finalizeEvent(eventTemplate, subSk)

  expect(getOnBehalfMaster(event)).toBe(masterPk)
  expect(isValidOnBehalf(event, attestationList)).toBe(true)
})

test('isValidOnBehalf: kind restricted — allowed', () => {
  const masterSk = generateSecretKey()
  const subSk = generateSecretKey()
  const masterPk = getPublicKey(masterSk)
  const subPk = getPublicKey(subSk)

  const attestationList = finalizeEvent(
    createAttestationListEvent([
      { pubkey: subPk, relay: '', state: 'active', timestamp: 1000, kinds: [1, 7] },
    ]),
    masterSk,
  )

  const event = finalizeEvent(
    createOnBehalfEvent({ kind: 1, tags: [], content: 'test', created_at: 1500 }, masterPk),
    subSk,
  )

  expect(isValidOnBehalf(event, attestationList)).toBe(true)
})

test('isValidOnBehalf: kind restricted — denied', () => {
  const masterSk = generateSecretKey()
  const subSk = generateSecretKey()
  const masterPk = getPublicKey(masterSk)
  const subPk = getPublicKey(subSk)

  const attestationList = finalizeEvent(
    createAttestationListEvent([
      { pubkey: subPk, relay: '', state: 'active', timestamp: 1000, kinds: [1, 7] },
    ]),
    masterSk,
  )

  const event = finalizeEvent(
    createOnBehalfEvent({ kind: 42, tags: [], content: 'test', created_at: 1500 }, masterPk),
    subSk,
  )

  expect(isValidOnBehalf(event, attestationList)).toBe(false)
})

test('isValidOnBehalf: revoked sub-key', () => {
  const masterSk = generateSecretKey()
  const subSk = generateSecretKey()
  const masterPk = getPublicKey(masterSk)
  const subPk = getPublicKey(subSk)

  const attestationList = finalizeEvent(
    createAttestationListEvent([
      { pubkey: subPk, relay: '', state: 'active', timestamp: 1000 },
      { pubkey: subPk, relay: '', state: 'revoked', timestamp: 2000 },
    ]),
    masterSk,
  )

  const event = finalizeEvent(
    createOnBehalfEvent({ kind: 1, tags: [], content: 'test', created_at: 2500 }, masterPk),
    subSk,
  )

  expect(isValidOnBehalf(event, attestationList)).toBe(false)
})

test('isSubKeyRevoked', () => {
  const masterSk = generateSecretKey()
  const subPk = getPublicKey(generateSecretKey())

  const attestationList = finalizeEvent(
    createAttestationListEvent([
      { pubkey: subPk, relay: '', state: 'active', timestamp: 1000 },
      { pubkey: subPk, relay: '', state: 'revoked', timestamp: 2000 },
    ]),
    masterSk,
  )

  expect(isSubKeyRevoked(attestationList, subPk)).toBe(true)
})

test('no b tag returns null', () => {
  const event = { kind: 1, tags: [], content: '', created_at: 0, pubkey: 'abc', id: 'x', sig: 'y' }
  expect(getOnBehalfMaster(event as any)).toBeNull()
})
