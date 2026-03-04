/**
 * ICIP-51: Extended Lists
 *
 * Chats list (kind 11750) for E2EE chats and communities.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-51.md
 */

import { EventTemplate, NostrEvent } from './core.ts'
import { ChatsList } from './kinds.ts'

// --- Types ---

export interface ChatEntry {
  /** Conversation h-tag (community UUID or DM conversation id) */
  id: string
}

export interface ChatsListData {
  chats: ChatEntry[]
  /** Encrypted tags: p tags with participant pubkeys, subject */
  encryptedContent?: {
    participants?: string[]
    subject?: string
  }
}

// --- Functions ---

/**
 * Create a kind 11750 chats list event template.
 * The `h` tags are public (indexable), while `p` and `subject` tags
 * should be encrypted in the content field using NIP-44.
 */
export function createChatsListEvent(chatIds: string[], encryptedContent?: string): EventTemplate {
  const tags: string[][] = chatIds.map(id => ['h', id])

  return {
    kind: ChatsList,
    tags,
    content: encryptedContent ?? '',
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Parse a kind 11750 chats list event.
 * Returns the list of chat identifiers from `h` tags.
 * The encrypted content (participants, subject) must be decrypted separately.
 */
export function parseChatsListEvent(event: NostrEvent): string[] {
  if (event.kind !== ChatsList) {
    throw new Error(`expected kind ${ChatsList}, got ${event.kind}`)
  }

  return event.tags
    .filter(t => t[0] === 'h')
    .map(t => t[1])
}

/**
 * Add a chat to an existing chats list event template.
 */
export function addChat(template: EventTemplate, chatId: string): EventTemplate {
  return {
    ...template,
    tags: [...template.tags, ['h', chatId]],
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Remove a chat from an existing chats list event template.
 */
export function removeChat(template: EventTemplate, chatId: string): EventTemplate {
  return {
    ...template,
    tags: template.tags.filter(t => !(t[0] === 'h' && t[1] === chatId)),
    created_at: Math.round(Date.now() / 1000),
  }
}
