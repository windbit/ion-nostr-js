/**
 * ICIP-11000: Tokenized Communities
 *
 * Kind 31175 (token definition), kind 1175 (action notification),
 * kind 4175 (activity consent).
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-11000.md
 */

import { EventTemplate, NostrEvent } from './core.ts'
import { CommunityTokenDefinition, TokenAction, ActivityConsent } from './kinds.ts'

// --- Types ---

export type TxType = 'buy' | 'sell' | 'swap'

export interface TokenDefinitionOptions {
  /** Reference to the source event (e or a tag) */
  sourceRef: { type: 'e'; id: string } | { type: 'a'; coordinate: string }
  /** On-behalf-of master pubkey (b tag) */
  masterPubkey?: string
  /** Allowed event kinds this token definition applies to (k tags) */
  kinds?: number[]
  /** Blockchain network */
  network: string
  /** Bonding curve contract address */
  bondingCurveAddress: string
  /** Token contract address */
  tokenAddress: string
  /** Token symbol */
  tokenSymbol: string
}

export interface TokenActionOptions {
  /** On-behalf-of master pubkey (b tag) */
  masterPubkey?: string
  /** Transaction type */
  txType: TxType
  /** Transaction address/hash */
  txAddress: string
  /** Transaction amount */
  txAmount: string
  /** Blockchain network */
  network: string
  /** Token contract address */
  tokenAddress: string
  /** Token symbol */
  tokenSymbol?: string
  /** Bonding curve address */
  bondingCurveAddress?: string
}

// --- Token Definition (kind 31175) ---

/**
 * Create a kind 31175 community token definition event template.
 */
export function createTokenDefinition(opts: TokenDefinitionOptions): EventTemplate {
  const tags: string[][] = []

  if (opts.masterPubkey) tags.push(['b', opts.masterPubkey])

  if (opts.sourceRef.type === 'e') {
    tags.push(['e', opts.sourceRef.id])
  } else {
    tags.push(['a', opts.sourceRef.coordinate])
  }

  if (opts.kinds) {
    for (const k of opts.kinds) {
      tags.push(['k', String(k)])
    }
  }

  tags.push(['network', opts.network])
  tags.push(['bonding_curve_address', opts.bondingCurveAddress])
  tags.push(['token_address', opts.tokenAddress])
  tags.push(['token_symbol', opts.tokenSymbol])

  return {
    kind: CommunityTokenDefinition,
    tags,
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Parse a kind 31175 token definition event.
 */
export function parseTokenDefinition(event: NostrEvent): {
  network: string
  bondingCurveAddress: string
  tokenAddress: string
  tokenSymbol: string
  masterPubkey?: string
  kinds: number[]
} {
  return {
    network: event.tags.find(t => t[0] === 'network')?.[1] ?? '',
    bondingCurveAddress: event.tags.find(t => t[0] === 'bonding_curve_address')?.[1] ?? '',
    tokenAddress: event.tags.find(t => t[0] === 'token_address')?.[1] ?? '',
    tokenSymbol: event.tags.find(t => t[0] === 'token_symbol')?.[1] ?? '',
    masterPubkey: event.tags.find(t => t[0] === 'b')?.[1],
    kinds: event.tags.filter(t => t[0] === 'k').map(t => parseInt(t[1], 10)),
  }
}

// --- Token Action (kind 1175) ---

/**
 * Create a kind 1175 token action notification event template.
 */
export function createTokenAction(opts: TokenActionOptions): EventTemplate {
  const tags: string[][] = []

  if (opts.masterPubkey) tags.push(['b', opts.masterPubkey])

  tags.push(['tx_type', opts.txType])
  tags.push(['tx_address', opts.txAddress])
  tags.push(['tx_amount', opts.txAmount])
  tags.push(['network', opts.network])
  tags.push(['token_address', opts.tokenAddress])

  if (opts.tokenSymbol) tags.push(['token_symbol', opts.tokenSymbol])
  if (opts.bondingCurveAddress) tags.push(['bonding_curve_address', opts.bondingCurveAddress])

  return {
    kind: TokenAction,
    tags,
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Parse a kind 1175 token action event.
 */
export function parseTokenAction(event: NostrEvent): {
  txType: TxType
  txAddress: string
  txAmount: string
  network: string
  tokenAddress: string
  tokenSymbol?: string
  masterPubkey?: string
} {
  return {
    txType: (event.tags.find(t => t[0] === 'tx_type')?.[1] ?? 'buy') as TxType,
    txAddress: event.tags.find(t => t[0] === 'tx_address')?.[1] ?? '',
    txAmount: event.tags.find(t => t[0] === 'tx_amount')?.[1] ?? '',
    network: event.tags.find(t => t[0] === 'network')?.[1] ?? '',
    tokenAddress: event.tags.find(t => t[0] === 'token_address')?.[1] ?? '',
    tokenSymbol: event.tags.find(t => t[0] === 'token_symbol')?.[1],
    masterPubkey: event.tags.find(t => t[0] === 'b')?.[1],
  }
}

// --- Activity Consent (kind 4175) ---

/**
 * Create a kind 4175 activity consent event template.
 * User opts in to displaying tokenized community activity.
 */
export function createActivityConsent(): EventTemplate {
  return {
    kind: ActivityConsent,
    tags: [],
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}
