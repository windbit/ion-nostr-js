/**
 * ICIP-1000: Multiple Public Key Types and Signature Algorithms
 *
 * Extends NIP-01 event signing to support schnorr/ecdsa/eddsa on
 * secp256k1/secp256r1/curve25519/curve448 via a signature prefix mechanism.
 *
 * Default (no prefix) = schnorr/secp256k1 (standard Nostr).
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-1000.md
 */

import { schnorr, secp256k1 } from '@noble/curves/secp256k1.js'
import { p256 } from '@noble/curves/nist.js'
import { ed25519 } from '@noble/curves/ed25519.js'
import { ed448 } from '@noble/curves/ed448.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { sha256 } from '@noble/hashes/sha2.js'

import { EventTemplate, UnsignedEvent, NostrEvent, VerifiedEvent, verifiedSymbol } from './core.ts'
import { getEventHash, serializeEvent, getPublicKey as getSchnorrPublicKey } from './pure.ts'
import { utf8Encoder } from './utils.ts'

// --- Types ---

export type SignatureAlgorithm = 'schnorr' | 'ecdsa' | 'eddsa'
export type ECCCurve = 'secp256k1' | 'secp256r1' | 'curve25519' | 'curve448'

export interface ParsedSignature {
  algorithm: SignatureAlgorithm
  curve: ECCCurve
  signature: string
}

/** Default curves per algorithm when no explicit curve prefix is provided */
const defaultCurves: Record<SignatureAlgorithm, ECCCurve> = {
  schnorr: 'secp256k1',
  ecdsa: 'secp256k1',
  eddsa: 'curve25519',
}

// --- Parsing ---

/**
 * Parse a sig field into algorithm, curve, and raw hex signature.
 * Supports formats:
 *   - "hexsig" → schnorr/secp256k1
 *   - "algorithm:hexsig" → algorithm/default_curve
 *   - "algorithm/curve:hexsig" → algorithm/curve
 */
export function parseSignature(sig: string): ParsedSignature {
  const colonIdx = sig.indexOf(':')
  if (colonIdx === -1) {
    return { algorithm: 'schnorr', curve: 'secp256k1', signature: sig }
  }

  const prefix = sig.substring(0, colonIdx)
  const signature = sig.substring(colonIdx + 1)

  const slashIdx = prefix.indexOf('/')
  if (slashIdx === -1) {
    const algorithm = prefix as SignatureAlgorithm
    if (!defaultCurves[algorithm]) {
      throw new Error(`unknown signature algorithm: ${algorithm}`)
    }
    return { algorithm, curve: defaultCurves[algorithm], signature }
  }

  const algorithm = prefix.substring(0, slashIdx) as SignatureAlgorithm
  const curve = prefix.substring(slashIdx + 1) as ECCCurve
  if (!defaultCurves[algorithm]) {
    throw new Error(`unknown signature algorithm: ${algorithm}`)
  }
  return { algorithm, curve, signature }
}

/**
 * Format algorithm, curve, and raw hex signature into a sig field string.
 * Returns bare hex for schnorr/secp256k1 (default Nostr format).
 */
export function formatSignature(algorithm: SignatureAlgorithm, curve: ECCCurve, rawSig: string): string {
  if (algorithm === 'schnorr' && curve === 'secp256k1') {
    return rawSig
  }
  if (curve === defaultCurves[algorithm]) {
    return `${algorithm}:${rawSig}`
  }
  return `${algorithm}/${curve}:${rawSig}`
}

// --- Verification ---

function verifySchnorrSecp256k1(sig: string, hash: string, pubkey: string): boolean {
  return schnorr.verify(hexToBytes(sig), hexToBytes(hash), hexToBytes(pubkey))
}

function verifyEcdsaSecp256k1(sig: string, hash: string, pubkey: string): boolean {
  // pubkey is x-only 32 bytes; try both even (02) and odd (03) Y prefixes
  const sigBytes = hexToBytes(sig)
  const hashBytes = hexToBytes(hash)
  return (
    secp256k1.verify(sigBytes, hashBytes, hexToBytes('02' + pubkey), { format: 'der' }) ||
    secp256k1.verify(sigBytes, hashBytes, hexToBytes('03' + pubkey), { format: 'der' })
  )
}

function verifyEcdsaSecp256r1(sig: string, hash: string, pubkey: string): boolean {
  const sigBytes = hexToBytes(sig)
  const hashBytes = hexToBytes(hash)
  return (
    p256.verify(sigBytes, hashBytes, hexToBytes('02' + pubkey), { format: 'der' }) ||
    p256.verify(sigBytes, hashBytes, hexToBytes('03' + pubkey), { format: 'der' })
  )
}

function verifyEddsaCurve25519(sig: string, hash: string, pubkey: string): boolean {
  return ed25519.verify(hexToBytes(sig), hexToBytes(hash), hexToBytes(pubkey))
}

function verifyEddsaCurve448(sig: string, hash: string, pubkey: string): boolean {
  return ed448.verify(hexToBytes(sig), hexToBytes(hash), hexToBytes(pubkey))
}

/**
 * Verify an event signature using the algorithm/curve encoded in the sig prefix.
 * Returns true if the signature is valid.
 */
export function verifyMultiSigEvent(event: NostrEvent): boolean {
  try {
    const hash = getEventHash(event)
    if (hash !== event.id) return false

    const { algorithm, curve, signature } = parseSignature(event.sig)

    if (algorithm === 'schnorr' && curve === 'secp256k1') {
      return verifySchnorrSecp256k1(signature, hash, event.pubkey)
    }
    if (algorithm === 'ecdsa' && curve === 'secp256k1') {
      return verifyEcdsaSecp256k1(signature, hash, event.pubkey)
    }
    if (algorithm === 'ecdsa' && curve === 'secp256r1') {
      return verifyEcdsaSecp256r1(signature, hash, event.pubkey)
    }
    if (algorithm === 'eddsa' && curve === 'curve25519') {
      return verifyEddsaCurve25519(signature, hash, event.pubkey)
    }
    if (algorithm === 'eddsa' && curve === 'curve448') {
      return verifyEddsaCurve448(signature, hash, event.pubkey)
    }

    return false
  } catch {
    return false
  }
}

// --- Signing ---

function signSchnorrSecp256k1(hash: Uint8Array, secretKey: Uint8Array): string {
  return bytesToHex(schnorr.sign(hash, secretKey))
}

function signEcdsaSecp256k1(hash: Uint8Array, secretKey: Uint8Array): string {
  return bytesToHex(secp256k1.sign(hash, secretKey, { format: 'der' }))
}

function signEcdsaSecp256r1(hash: Uint8Array, secretKey: Uint8Array): string {
  return bytesToHex(p256.sign(hash, secretKey, { format: 'der' }))
}

function signEddsaCurve25519(hash: Uint8Array, secretKey: Uint8Array): string {
  return bytesToHex(ed25519.sign(hash, secretKey))
}

function signEddsaCurve448(hash: Uint8Array, secretKey: Uint8Array): string {
  return bytesToHex(ed448.sign(hash, secretKey))
}

/**
 * Get the public key for a given secret key and curve.
 * Returns the hex-encoded public key (32 bytes for secp256k1/secp256r1, native for ed25519/ed448).
 */
export function getPublicKeyForCurve(secretKey: Uint8Array, curve: ECCCurve): string {
  switch (curve) {
    case 'secp256k1':
      return getSchnorrPublicKey(secretKey)
    case 'secp256r1': {
      // x-only public key: take x coordinate of compressed point
      const point = p256.getPublicKey(secretKey, true) // compressed: 33 bytes
      return bytesToHex(point.subarray(1)) // strip prefix byte
    }
    case 'curve25519':
      return bytesToHex(ed25519.getPublicKey(secretKey))
    case 'curve448':
      return bytesToHex(ed448.getPublicKey(secretKey))
  }
}

/**
 * Finalize and sign an event template using the specified algorithm and curve.
 * Returns a full NostrEvent with id and sig set.
 */
export function finalizeEventMultiSig(
  template: EventTemplate,
  secretKey: Uint8Array,
  algorithm: SignatureAlgorithm,
  curve?: ECCCurve,
): VerifiedEvent {
  const effectiveCurve = curve ?? defaultCurves[algorithm]
  const pubkey = getPublicKeyForCurve(secretKey, effectiveCurve)

  const event = template as VerifiedEvent
  event.pubkey = pubkey
  event.id = getEventHash(event)

  const hashBytes = hexToBytes(event.id)
  let rawSig: string

  if (algorithm === 'schnorr' && effectiveCurve === 'secp256k1') {
    rawSig = signSchnorrSecp256k1(hashBytes, secretKey)
  } else if (algorithm === 'ecdsa' && effectiveCurve === 'secp256k1') {
    rawSig = signEcdsaSecp256k1(hashBytes, secretKey)
  } else if (algorithm === 'ecdsa' && effectiveCurve === 'secp256r1') {
    rawSig = signEcdsaSecp256r1(hashBytes, secretKey)
  } else if (algorithm === 'eddsa' && effectiveCurve === 'curve25519') {
    rawSig = signEddsaCurve25519(hashBytes, secretKey)
  } else if (algorithm === 'eddsa' && effectiveCurve === 'curve448') {
    rawSig = signEddsaCurve448(hashBytes, secretKey)
  } else {
    throw new Error(`unsupported combination: ${algorithm}/${effectiveCurve}`)
  }

  event.sig = formatSignature(algorithm, effectiveCurve, rawSig)
  event[verifiedSymbol] = true
  return event
}
