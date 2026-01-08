/**
 * @file index.ts
 * @brief Exportações do core SIP
 */

export { SipClient } from './sipClient'
export { createSipClient, isNativeAvailable, requiresNative, getAvailableBackends } from './sipClientFactory'
export type { ISipClient, SipClientEvents } from './sipClientInterface'
