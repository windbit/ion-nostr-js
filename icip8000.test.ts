import { test, expect } from 'bun:test'
import {
  createDeviceRegistration,
  parseDeviceRegistration,
  canUpdateToken,
  MIN_TOKEN_UPDATE_INTERVAL,
} from './icip8000.ts'
import { finalizeEvent, generateSecretKey } from './pure.ts'
import { DeviceRegistration } from './kinds.ts'

test('createDeviceRegistration: correct kind and tags', () => {
  const t = createDeviceRegistration({
    deviceId: 'device-123',
    os: 'ios',
    relayUrl: 'wss://relay.ion.io',
    encryptedToken: 'encrypted-fcm-token',
    subscriptionFilters: JSON.stringify([{ kinds: [1] }]),
  })
  expect(t.kind).toBe(DeviceRegistration)
  expect(t.tags.find(t => t[0] === 'd')?.[1]).toBe('device-123')
  expect(t.tags.find(t => t[0] === 't')?.[1]).toBe('ios')
  expect(t.tags.find(t => t[0] === 'relay')?.[1]).toBe('wss://relay.ion.io')
  expect(t.tags.find(t => t[0] === 'token')?.[1]).toBe('encrypted-fcm-token')
})

test('parseDeviceRegistration round-trip', () => {
  const sk = generateSecretKey()
  const event = finalizeEvent(
    createDeviceRegistration({
      deviceId: 'dev-1',
      os: 'android',
      relayUrl: 'wss://r.com',
      encryptedToken: 'tok',
    }),
    sk,
  )
  const parsed = parseDeviceRegistration(event)
  expect(parsed.deviceId).toBe('dev-1')
  expect(parsed.os).toBe('android')
  expect(parsed.relayUrl).toBe('wss://r.com')
  expect(parsed.encryptedToken).toBe('tok')
})

test('canUpdateToken: too soon → false', () => {
  const lastUpdate = 1000
  expect(canUpdateToken(lastUpdate, lastUpdate + 100)).toBe(false)
})

test('canUpdateToken: after interval → true', () => {
  const lastUpdate = 1000
  expect(canUpdateToken(lastUpdate, lastUpdate + MIN_TOKEN_UPDATE_INTERVAL)).toBe(true)
})
