/**
 * ICIP-94: File Metadata Extensions
 *
 * Extends NIP-94 with `duration` tag for video files and
 * `encryption-key` tag for encrypted file content.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-94.md
 */

// --- Types ---

export interface EncryptionKey {
  key: string
  nonce: string
  algorithm: string
}

// --- Tag Helpers ---

/**
 * Create a `duration` tag for video files.
 * @param seconds Duration in seconds
 */
export function createDurationTag(seconds: number): string[] {
  return ['duration', String(seconds)]
}

/**
 * Parse a `duration` tag value from an event's tags.
 * Returns duration in seconds, or null if not present.
 */
export function getDuration(tags: string[][]): number | null {
  const tag = tags.find(t => t[0] === 'duration')
  if (!tag) return null
  const val = parseInt(tag[1], 10)
  return isNaN(val) ? null : val
}

/**
 * Create an `encryption-key` tag for encrypted file content.
 * Format: ["encryption-key", <key>, <nonce>, <algorithm>]
 */
export function createEncryptionKeyTag(key: string, nonce: string, algorithm: string): string[] {
  return ['encryption-key', key, nonce, algorithm]
}

/**
 * Parse an `encryption-key` tag from an event's tags.
 * Returns null if not present.
 */
export function getEncryptionKey(tags: string[][]): EncryptionKey | null {
  const tag = tags.find(t => t[0] === 'encryption-key')
  if (!tag || tag.length < 4) return null
  return { key: tag[1], nonce: tag[2], algorithm: tag[3] }
}
