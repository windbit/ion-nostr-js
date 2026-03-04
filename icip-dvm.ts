/**
 * DVM Extensions: ICIP-5175, ICIP-5176, ICIP-5177, ICIP-5178
 *
 * Data Vending Machine job requests and responses for:
 * - Hashtag statistics (5175/6175)
 * - Price changes for tokenized communities (5176/6176)
 * - Global token statistics (5177/6177)
 * - Buying activity inspection (5178/6178)
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/dvm/
 */

import { EventTemplate, NostrEvent } from './core.ts'
import {
  DVMHashtagStats,
  DVMPriceChanges,
  DVMTokenStats,
  DVMBuyingActivity,
  DVMHashtagStatsResponse,
  DVMPriceChangesResponse,
  DVMTokenStatsResponse,
  DVMBuyingActivityResponse,
} from './kinds.ts'

// --- ICIP-5175: Hashtag Statistics ---

/**
 * Create a kind 5175 hashtag statistics job request.
 * @param prefix Optional prefix keyword to filter hashtags
 * @param limit Max results (default 10)
 */
export function createHashtagStatsRequest(prefix?: string, limit?: number): EventTemplate {
  const tags: string[][] = []
  if (prefix) {
    tags.push(['i', prefix, 'text', '', 'top'])
  }
  if (limit !== undefined) {
    tags.push(['param', 'limit', String(limit)])
  }

  return {
    kind: DVMHashtagStats,
    tags,
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Parse a kind 6175 hashtag statistics response.
 * Returns an array of hashtag strings.
 */
export function parseHashtagStatsResponse(event: NostrEvent): string[] {
  return JSON.parse(event.content)
}

// --- ICIP-5176: Price Changes ---

export interface PriceChangeParams {
  /** Addressable reference to a kind 31175 token definition */
  tokenRef: string
  /** Time window in seconds */
  timeWindow: number
  /** Delta percentage (signed, e.g. 5.0 or -3.0) */
  deltaPercentage: number
}

/**
 * Create a kind 5176 price change detection job request.
 */
export function createPriceChangeRequest(params: PriceChangeParams): EventTemplate {
  return {
    kind: DVMPriceChanges,
    tags: [
      ['i', 'priceChange', 'text'],
      ['param', 'token', params.tokenRef],
      ['param', 'timeWindow', String(params.timeWindow)],
      ['param', 'deltaPercentage', String(params.deltaPercentage)],
    ],
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Parse a kind 6176 price change response.
 * Returns array of token action events (may be empty if no change detected).
 */
export function parsePriceChangeResponse(event: NostrEvent): NostrEvent[] {
  const content = event.content
  if (!content) return []
  return JSON.parse(content)
}

// --- ICIP-5177: Global Token Statistics ---

/**
 * Create a kind 5177 global token statistics job request.
 */
export function createTokenStatsRequest(): EventTemplate {
  return {
    kind: DVMTokenStats,
    tags: [['i', 'trending', 'text']],
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Parse a kind 6177 global token statistics response.
 * Returns array of token action (1175) and definition (31175) events.
 */
export function parseTokenStatsResponse(event: NostrEvent): NostrEvent[] {
  return JSON.parse(event.content)
}

// --- ICIP-5178: Buying Activity Inspection ---

/**
 * Create a kind 5178 buying activity inspection job request.
 * @param authorPubkey The `b` tag pubkey of the 31175 token definition creator
 */
export function createBuyingActivityRequest(authorPubkey: string): EventTemplate {
  return {
    kind: DVMBuyingActivity,
    tags: [
      ['i', 'inspectTokenBuyingActivity', 'text'],
      ['param', 'author', authorPubkey],
    ],
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}

export interface BuyingActivityResponse {
  events: NostrEvent[]
  /** User count and time window from the buying-activity tag */
  buyingActivity?: { userCount: string; timeWindow: string }
}

/**
 * Parse a kind 6178 buying activity response.
 */
export function parseBuyingActivityResponse(event: NostrEvent): BuyingActivityResponse {
  const events: NostrEvent[] = event.content ? JSON.parse(event.content) : []
  const baTag = event.tags.find(t => t[0] === 'buying-activity')
  const buyingActivity = baTag ? { userCount: baTag[1], timeWindow: baTag[2] } : undefined

  return { events, buyingActivity }
}
