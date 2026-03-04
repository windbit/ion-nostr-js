/**
 * ICIP-5000: Poll & Vote Event
 *
 * `poll` tag on message events, kind 1754 for voting.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-5000.md
 */

import { EventTemplate, NostrEvent } from './core.ts'
import { PollVote } from './kinds.ts'

// --- Types ---

export type PollType = 'single' | 'multi'

export interface PollDefinition {
  type: PollType
  /** TTL in seconds. 0 = no expiration */
  ttl: number
  title: string
  options: string[]
}

// --- Poll Tag ---

/**
 * Create a `poll` tag.
 * Format: ["poll", "type single|multi", "ttl 0", "title ...", "options [...]"]
 */
export function createPollTag(poll: PollDefinition): string[] {
  return [
    'poll',
    `type ${poll.type}`,
    `ttl ${poll.ttl}`,
    `title ${poll.title}`,
    `options ${JSON.stringify(poll.options)}`,
  ]
}

/**
 * Parse a `poll` tag from an event.
 */
export function parsePollTag(tags: string[][]): PollDefinition | null {
  const tag = tags.find(t => t[0] === 'poll')
  if (!tag) return null

  let type: PollType = 'single'
  let ttl = 0
  let title = ''
  let options: string[] = []

  for (let i = 1; i < tag.length; i++) {
    const val = tag[i]
    if (val.startsWith('type ')) {
      type = val.substring(5) as PollType
    } else if (val.startsWith('ttl ')) {
      ttl = parseInt(val.substring(4), 10)
    } else if (val.startsWith('title ')) {
      title = val.substring(6)
    } else if (val.startsWith('options ')) {
      options = JSON.parse(val.substring(8))
    }
  }

  return { type, ttl, title, options }
}

/**
 * Check if a poll has expired based on the event created_at and TTL.
 */
export function isPollExpired(eventCreatedAt: number, ttl: number, now?: number): boolean {
  if (ttl === 0) return false
  const currentTime = now ?? Math.round(Date.now() / 1000)
  return currentTime > eventCreatedAt + ttl
}

// --- Vote Event (kind 1754) ---

/**
 * Create a kind 1754 vote event template.
 * Content is a JSON array of selected option indices.
 */
export function createVote(
  pollEventId: string,
  selectedOptions: number[],
  pollEventPubkey?: string,
): EventTemplate {
  const tags: string[][] = [['e', pollEventId]]
  if (pollEventPubkey) {
    tags.push(['p', pollEventPubkey])
  }

  return {
    kind: PollVote,
    tags,
    content: JSON.stringify(selectedOptions),
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Parse a kind 1754 vote event.
 * Returns the selected option indices and the referenced poll event id.
 */
export function parseVote(event: NostrEvent): { pollEventId: string; selectedOptions: number[] } {
  const pollEventId = event.tags.find(t => t[0] === 'e')?.[1]
  if (!pollEventId) throw new Error('missing e tag in vote event')

  const selectedOptions: number[] = JSON.parse(event.content)
  return { pollEventId, selectedOptions }
}
