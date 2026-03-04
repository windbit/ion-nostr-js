/**
 * ICIP-10000: NOSTR Compatibility
 *
 * Dual publication: ION Connect events alongside "pure NOSTR" versions
 * via kind 21750 ephemeral event embedding.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-10000.md
 */

import { EventTemplate, NostrEvent, UnsignedEvent } from './core.ts'
import { EphemeralEventEmbed } from './kinds.ts'

// --- Types ---

/**
 * Mapping of ION Connect kinds to their "pure NOSTR" equivalents.
 */
export const KIND_MAPPING: Record<number, number> = {
  30175: 1,    // ModifiableNote → ShortTextNote
  3: 3,        // Contacts → Contacts (same)
}

// --- Functions ---

/**
 * Get the pure NOSTR kind equivalent for an ION Connect kind.
 * Returns the same kind if no mapping exists.
 */
export function getPureNostrKind(ionKind: number): number {
  return KIND_MAPPING[ionKind] ?? ionKind
}

/**
 * Create a "pure NOSTR" version of an ION Connect event for compatibility.
 * The pure NOSTR event is embedded in a kind 21750 ephemeral event.
 *
 * Per ICIP-10000:
 * - Content can be omitted in the pure NOSTR version if identical to source
 * - Both pubkeys must be valid ICIP-2000 delegations to the same master
 */
export function createPureNostrEmbed(
  sourceEvent: NostrEvent,
  pureNostrEvent: NostrEvent | UnsignedEvent,
  masterPubkey?: string,
): EventTemplate {
  const tags: string[][] = [['e', sourceEvent.id]]
  if (masterPubkey) {
    tags.unshift(['b', masterPubkey])
  }

  return {
    kind: EphemeralEventEmbed,
    tags,
    content: JSON.stringify(pureNostrEvent),
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Extract the pure NOSTR event from a kind 21750 embed.
 */
export function extractPureNostrEvent(embedEvent: NostrEvent): NostrEvent {
  return JSON.parse(embedEvent.content)
}

/**
 * Check if an event kind has a pure NOSTR equivalent.
 */
export function hasPureNostrEquivalent(kind: number): boolean {
  return kind in KIND_MAPPING
}
