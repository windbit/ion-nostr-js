import { test, expect } from 'bun:test'
import {
  parseSignature,
  formatSignature,
  verifyMultiSigEvent,
  finalizeEventMultiSig,
  getPublicKeyForCurve,
} from './icip1000.ts'
import { generateSecretKey } from './pure.ts'
import { ed25519 } from '@noble/curves/ed25519.js'
import { ed448 } from '@noble/curves/ed448.js'
import { p256 } from '@noble/curves/nist.js'

// --- parseSignature ---

test('parseSignature: bare hex → schnorr/secp256k1', () => {
  const p = parseSignature('abcdef1234567890')
  expect(p.algorithm).toBe('schnorr')
  expect(p.curve).toBe('secp256k1')
  expect(p.signature).toBe('abcdef1234567890')
})

test('parseSignature: ecdsa:hex → ecdsa/secp256k1', () => {
  const p = parseSignature('ecdsa:deadbeef')
  expect(p.algorithm).toBe('ecdsa')
  expect(p.curve).toBe('secp256k1')
  expect(p.signature).toBe('deadbeef')
})

test('parseSignature: eddsa:hex → eddsa/curve25519', () => {
  const p = parseSignature('eddsa:cafe')
  expect(p.algorithm).toBe('eddsa')
  expect(p.curve).toBe('curve25519')
  expect(p.signature).toBe('cafe')
})

test('parseSignature: ecdsa/secp256r1:hex', () => {
  const p = parseSignature('ecdsa/secp256r1:aabb')
  expect(p.algorithm).toBe('ecdsa')
  expect(p.curve).toBe('secp256r1')
  expect(p.signature).toBe('aabb')
})

test('parseSignature: eddsa/curve448:hex', () => {
  const p = parseSignature('eddsa/curve448:1122')
  expect(p.algorithm).toBe('eddsa')
  expect(p.curve).toBe('curve448')
  expect(p.signature).toBe('1122')
})

test('parseSignature: unknown algorithm throws', () => {
  expect(() => parseSignature('unknown:abc')).toThrow('unknown signature algorithm')
})

// --- formatSignature ---

test('formatSignature: schnorr/secp256k1 → bare hex', () => {
  expect(formatSignature('schnorr', 'secp256k1', 'abc')).toBe('abc')
})

test('formatSignature: ecdsa/secp256k1 → ecdsa:hex', () => {
  expect(formatSignature('ecdsa', 'secp256k1', 'abc')).toBe('ecdsa:abc')
})

test('formatSignature: eddsa/curve25519 → eddsa:hex', () => {
  expect(formatSignature('eddsa', 'curve25519', 'abc')).toBe('eddsa:abc')
})

test('formatSignature: ecdsa/secp256r1 → ecdsa/secp256r1:hex', () => {
  expect(formatSignature('ecdsa', 'secp256r1', 'abc')).toBe('ecdsa/secp256r1:abc')
})

test('formatSignature: eddsa/curve448 → eddsa/curve448:hex', () => {
  expect(formatSignature('eddsa', 'curve448', 'abc')).toBe('eddsa/curve448:abc')
})

// --- Round-trip sign/verify ---

const template = {
  kind: 1,
  tags: [],
  content: 'ICIP-1000 multi-sig test',
  created_at: 1700000000,
}

test('round-trip: schnorr/secp256k1 (default Nostr)', () => {
  const sk = generateSecretKey()
  const event = finalizeEventMultiSig({ ...template }, sk, 'schnorr', 'secp256k1')
  expect(event.sig).not.toContain(':')
  expect(verifyMultiSigEvent(event)).toBe(true)
})

test('round-trip: ecdsa/secp256k1', () => {
  const sk = generateSecretKey()
  const event = finalizeEventMultiSig({ ...template }, sk, 'ecdsa', 'secp256k1')
  expect(event.sig.startsWith('ecdsa:')).toBe(true)
  expect(verifyMultiSigEvent(event)).toBe(true)
})

test('round-trip: ecdsa/secp256r1', () => {
  const sk = p256.utils.randomSecretKey()
  const event = finalizeEventMultiSig({ ...template }, sk, 'ecdsa', 'secp256r1')
  expect(event.sig.startsWith('ecdsa/secp256r1:')).toBe(true)
  expect(verifyMultiSigEvent(event)).toBe(true)
})

test('round-trip: eddsa/curve25519', () => {
  const sk = ed25519.utils.randomSecretKey()
  const event = finalizeEventMultiSig({ ...template }, sk, 'eddsa', 'curve25519')
  expect(event.sig.startsWith('eddsa:')).toBe(true)
  expect(verifyMultiSigEvent(event)).toBe(true)
})

// Note: ed448 pubkeys are 57 bytes (114 hex), which doesn't fit Nostr's 32-byte pubkey field.
// Nostr validateEvent rejects non-64-char pubkeys, so full event round-trip isn't possible.
// We test sign/verify at the crypto level instead.
test('eddsa/curve448: sign and verify raw', () => {
  const sk = ed448.utils.randomSecretKey()
  const pk = getPublicKeyForCurve(sk, 'curve448')
  expect(pk.length).toBe(114) // 57 bytes hex
  const hash = new Uint8Array(32).fill(42)
  const sig = ed448.sign(hash, sk)
  const pkBytes = new Uint8Array(pk.match(/.{2}/g)!.map(b => parseInt(b, 16)))
  const valid = ed448.verify(sig, hash, pkBytes)
  expect(valid).toBe(true)
})

test('round-trip: ecdsa default curve is secp256k1', () => {
  const sk = generateSecretKey()
  const event = finalizeEventMultiSig({ ...template }, sk, 'ecdsa')
  expect(event.sig.startsWith('ecdsa:')).toBe(true)
  expect(verifyMultiSigEvent(event)).toBe(true)
})

test('round-trip: eddsa default curve is curve25519', () => {
  const sk = ed25519.utils.randomSecretKey()
  const event = finalizeEventMultiSig({ ...template }, sk, 'eddsa')
  expect(event.sig.startsWith('eddsa:')).toBe(true)
  expect(verifyMultiSigEvent(event)).toBe(true)
})

test('verify rejects tampered event', () => {
  const sk = generateSecretKey()
  const event = finalizeEventMultiSig({ ...template }, sk, 'schnorr', 'secp256k1')
  event.content = 'tampered'
  expect(verifyMultiSigEvent(event)).toBe(false)
})

// --- getPublicKeyForCurve ---

test('getPublicKeyForCurve returns 64-char hex for secp256k1', () => {
  const sk = generateSecretKey()
  const pk = getPublicKeyForCurve(sk, 'secp256k1')
  expect(pk.length).toBe(64)
})

test('getPublicKeyForCurve returns 64-char hex for secp256r1', () => {
  const sk = p256.utils.randomSecretKey()
  const pk = getPublicKeyForCurve(sk, 'secp256r1')
  expect(pk.length).toBe(64)
})

test('getPublicKeyForCurve returns 64-char hex for curve25519', () => {
  const sk = ed25519.utils.randomSecretKey()
  const pk = getPublicKeyForCurve(sk, 'curve25519')
  expect(pk.length).toBe(64)
})
