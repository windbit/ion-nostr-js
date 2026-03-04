/**
 * ICIP-8000: Push Notifications
 *
 * Kind 31751 device token registration with encrypted FCM token.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-8000.md
 */

import { EventTemplate, NostrEvent } from './core.ts'
import { DeviceRegistration } from './kinds.ts'

// --- Types ---

export type DeviceOS = 'android' | 'ios' | 'web'

export interface DeviceRegistrationOptions {
  /** Device identifier (d tag) */
  deviceId: string
  /** Operating system */
  os: DeviceOS
  /** Relay URL this registration targets */
  relayUrl: string
  /** FCM token (should be encrypted with NIP-44 using relay pubkey) */
  encryptedToken: string
  /** NIP-01 subscription filters for selective notifications (as content) */
  subscriptionFilters?: string
}

// --- Functions ---

/**
 * Create a kind 31751 device registration event template.
 * The `token` tag value should be pre-encrypted with NIP-44 using the relay's pubkey.
 */
export function createDeviceRegistration(opts: DeviceRegistrationOptions): EventTemplate {
  return {
    kind: DeviceRegistration,
    tags: [
      ['d', opts.deviceId],
      ['t', opts.os],
      ['relay', opts.relayUrl],
      ['token', opts.encryptedToken],
    ],
    content: opts.subscriptionFilters ?? '',
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Parse a kind 31751 device registration event.
 */
export function parseDeviceRegistration(event: NostrEvent): {
  deviceId: string
  os: DeviceOS
  relayUrl: string
  encryptedToken: string
  subscriptionFilters?: string
} {
  return {
    deviceId: event.tags.find(t => t[0] === 'd')?.[1] ?? '',
    os: (event.tags.find(t => t[0] === 't')?.[1] ?? 'web') as DeviceOS,
    relayUrl: event.tags.find(t => t[0] === 'relay')?.[1] ?? '',
    encryptedToken: event.tags.find(t => t[0] === 'token')?.[1] ?? '',
    subscriptionFilters: event.content || undefined,
  }
}

/** Minimum interval between token updates (8 hours in seconds) */
export const MIN_TOKEN_UPDATE_INTERVAL = 8 * 60 * 60

/**
 * Check if a token update is allowed based on the minimum interval.
 */
export function canUpdateToken(lastUpdateTimestamp: number, now?: number): boolean {
  const currentTime = now ?? Math.round(Date.now() / 1000)
  return currentTime - lastUpdateTimestamp >= MIN_TOKEN_UPDATE_INTERVAL
}
