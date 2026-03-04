/**
 * ICIP-11: Relay Information Document Extensions
 *
 * Extends NIP-11 relay info with system_metrics, system_status, and FCM configs.
 *
 * @see https://github.com/ArcticMaj/subzero/.ion-connect-protocol/ICIP-11.md
 */

import { RelayInformation, fetchRelayInformation } from './nip11.ts'

// --- Types ---

export interface SystemMetrics {
  used_file_storage?: number
  used_database_storage?: number
  used_total_storage?: number
  used_memory?: number
  /** Percentage (0-100) */
  used_cpu?: number
  /** Bytes per second */
  used_bandwidth?: number
}

export type SystemFunctionality =
  | 'publishing_events'
  | 'subscribing_for_events'
  | 'dvm'
  | 'uploading_files'
  | 'reading_files'
  | 'sending_push_notifications'

export type SystemStatusValue = 'UP' | 'DOWN' | 'MAINTENANCE'

export type SystemStatus = Partial<Record<SystemFunctionality, SystemStatusValue>>

export interface FCMConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
  vapidKey?: string
}

export interface IONRelayInformation extends RelayInformation {
  privacy_policy?: string
  terms_of_service?: string
  system_metrics?: SystemMetrics
  system_status?: SystemStatus
  fcm_android?: FCMConfig
  fcm_ios?: FCMConfig
  fcm_web?: FCMConfig
}

// --- Functions ---

/**
 * Fetch ION relay information document (extended NIP-11).
 */
export async function fetchIONRelayInformation(url: string): Promise<IONRelayInformation> {
  return (await fetchRelayInformation(url)) as IONRelayInformation
}

/**
 * Check if a relay is healthy based on system_status.
 * Returns true if all reported statuses are 'UP'.
 */
export function isRelayHealthy(info: IONRelayInformation): boolean {
  if (!info.system_status) return true
  return Object.values(info.system_status).every(s => s === 'UP')
}

/**
 * Get status of a specific relay functionality.
 */
export function getFunctionalityStatus(
  info: IONRelayInformation,
  functionality: SystemFunctionality,
): SystemStatusValue | undefined {
  return info.system_status?.[functionality]
}

/**
 * Check if a relay supports push notifications (has FCM config for at least one platform).
 */
export function supportsPushNotifications(info: IONRelayInformation): boolean {
  return !!(info.fcm_android || info.fcm_ios || info.fcm_web)
}
