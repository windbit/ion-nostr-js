/**
 * ICIP-9000: Fiat Payment Proof
 *
 * Kind 1758 event signed by a trusted entity to prove fiat payment.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-9000.md
 */

import { EventTemplate, NostrEvent } from './core.ts'
import { FiatPaymentProof } from './kinds.ts'

// --- Types ---

export interface FiatPaymentProofOptions {
  /** Pubkey of the payer */
  payerPubkey: string
  /** Payment URL (receipt/reference) */
  paymentUrl: string
  /** Label namespace (L tag) */
  namespace: string
  /** Label value — product definition or id (l tag) */
  label: string
}

// --- Functions ---

/**
 * Create a kind 1758 fiat payment proof event template.
 * This event should be signed by a trusted entity (not the payer).
 */
export function createFiatPaymentProof(opts: FiatPaymentProofOptions): EventTemplate {
  return {
    kind: FiatPaymentProof,
    tags: [
      ['p', opts.payerPubkey],
      ['r', opts.paymentUrl],
      ['L', opts.namespace],
      ['l', opts.label],
    ],
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Parse a kind 1758 fiat payment proof event.
 */
export function parseFiatPaymentProof(event: NostrEvent): {
  payerPubkey: string
  paymentUrl: string
  namespace: string
  label: string
  signerPubkey: string
} {
  return {
    payerPubkey: event.tags.find(t => t[0] === 'p')?.[1] ?? '',
    paymentUrl: event.tags.find(t => t[0] === 'r')?.[1] ?? '',
    namespace: event.tags.find(t => t[0] === 'L')?.[1] ?? '',
    label: event.tags.find(t => t[0] === 'l')?.[1] ?? '',
    signerPubkey: event.pubkey,
  }
}
