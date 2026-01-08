/**
 * @file sipClientFactory.ts
 * @brief Factory para criar o cliente SIP apropriado
 * 
 * Esta factory decide qual implementação de cliente SIP usar baseado
 * no protocolo de transporte selecionado:
 * - WSS: SipClient (sip.js + WebRTC)
 * - UDP/TCP: NativeSipClient (PJSIP via módulo nativo)
 */

import type { SipTransportProtocol } from '../types'
import type { ISipClient, SipClientEvents } from './sipClientInterface'
import { SipClient } from './sipClient'
import { NativeSipClient } from '../native/nativeSipClient'

/**
 * Verifica se o módulo nativo está disponível
 */
export function isNativeAvailable(): boolean {
  return typeof window !== 'undefined' && 'sipNative' in window
}

/**
 * Cria o cliente SIP apropriado para o protocolo especificado
 * 
 * @param protocol - Protocolo de transporte ('udp', 'tcp', ou 'wss')
 * @param events - Callbacks de eventos
 * @returns Instância do cliente SIP
 */
export function createSipClient(
  protocol: SipTransportProtocol,
  events: SipClientEvents
): ISipClient {
  // Para WSS, sempre usa sip.js (WebRTC)
  if (protocol === 'wss') {
    console.log('[SipFactory] Criando cliente WebSocket (sip.js)')
    return new SipClient(events)
  }

  // Para UDP/TCP, tenta usar o módulo nativo
  if (isNativeAvailable()) {
    console.log(`[SipFactory] Criando cliente nativo (PJSIP) para ${protocol.toUpperCase()}`)
    return new NativeSipClient(events)
  }

  // Fallback: se nativo não disponível, avisa e usa sip.js
  console.warn(
    `[SipFactory] Módulo nativo não disponível para ${protocol.toUpperCase()}. ` +
    'Usando WebSocket como fallback. Para usar UDP/TCP, compile o módulo nativo.'
  )
  return new SipClient(events)
}

/**
 * Verifica se o protocolo requer o módulo nativo
 */
export function requiresNative(protocol: SipTransportProtocol): boolean {
  return protocol === 'udp' || protocol === 'tcp'
}

/**
 * Obtém informações sobre os backends disponíveis
 */
export function getAvailableBackends(): {
  websocket: boolean
  native: boolean
  protocols: SipTransportProtocol[]
} {
  const native = isNativeAvailable()
  
  const protocols: SipTransportProtocol[] = ['wss']
  if (native) {
    protocols.push('udp', 'tcp')
  }

  return {
    websocket: true,
    native,
    protocols,
  }
}
