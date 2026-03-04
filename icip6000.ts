/**
 * ICIP-6000: Request Blockchain Assets and Notify of Sending
 *
 * Kind 1755 (request funds) and kind 1756 (send notify).
 * Both should be rumor events wrapped in NIP-59.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-6000.md
 */

import { EventTemplate, NostrEvent } from './core.ts'
import { RequestFunds, SendNotify } from './kinds.ts'

// --- Types ---

export interface RequestFundsOptions {
  /** Recipient pubkey (who should send) */
  recipientPubkey: string
  /** Blockchain network name */
  network: string
  /** Asset class / token identifier */
  assetClass?: string
  /** Namespace (L tag) */
  namespace?: string
  /** Label (l tag) */
  label?: string
  /** Amount to request (in content) */
  content?: string
  /** Additional tags */
  tags?: string[][]
}

export interface SendNotifyOptions {
  /** Recipient pubkey (who received the funds) */
  recipientPubkey: string
  /** Transaction hash */
  txHash: string
  /** Transaction URL (explorer link) */
  txUrl?: string
  /** Blockchain network name */
  network: string
  /** Additional content */
  content?: string
  /** Additional tags */
  tags?: string[][]
}

// --- Request Funds (kind 1755) ---

/**
 * Create a kind 1755 request funds rumor template.
 * Should be wrapped in NIP-59 gift wrap.
 */
export function createRequestFunds(opts: RequestFundsOptions): EventTemplate {
  const tags: string[][] = [
    ['p', opts.recipientPubkey],
    ['network', opts.network],
  ]

  if (opts.assetClass) tags.push(['asset_class', opts.assetClass])
  if (opts.namespace) tags.push(['L', opts.namespace])
  if (opts.label) tags.push(['l', opts.label])
  if (opts.tags) tags.push(...opts.tags)

  return {
    kind: RequestFunds,
    tags,
    content: opts.content ?? '',
    created_at: Math.round(Date.now() / 1000),
  }
}

// --- Send Notify (kind 1756) ---

/**
 * Create a kind 1756 send notification rumor template.
 * Should be wrapped in NIP-59 gift wrap.
 */
export function createSendNotify(opts: SendNotifyOptions): EventTemplate {
  const tags: string[][] = [
    ['p', opts.recipientPubkey],
    ['network', opts.network],
    ['tx_hash', opts.txHash],
  ]

  if (opts.txUrl) tags.push(['tx_url', opts.txUrl])
  if (opts.tags) tags.push(...opts.tags)

  return {
    kind: SendNotify,
    tags,
    content: opts.content ?? '',
    created_at: Math.round(Date.now() / 1000),
  }
}

// --- Parsing ---

/**
 * Parse a request funds or send notify event.
 */
export function parseBlockchainEvent(event: NostrEvent): {
  recipientPubkey?: string
  network?: string
  assetClass?: string
  txHash?: string
  txUrl?: string
} {
  return {
    recipientPubkey: event.tags.find(t => t[0] === 'p')?.[1],
    network: event.tags.find(t => t[0] === 'network')?.[1],
    assetClass: event.tags.find(t => t[0] === 'asset_class')?.[1],
    txHash: event.tags.find(t => t[0] === 'tx_hash')?.[1],
    txUrl: event.tags.find(t => t[0] === 'tx_url')?.[1],
  }
}
