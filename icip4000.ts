/**
 * ICIP-4000: Generic Event Settings
 *
 * The `settings` tag: comments_enabled, role_required_for_posting, who_can_reply.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-4000.md
 */

// --- Types ---

export type SettingName = 'comments_enabled' | 'role_required_for_posting' | 'who_can_reply'

export type WhoCanReply = 'following' | 'mentioned' | `badge|${string}`

export interface EventSetting {
  name: SettingName
  value: string
  timestamp: number
}

// --- Functions ---

/**
 * Create a `settings` tag.
 * Format: ["settings", "<name>", "<value>", <Unix timestamp>]
 */
export function createSettingsTag(name: SettingName, value: string, timestamp?: number): string[] {
  return ['settings', name, value, String(timestamp ?? Math.round(Date.now() / 1000))]
}

/**
 * Parse all `settings` tags from an event.
 */
export function parseSettings(tags: string[][]): EventSetting[] {
  return tags
    .filter(t => t[0] === 'settings' && t.length >= 4)
    .map(t => ({
      name: t[1] as SettingName,
      value: t[2],
      timestamp: parseInt(t[3], 10),
    }))
}

/**
 * Get the effective value of a setting (latest by timestamp).
 */
export function getEffectiveSetting(tags: string[][], name: SettingName): string | null {
  const settings = parseSettings(tags).filter(s => s.name === name)
  if (settings.length === 0) return null
  settings.sort((a, b) => b.timestamp - a.timestamp)
  return settings[0].value
}

/**
 * Check if comments are enabled for an event.
 */
export function areCommentsEnabled(tags: string[][]): boolean {
  const val = getEffectiveSetting(tags, 'comments_enabled')
  return val !== 'false'
}

/**
 * Get the role required for posting in a community context.
 */
export function getRoleRequiredForPosting(tags: string[][]): string | null {
  return getEffectiveSetting(tags, 'role_required_for_posting')
}

/**
 * Get the who_can_reply restriction.
 */
export function getWhoCanReply(tags: string[][]): WhoCanReply | null {
  return getEffectiveSetting(tags, 'who_can_reply') as WhoCanReply | null
}
