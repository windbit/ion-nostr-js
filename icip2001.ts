/**
 * ICIP-2001: Affiliated Users
 *
 * Kind 1759 affiliation event for many-to-many master-delegate relationships.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-2001.md
 */

import { EventTemplate, NostrEvent } from './core.ts'
import { AffiliationRequest } from './kinds.ts'

// --- Types ---

export interface AffiliationOptions {
  /** Target user/device pubkey */
  targetPubkey: string
  /** Request type or description */
  request?: string
  /** Additional tags */
  tags?: string[][]
}

// --- Functions ---

/**
 * Create a kind 1759 affiliation request event template.
 * Content stores a stringified JSON array of kind 1759 events for bidirectional proof.
 */
export function createAffiliationRequest(opts: AffiliationOptions, existingProofs?: NostrEvent[]): EventTemplate {
  const tags: string[][] = [['p', opts.targetPubkey]]
  if (opts.request) tags.push(['request', opts.request])
  if (opts.tags) tags.push(...opts.tags)

  return {
    kind: AffiliationRequest,
    tags,
    content: existingProofs ? JSON.stringify(existingProofs) : '',
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Parse a kind 1759 affiliation request event.
 */
export function parseAffiliationRequest(event: NostrEvent): {
  targetPubkey: string
  request?: string
  proofs: NostrEvent[]
} {
  const targetPubkey = event.tags.find(t => t[0] === 'p')?.[1] ?? ''
  const request = event.tags.find(t => t[0] === 'request')?.[1]
  const proofs: NostrEvent[] = event.content ? JSON.parse(event.content) : []

  return { targetPubkey, request, proofs }
}

/**
 * Check if two affiliation events form a mutual affiliation
 * (both parties have published kind 1759 referencing each other).
 */
export function isMutualAffiliation(eventA: NostrEvent, eventB: NostrEvent): boolean {
  const aTarget = eventA.tags.find(t => t[0] === 'p')?.[1]
  const bTarget = eventB.tags.find(t => t[0] === 'p')?.[1]

  return (
    eventA.kind === AffiliationRequest &&
    eventB.kind === AffiliationRequest &&
    aTarget === eventB.pubkey &&
    bTarget === eventA.pubkey
  )
}
