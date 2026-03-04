/**
 * ICIP-7001: Positional Markdown Override (PMO)
 *
 * The `pmo` tag allows replacing portions of kind 1 content with markdown.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-7001.md
 */

// --- Types ---

export interface PMOEntry {
  startIndex: number
  endIndex: number
  markdown: string
}

// --- Functions ---

/**
 * Create a `pmo` tag.
 * Format: ["pmo", "<startIndex>:<endIndex>", "<markdown replacement>"]
 */
export function createPMOTag(startIndex: number, endIndex: number, markdown: string): string[] {
  return ['pmo', `${startIndex}:${endIndex}`, markdown]
}

/**
 * Parse all `pmo` tags from an event's tags.
 */
export function parsePMOTags(tags: string[][]): PMOEntry[] {
  return tags
    .filter(t => t[0] === 'pmo' && t.length >= 3)
    .map(t => {
      const [start, end] = t[1].split(':').map(Number)
      return { startIndex: start, endIndex: end, markdown: t[2] }
    })
}

/**
 * Apply PMO entries to a plain text content string.
 * Returns the final string with markdown replacements applied.
 * Entries are applied in reverse order to preserve indices.
 */
export function applyPMO(content: string, entries: PMOEntry[]): string {
  const sorted = [...entries].sort((a, b) => b.startIndex - a.startIndex)
  let result = content
  for (const entry of sorted) {
    result = result.substring(0, entry.startIndex) + entry.markdown + result.substring(entry.endIndex)
  }
  return result
}
