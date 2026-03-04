/**
 * ICIP-01: Basic Protocol Extensions
 *
 * Modifiable notes (kind 30175), story notes (kind 57103), addressable quotes (Q tag),
 * extended profile fields, and ephemeral event embedding (kind 21750).
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-01.md
 */

import { EventTemplate, NostrEvent, UnsignedEvent } from './core.ts'
import { ModifiableNote, StoryNote, EphemeralEventEmbed } from './kinds.ts'

// --- Modifiable Note (kind 30175) ---

export interface ModifiableNoteOptions {
  content: string
  /** UUIDv7 identifier for the `d` tag */
  dTag: string
  /** Unix timestamp of first publication */
  publishedAt: number
  /** Optional: if set, updates after this timestamp are rejected */
  editingEndedAt?: number
  /** Additional tags (e, a, p, etc.) */
  tags?: string[][]
}

/**
 * Create a kind 30175 modifiable note event template.
 */
export function createModifiableNote(opts: ModifiableNoteOptions): EventTemplate {
  const tags: string[][] = [
    ['d', opts.dTag],
    ['published_at', String(opts.publishedAt)],
  ]
  if (opts.editingEndedAt !== undefined) {
    tags.push(['editing_ended_at', String(opts.editingEndedAt)])
  }
  if (opts.tags) {
    tags.push(...opts.tags)
  }

  return {
    kind: ModifiableNote,
    tags,
    content: opts.content,
    created_at: Math.round(Date.now() / 1000),
  }
}

export interface ParsedModifiableNote {
  dTag: string
  publishedAt: number
  editingEndedAt?: number
  content: string
}

/**
 * Parse a kind 30175 event into structured data.
 */
export function parseModifiableNote(event: NostrEvent): ParsedModifiableNote {
  const dTag = event.tags.find(t => t[0] === 'd')?.[1]
  if (!dTag) throw new Error('missing d tag in modifiable note')

  const publishedAtStr = event.tags.find(t => t[0] === 'published_at')?.[1]
  if (!publishedAtStr) throw new Error('missing published_at tag')
  const publishedAt = parseInt(publishedAtStr, 10)

  const editingEndedAtStr = event.tags.find(t => t[0] === 'editing_ended_at')?.[1]
  const editingEndedAt = editingEndedAtStr ? parseInt(editingEndedAtStr, 10) : undefined

  return { dTag, publishedAt, editingEndedAt, content: event.content }
}

/**
 * Check if editing is still allowed for a modifiable note at the given timestamp.
 */
export function isEditingAllowed(event: NostrEvent, atTimestamp?: number): boolean {
  const editingEndedAtStr = event.tags.find(t => t[0] === 'editing_ended_at')?.[1]
  if (!editingEndedAtStr) return true
  const editingEndedAt = parseInt(editingEndedAtStr, 10)
  const now = atTimestamp ?? Math.round(Date.now() / 1000)
  return now <= editingEndedAt
}

// --- Story Note (kind 57103) ---

export interface StoryNoteOptions {
  content: string
  /** Additional tags */
  tags?: string[][]
}

/**
 * Create a kind 57103 story note event template (expiring content).
 */
export function createStoryNote(opts: StoryNoteOptions): EventTemplate {
  return {
    kind: StoryNote,
    tags: opts.tags ?? [],
    content: opts.content,
    created_at: Math.round(Date.now() / 1000),
  }
}

// --- Q tag for addressable quotes ---

/**
 * Create a Q tag for quoting an addressable event (kind 30175, 30023, etc.).
 * Format: ["Q", "<kind>:<pubkey>:<d-tag>", <relay-url>, <pubkey>]
 */
export function createQTag(kind: number, pubkey: string, dTag: string, relayUrl?: string): string[] {
  const coordinate = `${kind}:${pubkey}:${dTag}`
  const tag = ['Q', coordinate]
  if (relayUrl) tag.push(relayUrl)
  tag.push(pubkey)
  return tag
}

export interface ParsedQTag {
  kind: number
  pubkey: string
  dTag: string
  relayUrl?: string
}

/**
 * Parse a Q tag from an event.
 */
export function parseQTag(tag: string[]): ParsedQTag | null {
  if (tag[0] !== 'Q') return null
  const parts = tag[1].split(':')
  if (parts.length < 3) return null

  return {
    kind: parseInt(parts[0], 10),
    pubkey: parts[1],
    dTag: parts.slice(2).join(':'),
    relayUrl: tag.length >= 4 ? tag[2] : undefined,
  }
}

/**
 * Get all Q tags from an event.
 */
export function getQTags(event: NostrEvent): ParsedQTag[] {
  return event.tags
    .filter(t => t[0] === 'Q')
    .map(parseQTag)
    .filter((t): t is ParsedQTag => t !== null)
}

// --- Extended Profile ---

export interface IONProfileExtras {
  location?: string
  registered_at?: number
  category?: string
  ion_content_nft_collections?: Record<string, { address: string; created_by: string }>
  wallets?: Record<string, string>
  who_can_message_you?: 'follows' | 'friends'
  who_can_invite_you_to_groups?: 'follows' | 'friends'
}

/**
 * Parse ION-specific profile fields from a kind 0 metadata event content.
 */
export function parseIONProfile(content: string): IONProfileExtras {
  const data = JSON.parse(content)
  const extras: IONProfileExtras = {}

  if (data.location) extras.location = data.location
  if (data.registered_at) extras.registered_at = data.registered_at
  if (data.category) extras.category = data.category
  if (data.ion_content_nft_collections) extras.ion_content_nft_collections = data.ion_content_nft_collections
  if (data.wallets) extras.wallets = data.wallets
  if (data.who_can_message_you) extras.who_can_message_you = data.who_can_message_you
  if (data.who_can_invite_you_to_groups) extras.who_can_invite_you_to_groups = data.who_can_invite_you_to_groups

  return extras
}

/**
 * Merge ION profile extras into existing kind 0 metadata content JSON.
 */
export function mergeIONProfile(existingContent: string, extras: IONProfileExtras): string {
  const data = JSON.parse(existingContent)
  return JSON.stringify({ ...data, ...extras })
}

// --- Ephemeral Event Embed (kind 21750) ---

export interface EphemeralEmbedOptions {
  /** The event to embed as content (will be JSON stringified) */
  embeddedEvent: NostrEvent | UnsignedEvent
  /** Reference to the event being contextualized: event id or addressable coordinate */
  reference: { type: 'e'; id: string } | { type: 'a'; coordinate: string }
  /** Optional master pubkey for on-behalf tag */
  masterPubkey?: string
}

/**
 * Create a kind 21750 ephemeral event embed template.
 */
export function createEphemeralEmbed(opts: EphemeralEmbedOptions): EventTemplate {
  const tags: string[][] = []

  if (opts.masterPubkey) {
    tags.push(['b', opts.masterPubkey])
  }

  if (opts.reference.type === 'e') {
    tags.push(['e', opts.reference.id])
  } else {
    tags.push(['a', opts.reference.coordinate])
  }

  return {
    kind: EphemeralEventEmbed,
    tags,
    content: JSON.stringify(opts.embeddedEvent),
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Parse a kind 21750 ephemeral embed event.
 */
export function parseEphemeralEmbed(event: NostrEvent): {
  embeddedEvent: NostrEvent
  referenceId?: string
  referenceCoordinate?: string
  masterPubkey?: string
} {
  const embeddedEvent = JSON.parse(event.content)
  const eTag = event.tags.find(t => t[0] === 'e')
  const aTag = event.tags.find(t => t[0] === 'a')
  const bTag = event.tags.find(t => t[0] === 'b')

  return {
    embeddedEvent,
    referenceId: eTag?.[1],
    referenceCoordinate: aTag?.[1],
    masterPubkey: bTag?.[1],
  }
}
