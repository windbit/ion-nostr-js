/**
 * ICIP-2000: On-Behalf of — Simple Sub-Key Management
 *
 * Allows a master identity to delegate event publishing to sub-keys.
 * Uses kind 10100 attestation list and `b` tag on delegated events.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-2000.md
 */

import { NostrEvent, EventTemplate, UnsignedEvent } from './core.ts'
import { OnBehalfAttestations } from './kinds.ts'

// --- Types ---

export type AttestationState = 'active' | 'inactive' | 'revoked'

export interface Attestation {
  pubkey: string
  relay: string
  state: AttestationState
  timestamp: number
  /** Allowed event kinds. undefined = all kinds except 10100 */
  kinds?: number[]
}

/** Resolved state for a single sub-key at a point in time */
export interface ResolvedSubKey {
  pubkey: string
  state: AttestationState
  /** Timestamp of the effective attestation */
  effectiveTimestamp: number
  /** Allowed kinds if state is active. undefined = all except 10100 */
  allowedKinds?: number[]
}

// --- Parsing ---

/**
 * Parse an attestation string like "active:1674834236:1,7" or "revoked:1722343578"
 */
export function parseAttestationString(attestation: string): { state: AttestationState; timestamp: number; kinds?: number[] } {
  const parts = attestation.split(':')
  if (parts.length < 2) throw new Error(`invalid attestation string: ${attestation}`)

  const state = parts[0] as AttestationState
  if (state !== 'active' && state !== 'inactive' && state !== 'revoked') {
    throw new Error(`invalid attestation state: ${state}`)
  }

  const timestamp = parseInt(parts[1], 10)
  if (isNaN(timestamp)) throw new Error(`invalid attestation timestamp: ${parts[1]}`)

  let kinds: number[] | undefined
  if (parts.length >= 3 && parts[2].length > 0) {
    kinds = parts[2].split(',').map(k => {
      const n = parseInt(k, 10)
      if (isNaN(n)) throw new Error(`invalid kind in attestation: ${k}`)
      return n
    })
  }

  return { state, timestamp, kinds }
}

/**
 * Format an attestation string from components.
 */
export function formatAttestationString(state: AttestationState, timestamp: number, kinds?: number[]): string {
  let s = `${state}:${timestamp}`
  if (kinds && kinds.length > 0) {
    s += ':' + kinds.join(',')
  }
  return s
}

/**
 * Parse a kind 10100 attestation list event into structured attestations.
 * Returns attestations in tag order (important for resolution).
 */
export function parseAttestationList(event: NostrEvent): Attestation[] {
  if (event.kind !== OnBehalfAttestations) {
    throw new Error(`expected kind ${OnBehalfAttestations}, got ${event.kind}`)
  }

  const attestations: Attestation[] = []
  for (const tag of event.tags) {
    if (tag[0] !== 'p') continue
    const pubkey = tag[1]
    const relay = tag[2] ?? ''
    const attestationStr = tag[3]
    if (!attestationStr) continue

    const { state, timestamp, kinds } = parseAttestationString(attestationStr)
    attestations.push({ pubkey, relay, state, timestamp, kinds })
  }

  return attestations
}

/**
 * Create a kind 10100 attestation list event template.
 */
export function createAttestationListEvent(attestations: Attestation[]): EventTemplate {
  const tags = attestations.map(a => {
    const attestationStr = formatAttestationString(a.state, a.timestamp, a.kinds)
    return ['p', a.pubkey, a.relay, attestationStr]
  })

  return {
    kind: OnBehalfAttestations,
    tags,
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}

// --- Resolution ---

/**
 * Resolve the effective state of a sub-key from the attestation list at a given timestamp.
 *
 * Rules (from ICIP-2000):
 * - Attestations are timestamped; later attestations override earlier ones
 * - For same timestamp, later in tag array wins
 * - inactive/revoked invalidate all previous active attestations
 * - active attestations after inactive/revoked are invalid
 */
export function resolveSubKeyState(attestations: Attestation[], subkeyPubkey: string, atTimestamp?: number): ResolvedSubKey | null {
  const relevant = attestations.filter(a => a.pubkey === subkeyPubkey)
  if (relevant.length === 0) return null

  // Sort by timestamp asc, then by original order (already in order from parsing)
  // For same timestamp, later in array wins (last write wins)
  let effective: Attestation | null = null
  let terminated = false

  for (const a of relevant) {
    if (atTimestamp !== undefined && a.timestamp > atTimestamp) continue

    if (a.state === 'inactive' || a.state === 'revoked') {
      terminated = true
      effective = a
    } else if (a.state === 'active') {
      if (terminated) {
        // active after inactive/revoked is invalid — skip
        continue
      }
      effective = a
    }
  }

  if (!effective) return null

  return {
    pubkey: subkeyPubkey,
    state: effective.state,
    effectiveTimestamp: effective.timestamp,
    allowedKinds: effective.state === 'active' ? effective.kinds : undefined,
  }
}

// --- Validation ---

/**
 * Get the master pubkey from the `b` tag of an event.
 * Returns null if no `b` tag is present.
 */
export function getOnBehalfMaster(event: NostrEvent | UnsignedEvent): string | null {
  const bTag = event.tags.find(t => t[0] === 'b')
  return bTag ? bTag[1] : null
}

/**
 * Validate that an event with a `b` tag is authorized by the attestation list.
 *
 * Checks:
 * 1. Event has a valid `b` tag pointing to the master pubkey
 * 2. Attestation list is owned by the master pubkey
 * 3. The event pubkey (sub-key) has an active attestation at event.created_at
 * 4. If kind restrictions exist, the event kind is allowed
 * 5. Event kind is not 10100 (attestation list can only be signed by master)
 */
export function isValidOnBehalf(event: NostrEvent, attestationListEvent: NostrEvent): boolean {
  const masterPubkey = getOnBehalfMaster(event)
  if (!masterPubkey) return false

  // Attestation list must be owned by the master
  if (attestationListEvent.pubkey !== masterPubkey) return false
  if (attestationListEvent.kind !== OnBehalfAttestations) return false

  // Kind 10100 cannot be published on-behalf
  if (event.kind === OnBehalfAttestations) return false

  const attestations = parseAttestationList(attestationListEvent)
  const resolved = resolveSubKeyState(attestations, event.pubkey, event.created_at)

  if (!resolved || resolved.state !== 'active') return false

  // Check kind restrictions
  if (resolved.allowedKinds && !resolved.allowedKinds.includes(event.kind)) {
    return false
  }

  return true
}

/**
 * Check if a revoked sub-key means all its on-behalf events should be invalidated.
 */
export function isSubKeyRevoked(attestationListEvent: NostrEvent, subkeyPubkey: string): boolean {
  const attestations = parseAttestationList(attestationListEvent)
  const resolved = resolveSubKeyState(attestations, subkeyPubkey)
  return resolved?.state === 'revoked'
}

// --- Event Creation ---

/**
 * Add a `b` (on-behalf) tag to an event template.
 */
export function createOnBehalfEvent(template: EventTemplate, masterPubkey: string): EventTemplate {
  return {
    ...template,
    tags: [...template.tags, ['b', masterPubkey]],
  }
}
