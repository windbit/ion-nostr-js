import { test, expect } from 'bun:test'
import {
  createSettingsTag,
  parseSettings,
  getEffectiveSetting,
  areCommentsEnabled,
  getRoleRequiredForPosting,
  getWhoCanReply,
} from './icip4000.ts'

test('createSettingsTag', () => {
  const tag = createSettingsTag('comments_enabled', 'true', 1700000000)
  expect(tag).toEqual(['settings', 'comments_enabled', 'true', '1700000000'])
})

test('parseSettings extracts all settings tags', () => {
  const tags = [
    ['settings', 'comments_enabled', 'true', '1000'],
    ['settings', 'who_can_reply', 'following', '2000'],
    ['p', 'abc'],
  ]
  const s = parseSettings(tags)
  expect(s.length).toBe(2)
  expect(s[0].name).toBe('comments_enabled')
  expect(s[1].name).toBe('who_can_reply')
})

test('getEffectiveSetting: latest timestamp wins', () => {
  const tags = [
    ['settings', 'comments_enabled', 'true', '1000'],
    ['settings', 'comments_enabled', 'false', '2000'],
  ]
  expect(getEffectiveSetting(tags, 'comments_enabled')).toBe('false')
})

test('getEffectiveSetting: missing → null', () => {
  expect(getEffectiveSetting([], 'comments_enabled')).toBeNull()
})

test('areCommentsEnabled: default true', () => {
  expect(areCommentsEnabled([])).toBe(true)
})

test('areCommentsEnabled: explicit false', () => {
  const tags = [['settings', 'comments_enabled', 'false', '1000']]
  expect(areCommentsEnabled(tags)).toBe(false)
})

test('getRoleRequiredForPosting', () => {
  const tags = [['settings', 'role_required_for_posting', 'moderator', '1000']]
  expect(getRoleRequiredForPosting(tags)).toBe('moderator')
})

test('getWhoCanReply: badge restriction', () => {
  const tags = [['settings', 'who_can_reply', 'badge|30009:pk:badge-d', '1000']]
  expect(getWhoCanReply(tags)).toBe('badge|30009:pk:badge-d')
})
