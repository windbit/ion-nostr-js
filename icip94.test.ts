import { test, expect } from 'bun:test'
import {
  createDurationTag,
  getDuration,
  createEncryptionKeyTag,
  getEncryptionKey,
} from './icip94.ts'

test('createDurationTag / getDuration round-trip', () => {
  const tag = createDurationTag(120)
  expect(tag).toEqual(['duration', '120'])
  expect(getDuration([tag])).toBe(120)
})

test('getDuration: missing tag → null', () => {
  expect(getDuration([['p', 'abc']])).toBeNull()
})

test('createEncryptionKeyTag / getEncryptionKey round-trip', () => {
  const tag = createEncryptionKeyTag('my-key-hex', 'my-nonce-hex', 'xchacha20')
  expect(tag).toEqual(['encryption-key', 'my-key-hex', 'my-nonce-hex', 'xchacha20'])
  const parsed = getEncryptionKey([tag])
  expect(parsed).toEqual({ key: 'my-key-hex', nonce: 'my-nonce-hex', algorithm: 'xchacha20' })
})

test('getEncryptionKey: missing tag → null', () => {
  expect(getEncryptionKey([['p', 'abc']])).toBeNull()
})

test('getEncryptionKey: incomplete tag → null', () => {
  expect(getEncryptionKey([['encryption-key', 'key-only']])).toBeNull()
})
