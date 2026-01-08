/**
 * @file sipClientInterface.ts
 * @brief Interface comum para clientes SIP (WebSocket e Nativo)
 * 
 * Esta interface define o contrato que tanto o SipClient (sip.js/WebSocket)
 * quanto o NativeSipClient (PJSIP/UDP/TCP) devem implementar.
 */

import type { Invitation, Inviter, Session } from 'sip.js'
import type { SipClientSnapshot, SipCredentials, SipClientEvents as SipClientEventsType } from '../types'

// Re-exportar o tipo de eventos
export type SipClientEvents = SipClientEventsType

/**
 * Interface comum para clientes SIP
 */
export interface ISipClient {
  /**
   * Obtém o snapshot atual do estado
   */
  getSnapshot(): SipClientSnapshot

  /**
   * Conecta e registra no servidor SIP
   */
  connectAndRegister(credentials: SipCredentials): Promise<void>

  /**
   * Desregistra e desconecta
   */
  unregisterAndDisconnect(): Promise<void>

  /**
   * Define mute do microfone
   * @returns true se a operação foi aplicada
   */
  setMuted(nextMuted: boolean): boolean

  /**
   * Alterna mute
   * @returns true se a operação foi aplicada
   */
  toggleMuted(): boolean

  /**
   * Verifica se está em mute
   */
  isMuted(): boolean

  /**
   * Inicia uma chamada
   */
  startCall(target: string): Promise<void>

  /**
   * Atende uma chamada entrante
   */
  answer(): Promise<void>

  /**
   * Rejeita uma chamada entrante
   */
  reject(): Promise<void>

  /**
   * Encerra a chamada atual
   */
  hangup(): Promise<void>

  /**
   * Transferência cega
   */
  transferBlind(target: string): Promise<void>

  /**
   * Transferência assistida
   */
  transferAttended(target: string): Promise<void>

  /**
   * Envia DTMF
   * @returns true se enviado com sucesso
   */
  sendDtmf(tones: string): boolean

  /**
   * Obtém o domínio atual
   */
  getDomain(): string | undefined

  /**
   * Obtém a sessão ativa (apenas para sip.js)
   */
  getActiveSession(): Session | undefined

  /**
   * Obtém o invitation ativo (apenas para sip.js)
   */
  getActiveInvitation(): Invitation | undefined

  /**
   * Obtém o inviter ativo (apenas para sip.js)
   */
  getActiveInviter(): Inviter | undefined
}
