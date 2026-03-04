import { test, expect } from 'bun:test'
import { createPayloadCompressionTag, getPayloadCompression } from './icip44.ts'

// Note: compress/decompress and encryptWithCompression/decryptWithCompression
// require fflate to be installed. These tests cover the tag helpers
// which don't require fflate.

test('createPayloadCompressionTag: zlib', () => {
  const tag = createPayloadCompressionTag('zlib')
  expect(tag).toEqual(['payload-compression', 'zlib'])
})

test('createPayloadCompressionTag: brotli', () => {
  const tag = createPayloadCompressionTag('brotli')
  expect(tag).toEqual(['payload-compression', 'brotli'])
})

test('getPayloadCompression: finds tag', () => {
  const tags = [['p', 'abc'], ['payload-compression', 'zlib']]
  expect(getPayloadCompression(tags)).toBe('zlib')
})

test('getPayloadCompression: no tag → null', () => {
  const tags = [['p', 'abc']]
  expect(getPayloadCompression(tags)).toBeNull()
})
