/**
 * ICIP-7000: Rich Text Support
 *
 * The `rich_text` tag with Quill Delta format.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-7000.md
 */

// --- Types ---

export type RichTextProtocol = 'quill_delta'

// --- Functions ---

/**
 * Create a `rich_text` tag.
 * Format: ["rich_text", <protocol>, <content>]
 */
export function createRichTextTag(content: string, protocol: RichTextProtocol = 'quill_delta'): string[] {
  return ['rich_text', protocol, content]
}

/**
 * Parse a `rich_text` tag from an event's tags.
 * Returns null if not present.
 */
export function parseRichText(tags: string[][]): { protocol: RichTextProtocol; content: string } | null {
  const tag = tags.find(t => t[0] === 'rich_text')
  if (!tag || tag.length < 3) return null
  return { protocol: tag[1] as RichTextProtocol, content: tag[2] }
}

/**
 * Parse Quill Delta JSON from a rich_text tag.
 */
export function parseQuillDelta(tags: string[][]): any | null {
  const richText = parseRichText(tags)
  if (!richText || richText.protocol !== 'quill_delta') return null
  return JSON.parse(richText.content)
}
