import { test, expect } from 'bun:test'
import { isRelayHealthy, getFunctionalityStatus, supportsPushNotifications } from './icip11.ts'
import type { IONRelayInformation } from './icip11.ts'

const baseInfo: IONRelayInformation = {
  name: 'test-relay',
  description: 'test',
  pubkey: 'abc',
  contact: 'admin@test.com',
  supported_nips: [1, 11],
  software: 'subzero',
  version: '1.0.0',
}

test('isRelayHealthy: no status → healthy', () => {
  expect(isRelayHealthy(baseInfo)).toBe(true)
})

test('isRelayHealthy: all UP → healthy', () => {
  expect(isRelayHealthy({
    ...baseInfo,
    system_status: { publishing_events: 'UP', subscribing_for_events: 'UP' },
  })).toBe(true)
})

test('isRelayHealthy: one DOWN → unhealthy', () => {
  expect(isRelayHealthy({
    ...baseInfo,
    system_status: { publishing_events: 'UP', uploading_files: 'DOWN' },
  })).toBe(false)
})

test('isRelayHealthy: MAINTENANCE → unhealthy', () => {
  expect(isRelayHealthy({
    ...baseInfo,
    system_status: { dvm: 'MAINTENANCE' },
  })).toBe(false)
})

test('getFunctionalityStatus returns correct value', () => {
  const info: IONRelayInformation = {
    ...baseInfo,
    system_status: { publishing_events: 'UP', dvm: 'DOWN' },
  }
  expect(getFunctionalityStatus(info, 'publishing_events')).toBe('UP')
  expect(getFunctionalityStatus(info, 'dvm')).toBe('DOWN')
  expect(getFunctionalityStatus(info, 'uploading_files')).toBeUndefined()
})

test('supportsPushNotifications: no FCM → false', () => {
  expect(supportsPushNotifications(baseInfo)).toBe(false)
})

test('supportsPushNotifications: has FCM → true', () => {
  expect(supportsPushNotifications({
    ...baseInfo,
    fcm_web: {
      apiKey: 'key', authDomain: 'test.firebaseapp.com',
      projectId: 'test', storageBucket: 'test.appspot.com',
      messagingSenderId: '123', appId: '1:123:web:abc',
    },
  })).toBe(true)
})
