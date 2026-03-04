/**
 * ICIP-17: Private Direct Message Extensions
 *
 * Modifiable DM (kind 30014), Block (1757), Archive (2175), Mute (3175).
 * All action events (block/archive/mute) MUST be used as rumors wrapped in NIP-59.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-17.md
 */

import { EventTemplate, UnsignedEvent } from './core.ts'
import { ModifiableDirectMessage, BlockUser, ArchiveConversation, MuteUser } from './kinds.ts'

// --- Modifiable Direct Message (kind 30014) ---

export interface ModifiableDMOptions {
  /** Unique message UUIDv7 for `d` tag */
  dTag: string
  content: string
  /** Recipient pubkeys with optional relay URLs */
  recipients: Array<{ pubkey: string; relay?: string }>
  /** If this is a reply, reference the parent message */
  parentRef?: { pubkey: string; dTag: string; relay?: string }
  subject?: string
  /** Additional tags */
  tags?: string[][]
}

/**
 * Create a kind 30014 modifiable direct message rumor template.
 * Note: This event MUST NOT be signed directly — it should be used as a rumor
 * and wrapped via NIP-59 gift wrap.
 */
export function createModifiableDM(opts: ModifiableDMOptions): EventTemplate {
  const tags: string[][] = [['d', opts.dTag]]

  for (const r of opts.recipients) {
    tags.push(r.relay ? ['p', r.pubkey, r.relay] : ['p', r.pubkey])
  }

  if (opts.parentRef) {
    const coord = `30014:${opts.parentRef.pubkey}:${opts.parentRef.dTag}`
    tags.push(['a', coord, opts.parentRef.relay ?? ''])
  }

  if (opts.subject) {
    tags.push(['subject', opts.subject])
  }

  if (opts.tags) {
    tags.push(...opts.tags)
  }

  return {
    kind: ModifiableDirectMessage,
    tags,
    content: opts.content,
    created_at: Math.round(Date.now() / 1000),
  }
}

// --- Block User (kind 1757) ---

export interface BlockUserOptions {
  /** Pubkey of the user being blocked */
  targetPubkey: string
  /** Optional master key (b tag) */
  masterPubkey?: string
  /** Optional reason */
  content?: string
}

/**
 * Create a kind 1757 block user rumor template.
 * MUST be wrapped in NIP-59 gift wrap without expiration.
 */
export function createBlockUser(opts: BlockUserOptions): EventTemplate {
  const tags: string[][] = [['p', opts.targetPubkey]]
  if (opts.masterPubkey) {
    tags.unshift(['b', opts.masterPubkey])
  }

  return {
    kind: BlockUser,
    tags,
    content: opts.content ?? '',
    created_at: Math.round(Date.now() / 1000),
  }
}

// --- Archive Conversation (kind 2175) ---

export interface ArchiveConversationOptions {
  /** Conversation identifier (h tag) */
  conversationId: string
  /** Optional master key (b tag) */
  masterPubkey?: string
  /** Optional reason */
  content?: string
}

/**
 * Create a kind 2175 archive conversation rumor template.
 * MUST be wrapped in NIP-59 gift wrap without expiration.
 */
export function createArchiveConversation(opts: ArchiveConversationOptions): EventTemplate {
  const tags: string[][] = [['h', opts.conversationId]]
  if (opts.masterPubkey) {
    tags.unshift(['b', opts.masterPubkey])
  }

  return {
    kind: ArchiveConversation,
    tags,
    content: opts.content ?? '',
    created_at: Math.round(Date.now() / 1000),
  }
}

// --- Mute User (kind 3175) ---

export interface MuteUserOptions {
  /** Pubkey of the user being muted */
  targetPubkey: string
  /** Optional master key (b tag) */
  masterPubkey?: string
  /** Optional reason */
  content?: string
}

/**
 * Create a kind 3175 mute user rumor template.
 * MUST be wrapped in NIP-59 gift wrap without expiration.
 */
export function createMuteUser(opts: MuteUserOptions): EventTemplate {
  const tags: string[][] = [['p', opts.targetPubkey]]
  if (opts.masterPubkey) {
    tags.unshift(['b', opts.masterPubkey])
  }

  return {
    kind: MuteUser,
    tags,
    content: opts.content ?? '',
    created_at: Math.round(Date.now() / 1000),
  }
}

// --- Parsing helpers ---

/**
 * Extract the target pubkey from a block/mute event (p tag).
 */
export function getTargetPubkey(event: { tags: string[][] }): string | null {
  return event.tags.find(t => t[0] === 'p')?.[1] ?? null
}

/**
 * Extract the conversation id from an archive event (h tag).
 */
export function getConversationId(event: { tags: string[][] }): string | null {
  return event.tags.find(t => t[0] === 'h')?.[1] ?? null
}
