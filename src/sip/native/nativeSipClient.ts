/**
 * @file nativeSipClient.ts
 * @brief Cliente SIP nativo que usa PJSIP via IPC
 * 
 * Este arquivo implementa a interface ISipClient usando o módulo nativo
 * PJSIP para transporte UDP/TCP.
 */

import type {
  SipClientSnapshot,
  SipCredentials,
  SipConnectionState,
  CallStatus,
  SipCallDirection,
  IncomingCallInfo,
} from '../types'
import type { ISipClient, SipClientEvents } from '../core/sipClientInterface'

// Declaração global para o window.sipNative
declare global {
  interface Window {
    sipNative: {
      init(): Promise<{ success: boolean; error?: string }>
      destroy(): Promise<{ success: boolean }>
      isInitialized(): Promise<boolean>
      register(credentials: {
        username: string
        password: string
        server: string
        port: number
        transport: 'udp' | 'tcp'
      }): Promise<{ success: boolean; error?: string }>
      unregister(): Promise<{ success: boolean; error?: string }>
      makeCall(target: string): Promise<{ success: boolean; error?: string }>
      answerCall(): Promise<{ success: boolean; error?: string }>
      rejectCall(): Promise<{ success: boolean; error?: string }>
      hangupCall(): Promise<{ success: boolean; error?: string }>
      sendDtmf(digits: string): Promise<{ success: boolean; error?: string }>
      transferBlind(target: string): Promise<{ success: boolean; error?: string }>
      transferAttended(target: string): Promise<{ success: boolean; error?: string }>
      setMuted(muted: boolean): Promise<void>
      toggleMuted(): Promise<boolean>
      isMuted(): Promise<boolean>
      getAudioDevices(): Promise<Array<{
        id: number
        name: string
        inputCount: number
        outputCount: number
        isDefault: boolean
      }>>
      setAudioDevices(captureId: number, playbackId: number): Promise<{ success: boolean; error?: string }>
      getSnapshot(): Promise<NativeSnapshot>
      setEventCallback(): Promise<{ success: boolean; error?: string }>
      clearEventCallback(): Promise<{ success: boolean }>
      onEvent(callback: (data: { event: string; payload: string }) => void): () => void
    }
  }
}

// Tipo do snapshot nativo
interface NativeSnapshot {
  connection: string
  callStatus: string
  callDirection: string
  muted: boolean
  lastError?: string
  username?: string
  domain?: string
  incoming?: {
    displayName: string
    user: string
    uri: string
  }
}

// Mapeamento de estados nativos para tipos do app
function mapConnectionState(state: string): SipConnectionState {
  const map: Record<string, SipConnectionState> = {
    idle: 'idle',
    connecting: 'connecting',
    connected: 'connected',
    registered: 'registered',
    unregistered: 'unregistered',
    error: 'error',
  }
  return map[state] || 'idle'
}

function mapCallStatus(status: string): CallStatus {
  const map: Record<string, CallStatus> = {
    idle: 'idle',
    dialing: 'dialing',
    ringing: 'ringing',
    incoming: 'incoming',
    established: 'established',
    terminating: 'terminating',
    terminated: 'terminated',
    failed: 'failed',
  }
  return map[status] || 'idle'
}

function mapCallDirection(direction: string): SipCallDirection | undefined {
  if (direction === 'outgoing') return 'outgoing'
  if (direction === 'incoming') return 'incoming'
  return undefined
}

function nativeToSnapshot(native: NativeSnapshot): SipClientSnapshot {
  const snapshot: SipClientSnapshot = {
    connection: mapConnectionState(native.connection),
    callStatus: mapCallStatus(native.callStatus),
    muted: native.muted,
  }

  if (native.callDirection && native.callDirection !== 'none') {
    snapshot.callDirection = mapCallDirection(native.callDirection)
  }

  if (native.lastError) {
    snapshot.lastError = native.lastError
  }

  if (native.username && native.domain) {
    snapshot.identity = {
      username: native.username,
      domain: native.domain,
    }
  }

  if (native.incoming) {
    snapshot.incoming = {
      displayName: native.incoming.displayName,
      user: native.incoming.user,
      uri: native.incoming.uri,
    }
  }

  return snapshot
}

/**
 * Cliente SIP nativo usando PJSIP via IPC
 */
export class NativeSipClient implements ISipClient {
  private events: SipClientEvents
  private snapshot: SipClientSnapshot = { connection: 'idle', callStatus: 'idle' }
  private muted = false
  private eventUnsubscribe: (() => void) | null = null
  private domain = ''

  constructor(events: SipClientEvents) {
    this.events = events
  }

  getSnapshot(): SipClientSnapshot {
    return this.snapshot
  }

  private emit(patch: Partial<SipClientSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch }
    this.events.onSnapshot(this.snapshot)
  }

  private async setupEventListener(): Promise<void> {
    // Limpar listener anterior se existir
    if (this.eventUnsubscribe) {
      this.eventUnsubscribe()
      this.eventUnsubscribe = null
    }

    // Configurar callback de eventos no main process
    await window.sipNative.setEventCallback()

    // Ouvir eventos no renderer
    this.eventUnsubscribe = window.sipNative.onEvent((data) => {
      this.handleNativeEvent(data.event, data.payload)
    })
  }

  private handleNativeEvent(event: string, payloadJson: string) {
    try {
      const payload = JSON.parse(payloadJson)
      
      console.log('[NativeSIP] Evento recebido:', event, payload)

      // Atualizar snapshot baseado no evento
      switch (event) {
        case 'registered':
          this.emit({ connection: 'registered', lastError: undefined })
          break

        case 'unregistered':
          this.emit({ connection: 'unregistered' })
          break

        case 'incomingCall':
          this.emit({
            callStatus: 'incoming',
            callDirection: 'incoming',
            incoming: payload.incoming,
          })
          break

        case 'dialing':
          this.emit({ callStatus: 'dialing', callDirection: 'outgoing' })
          break

        case 'ringing':
          this.emit({ callStatus: 'ringing' })
          break

        case 'established':
          this.emit({ callStatus: 'established' })
          break

        case 'terminated':
          this.emit({
            callStatus: 'idle',
            callDirection: undefined,
            incoming: undefined,
          })
          break

        case 'muteChanged':
          this.muted = payload.muted ?? this.muted
          this.emit({ muted: this.muted })
          break

        case 'transferSuccess':
          console.log('[NativeSIP] Transferência bem sucedida')
          break

        case 'transferFailed':
          this.emit({ lastError: payload.lastError || 'Transferência falhou' })
          break

        case 'dtmfReceived':
          console.log('[NativeSIP] DTMF recebido:', payload.digit)
          break

        default:
          // Atualizar snapshot completo se disponível
          if (payload.connection !== undefined) {
            this.emit(nativeToSnapshot(payload as NativeSnapshot))
          }
      }
    } catch (e) {
      console.error('[NativeSIP] Erro ao processar evento:', e)
    }
  }

  async connectAndRegister(credentials: SipCredentials): Promise<void> {
    this.domain = credentials.server

    this.emit({
      connection: 'connecting',
      lastError: undefined,
      identity: { username: credentials.username, domain: credentials.server },
    })

    // Inicializar módulo nativo
    const initResult = await window.sipNative.init()
    if (!initResult.success) {
      this.emit({ connection: 'error', lastError: initResult.error || 'Falha ao inicializar' })
      throw new Error(initResult.error || 'Falha ao inicializar módulo nativo')
    }

    // Configurar listener de eventos
    await this.setupEventListener()

    // Registrar
    const transport = credentials.protocol === 'tcp' ? 'tcp' : 'udp'
    const registerResult = await window.sipNative.register({
      username: credentials.username,
      password: credentials.password,
      server: credentials.server,
      port: credentials.port ?? 5060,
      transport,
    })

    if (!registerResult.success) {
      this.emit({ connection: 'error', lastError: registerResult.error || 'Falha no registro' })
      throw new Error(registerResult.error || 'Falha no registro')
    }

    // O estado será atualizado via eventos
  }

  async unregisterAndDisconnect(): Promise<void> {
    this.emit({ connection: 'unregistered', identity: undefined, muted: false })

    try {
      await window.sipNative.unregister()
      await window.sipNative.clearEventCallback()
      await window.sipNative.destroy()
    } catch (e) {
      console.error('[NativeSIP] Erro ao desconectar:', e)
    }

    if (this.eventUnsubscribe) {
      this.eventUnsubscribe()
      this.eventUnsubscribe = null
    }

    this.emit({ connection: 'unregistered', identity: undefined, muted: false })
  }

  setMuted(nextMuted: boolean): boolean {
    this.muted = nextMuted
    window.sipNative.setMuted(nextMuted)
    this.emit({ muted: this.muted })
    return true
  }

  toggleMuted(): boolean {
    return this.setMuted(!this.muted)
  }

  isMuted(): boolean {
    return this.muted
  }

  async startCall(target: string): Promise<void> {
    this.emit({ lastError: undefined })

    const result = await window.sipNative.makeCall(target)
    if (!result.success) {
      this.emit({ callStatus: 'failed', lastError: result.error || 'Falha ao iniciar chamada' })
      throw new Error(result.error || 'Falha ao iniciar chamada')
    }

    this.emit({ callStatus: 'dialing', callDirection: 'outgoing' })
  }

  async answer(): Promise<void> {
    const result = await window.sipNative.answerCall()
    if (!result.success) {
      throw new Error(result.error || 'Falha ao atender')
    }
  }

  async reject(): Promise<void> {
    const result = await window.sipNative.rejectCall()
    if (!result.success) {
      console.error('[NativeSIP] Erro ao rejeitar:', result.error)
    }
    this.emit({
      callStatus: 'idle',
      callDirection: undefined,
      incoming: undefined,
    })
  }

  async hangup(): Promise<void> {
    const result = await window.sipNative.hangupCall()
    if (!result.success) {
      console.error('[NativeSIP] Erro ao desligar:', result.error)
    }
  }

  async transferBlind(target: string): Promise<void> {
    const result = await window.sipNative.transferBlind(target)
    if (!result.success) {
      this.emit({ lastError: result.error || 'Falha na transferência' })
      throw new Error(result.error || 'Falha na transferência')
    }
  }

  async transferAttended(target: string): Promise<void> {
    const result = await window.sipNative.transferAttended(target)
    if (!result.success) {
      this.emit({ lastError: result.error || 'Falha na transferência assistida' })
      throw new Error(result.error || 'Falha na transferência assistida')
    }
  }

  sendDtmf(tones: string): boolean {
    window.sipNative.sendDtmf(tones)
    return true
  }

  getDomain(): string | undefined {
    return this.domain
  }

  // O módulo nativo não expõe sessões sip.js
  getActiveSession(): undefined {
    return undefined
  }

  getActiveInvitation(): undefined {
    return undefined
  }

  getActiveInviter(): undefined {
    return undefined
  }
}
