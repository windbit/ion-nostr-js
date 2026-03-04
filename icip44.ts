/**
 * ICIP-44: Encrypted Payloads with Compression
 *
 * Extends NIP-44 encryption with brotli/zlib payload compression.
 * The compression is applied BEFORE encryption and indicated via
 * a `payload-compression` tag on the kind 1059 gift wrap event.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-44.md
 */

import { encrypt as nip44Encrypt, decrypt as nip44Decrypt, getConversationKey } from './nip44.ts'

// --- Types ---

export type CompressionAlgorithm = 'zlib' | 'brotli'

// --- Compression (using fflate for browser compatibility) ---

let _fflate: any = null

async function getFflate() {
  if (!_fflate) {
    _fflate = await import('fflate')
  }
  return _fflate
}

/**
 * Compress data using the specified algorithm.
 * Requires `fflate` package to be installed.
 */
export async function compress(data: Uint8Array, algorithm: CompressionAlgorithm): Promise<Uint8Array> {
  const fflate = await getFflate()

  if (algorithm === 'zlib') {
    return new Promise<Uint8Array>((resolve, reject) => {
      fflate.zlibSync ? resolve(fflate.zlibSync(data)) :
        fflate.zlib(data, (err: Error | null, result: Uint8Array) => {
          if (err) reject(err)
          else resolve(result)
        })
    })
  }

  // fflate doesn't support brotli — for brotli we'd need a different library
  // For now, throw an error for brotli in browser environments
  throw new Error('brotli compression requires a brotli-compatible library (not available in fflate)')
}

/**
 * Decompress data using the specified algorithm.
 */
export async function decompress(data: Uint8Array, algorithm: CompressionAlgorithm): Promise<Uint8Array> {
  const fflate = await getFflate()

  if (algorithm === 'zlib') {
    return new Promise<Uint8Array>((resolve, reject) => {
      fflate.unzlibSync ? resolve(fflate.unzlibSync(data)) :
        fflate.unzlib(data, (err: Error | null, result: Uint8Array) => {
          if (err) reject(err)
          else resolve(result)
        })
    })
  }

  throw new Error('brotli decompression requires a brotli-compatible library (not available in fflate)')
}

// --- Encrypt/Decrypt with Compression ---

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

/**
 * Compress and then NIP-44 encrypt a plaintext string.
 * Returns the encrypted payload string (base64).
 */
export async function encryptWithCompression(
  plaintext: string,
  conversationKey: Uint8Array,
  algorithm: CompressionAlgorithm = 'zlib',
): Promise<string> {
  const data = textEncoder.encode(plaintext)
  const compressed = await compress(data, algorithm)
  // Treat compressed bytes as a "plaintext" string by encoding as latin1
  const compressedStr = Array.from(compressed).map(b => String.fromCharCode(b)).join('')
  return nip44Encrypt(compressedStr, conversationKey)
}

/**
 * NIP-44 decrypt and then decompress a payload.
 * Returns the original plaintext string.
 */
export async function decryptWithCompression(
  payload: string,
  conversationKey: Uint8Array,
  algorithm: CompressionAlgorithm = 'zlib',
): Promise<string> {
  const compressedStr = nip44Decrypt(payload, conversationKey)
  // Decode latin1 back to bytes
  const compressed = new Uint8Array(compressedStr.length)
  for (let i = 0; i < compressedStr.length; i++) {
    compressed[i] = compressedStr.charCodeAt(i)
  }
  const decompressed = await decompress(compressed, algorithm)
  return textDecoder.decode(decompressed)
}

/**
 * Create the `payload-compression` tag for a kind 1059 gift wrap event.
 */
export function createPayloadCompressionTag(algorithm: CompressionAlgorithm): string[] {
  return ['payload-compression', algorithm]
}

/**
 * Extract the compression algorithm from a gift wrap event's tags.
 * Returns null if no compression tag is present.
 */
export function getPayloadCompression(tags: string[][]): CompressionAlgorithm | null {
  const tag = tags.find(t => t[0] === 'payload-compression')
  if (!tag) return null
  return tag[1] as CompressionAlgorithm
}
