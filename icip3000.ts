/**
 * ICIP-3000: Moderated Large Scale Communities
 *
 * Community definition (kind 31750), join (1750), transfer (1751),
 * ban (1752), and update patches (1753). UUIDv7 `h` tag identifier.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-3000.md
 */

import { EventTemplate, NostrEvent } from './core.ts'
import {
  IONCommunityDefinition,
  CommunityJoin,
  CommunityTransfer,
  CommunityBan,
  CommunityChange,
} from './kinds.ts'

// --- Types ---

export type CommunityOpenness = 'open' | 'closed'
export type CommunityVisibility = 'public' | 'private'
export type CommunityRole = 'admin' | 'moderator' | 'user'

export interface CommunityMember {
  pubkey: string
  role: CommunityRole
  relay?: string
}

export interface CommunityDefinitionOptions {
  /** UUIDv7 identifier */
  id: string
  name: string
  description?: string
  /** Image metadata tags */
  imeta?: string[][]
  openness?: CommunityOpenness
  visibility?: CommunityVisibility
  /** Admins and moderators */
  members?: CommunityMember[]
  /** Additional tags */
  tags?: string[][]
}

export interface ParsedCommunityDefinition {
  id: string
  name: string
  description?: string
  openness: CommunityOpenness
  visibility: CommunityVisibility
  admins: string[]
  moderators: string[]
}

// --- Community Definition (kind 31750) ---

/**
 * Create a kind 31750 community definition event template.
 */
export function createCommunityDefinition(opts: CommunityDefinitionOptions): EventTemplate {
  const tags: string[][] = [
    ['d', opts.id],
    ['h', opts.id],
    ['name', opts.name],
  ]

  if (opts.description) {
    tags.push(['description', opts.description])
  }
  if (opts.openness) {
    tags.push(['openness', opts.openness])
  }
  if (opts.visibility) {
    tags.push(['visibility', opts.visibility])
  }
  if (opts.imeta) {
    for (const meta of opts.imeta) {
      tags.push(['imeta', ...meta])
    }
  }
  if (opts.members) {
    for (const m of opts.members) {
      const pTag = ['p', m.pubkey, m.relay ?? '', m.role]
      tags.push(pTag)
    }
  }
  if (opts.tags) {
    tags.push(...opts.tags)
  }

  return {
    kind: IONCommunityDefinition,
    tags,
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}

/**
 * Parse a kind 31750 community definition event.
 */
export function parseCommunityDefinition(event: NostrEvent): ParsedCommunityDefinition {
  const id = event.tags.find(t => t[0] === 'h')?.[1] ?? event.tags.find(t => t[0] === 'd')?.[1]
  if (!id) throw new Error('missing h/d tag in community definition')

  const name = event.tags.find(t => t[0] === 'name')?.[1] ?? ''
  const description = event.tags.find(t => t[0] === 'description')?.[1]
  const openness = (event.tags.find(t => t[0] === 'openness')?.[1] ?? 'open') as CommunityOpenness
  const visibility = (event.tags.find(t => t[0] === 'visibility')?.[1] ?? 'public') as CommunityVisibility

  const admins = event.tags.filter(t => t[0] === 'p' && t[3] === 'admin').map(t => t[1])
  const moderators = event.tags.filter(t => t[0] === 'p' && t[3] === 'moderator').map(t => t[1])

  return { id, name, description, openness, visibility, admins, moderators }
}

// --- Community Join (kind 1750) ---

/**
 * Create a kind 1750 community join event template.
 */
export function createCommunityJoin(communityId: string, tags?: string[][]): EventTemplate {
  return {
    kind: CommunityJoin,
    tags: [['h', communityId], ...(tags ?? [])],
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}

// --- Community Transfer (kind 1751) ---

/**
 * Create a kind 1751 community ownership transfer event template.
 * This is a short-lived event that transfers ownership to a new admin.
 */
export function createCommunityTransfer(communityId: string, newOwnerPubkey: string): EventTemplate {
  return {
    kind: CommunityTransfer,
    tags: [['h', communityId], ['p', newOwnerPubkey]],
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}

// --- Community Ban (kind 1752) ---

/**
 * Create a kind 1752 community ban event template.
 */
export function createCommunityBan(communityId: string, targetPubkey: string, reason?: string): EventTemplate {
  return {
    kind: CommunityBan,
    tags: [['h', communityId], ['p', targetPubkey]],
    content: reason ?? '',
    created_at: Math.round(Date.now() / 1000),
  }
}

// --- Community Change (kind 1753) ---

/**
 * Create a kind 1753 community change event template.
 * These are additive chronological patches to the community definition.
 */
export function createCommunityChange(communityId: string, changeTags: string[][]): EventTemplate {
  return {
    kind: CommunityChange,
    tags: [['h', communityId], ...changeTags],
    content: '',
    created_at: Math.round(Date.now() / 1000),
  }
}

// --- Helpers ---

/**
 * Extract community id from an event's `h` tag.
 */
export function getCommunityId(event: { tags: string[][] }): string | null {
  return event.tags.find(t => t[0] === 'h')?.[1] ?? null
}

/**
 * Check if a pubkey has a specific role in a community definition event.
 */
export function hasRole(event: NostrEvent, pubkey: string, role: CommunityRole): boolean {
  if (role === 'user') return true
  return event.tags.some(t => t[0] === 'p' && t[1] === pubkey && t[3] === role)
}

/**
 * Check if a pubkey is an admin (either explicit admin role or the community creator).
 */
export function isAdmin(event: NostrEvent, pubkey: string): boolean {
  return event.pubkey === pubkey || hasRole(event, pubkey, 'admin')
}
