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

// Tipo do snapshot nativo (pode vir com números do C++ ou strings)
interface NativeSnapshot {
  connection: string | number
  callStatus: string | number
  callDirection: string | number
  muted: boolean
  lastError?: string
  username?: string
  domain?: string
  remoteUri?: string  // Número/URI da chamada saindo
  incoming?: {
    displayName: string
    user: string
    uri: string
  }
}

// Mapeamento de estados nativos para tipos do app
function mapConnectionState(state: string | number): SipConnectionState {
  // Se for string numérica, converter para número
  let stateNum: number | null = null
  if (typeof state === 'string' && /^\d+$/.test(state)) {
    stateNum = parseInt(state, 10)
  } else if (typeof state === 'number') {
    stateNum = state
  }
  
  // Mapeamento numérico (do C++ enum)
  const numMap: Record<number, SipConnectionState> = {
    0: 'idle',        // Idle
    1: 'connecting',   // Connecting
    2: 'connected',   // Connected
    3: 'registered',  // Registered
    4: 'unregistered', // Unregistered
    5: 'error',       // Error
  }
  
  // Se for número (ou string numérica), usar mapeamento numérico
  if (stateNum !== null && numMap[stateNum] !== undefined) {
    return numMap[stateNum]
  }
  
  // Mapeamento string
  const stateStr = typeof state === 'string' ? state : String(state)
  const strMap: Record<string, SipConnectionState> = {
    idle: 'idle',
    connecting: 'connecting',
    connected: 'connected',
    registered: 'registered',
    unregistered: 'unregistered',
    error: 'error',
  }
  
  return strMap[stateStr] || 'idle'
}

function mapCallStatus(status: string | number): CallStatus {
  // Se for número, converter para string primeiro
  const statusStr = typeof status === 'number' ? String(status) : status
  
  // Mapeamento numérico (do C++ enum)
  const numMap: Record<number, CallStatus> = {
    0: 'idle',         // Idle
    1: 'dialing',      // Dialing
    2: 'ringing',      // Ringing
    3: 'incoming',     // Incoming
    4: 'ringing',      // Establishing -> tratar como ringing (estado intermediário)
    5: 'established',  // Established
    6: 'terminating',  // Terminating
    7: 'terminated',   // Terminated
    8: 'failed',       // Failed
  }
  
  // Mapeamento string
  const strMap: Record<string, CallStatus> = {
    idle: 'idle',
    dialing: 'dialing',
    ringing: 'ringing',
    incoming: 'incoming',
    establishing: 'ringing',  // Mapear establishing para ringing
    connecting: 'ringing',    // Mapear connecting para ringing
    established: 'established',
    terminating: 'terminating',
    terminated: 'terminated',
    failed: 'failed',
  }
  
  if (typeof status === 'number' && numMap[status] !== undefined) {
    return numMap[status]
  }
  
  return strMap[statusStr] || 'idle'
}

function mapCallDirection(direction: string | number): SipCallDirection | undefined {
  // Se for número, converter
  if (typeof direction === 'number') {
    if (direction === 0) return undefined // None
    if (direction === 1) return 'outgoing'
    if (direction === 2) return 'incoming'
    return undefined
  }
  
  if (direction === 'outgoing') return 'outgoing'
  if (direction === 'incoming') return 'incoming'
  if (direction === 'none' || direction === '') return undefined
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

  // Incluir remoteUri quando disponível (número chamado em chamadas saindo)
  if (native.remoteUri) {
    snapshot.remoteUri = native.remoteUri
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
  private currentCallTarget: string = ''  // Preservar número chamado durante a chamada

  constructor(events: SipClientEvents) {
    this.events = events
  }

  getSnapshot(): SipClientSnapshot {
    return this.snapshot
  }

  private emit(patch: Partial<SipClientSnapshot>) {
    // Mesclar com snapshot atual preservando informações importantes
    const newSnapshot: SipClientSnapshot = { 
      ...this.snapshot, 
      ...patch,
      // Preservar identity se não estiver no patch
      identity: patch.identity ?? this.snapshot.identity,
      // Preservar callDirection se não estiver no patch e houver chamada ativa
      callDirection: patch.callDirection ?? (this.snapshot.callStatus !== 'idle' && this.snapshot.callStatus !== 'terminated' ? this.snapshot.callDirection : undefined),
      // Preservar remoteUri se não estiver no patch e houver chamada ativa (ou usar currentCallTarget)
      remoteUri: patch.remoteUri ?? (this.snapshot.callStatus !== 'idle' && this.snapshot.callStatus !== 'terminated' ? 
                                      (this.snapshot.remoteUri || this.currentCallTarget || undefined) : undefined),
    }
    
    // Só emitir se realmente mudou algo significativo (evitar spam de atualizações)
    // Comparação simples e direta
    const connectionChanged = newSnapshot.connection !== this.snapshot.connection
    const callStatusChanged = newSnapshot.callStatus !== this.snapshot.callStatus
    const callDirectionChanged = newSnapshot.callDirection !== this.snapshot.callDirection
    const errorChanged = (newSnapshot.lastError || '') !== (this.snapshot.lastError || '')
    const identityChanged = (newSnapshot.identity?.username || '') !== (this.snapshot.identity?.username || '') ||
                            (newSnapshot.identity?.domain || '') !== (this.snapshot.identity?.domain || '')
    const remoteUriChanged = (newSnapshot.remoteUri || '') !== (this.snapshot.remoteUri || '')
    
    if (connectionChanged || callStatusChanged || callDirectionChanged || errorChanged || identityChanged || remoteUriChanged) {
      console.log('[NativeSIP] emit - Mudança detectada:', {
        connection: `${this.snapshot.connection} -> ${newSnapshot.connection}`,
        callStatus: `${this.snapshot.callStatus} -> ${newSnapshot.callStatus}`,
        callDirection: `${this.snapshot.callDirection} -> ${newSnapshot.callDirection}`,
        remoteUri: `${this.snapshot.remoteUri || 'vazio'} -> ${newSnapshot.remoteUri || 'vazio'}`,
        currentCallTarget: this.currentCallTarget || 'vazio',
        changes: {
          connectionChanged,
          callStatusChanged,
          callDirectionChanged,
          errorChanged,
          identityChanged,
          remoteUriChanged
        },
        patch,
        snapshotAntes: { ...this.snapshot },
        snapshotDepois: { ...newSnapshot }
      })
      this.snapshot = newSnapshot
      this.events.onSnapshot(this.snapshot)
    } else {
      console.log('[NativeSIP] emit - Sem mudanças significativas, ignorando:', {
        patch,
        snapshotAtual: { ...this.snapshot }
      })
    }
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
      
      console.log('[NativeSIP] handleNativeEvent - Evento recebido:', {
        event,
        payload,
        snapshotAtual: { ...this.snapshot },
        currentCallTarget: this.currentCallTarget || 'vazio'
      })

      // Atualizar snapshot baseado no evento
      switch (event) {
        case 'registered':
          // O payload contém o snapshot completo em JSON
          // Se o payload tem dados, usar eles; senão buscar do módulo
          if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
            // Converter valores numéricos de enum para strings
            const mapped = nativeToSnapshot(payload as NativeSnapshot)
            this.emit({ ...mapped, connection: 'registered', lastError: undefined })
          } else {
            // Fallback: buscar snapshot do módulo
            window.sipNative.getSnapshot().then((nativeSnap) => {
              const mapped = nativeToSnapshot(nativeSnap)
              this.emit({ ...mapped, connection: 'registered', lastError: undefined })
            }).catch(() => {
              // Fallback final - manter identity se já existir
              this.emit({ 
                connection: 'registered', 
                lastError: undefined,
                identity: this.snapshot.identity // Manter identity existente
              })
            })
          }
          break

        case 'unregistered':
          this.emit({ connection: 'unregistered' })
          break

        case 'callStarted':
          // callStarted é emitido quando makeCall é chamado
          // Se já estamos em dialing, não atualizar novamente (evitar duplicação)
          if (this.snapshot.callStatus !== 'dialing') {
            const callStartedPatch: Partial<SipClientSnapshot> = { 
              callStatus: 'dialing', 
              callDirection: 'outgoing',
              lastError: undefined
            }
            // Preservar remoteUri se disponível
            if (payload.remoteUri) {
              this.currentCallTarget = payload.remoteUri
              callStartedPatch.remoteUri = payload.remoteUri
            } else if (this.currentCallTarget) {
              callStartedPatch.remoteUri = this.currentCallTarget
            }
            this.emit(callStartedPatch)
          }
          break

        case 'incomingCall':
          this.emit({
            callStatus: 'incoming',
            callDirection: 'incoming',
            incoming: payload.incoming,
            lastError: undefined,
          })
          break

        case 'dialing':
          // Usar informações do payload se disponível, senão usar snapshot atual
          const dialingPatch: Partial<SipClientSnapshot> = { 
            callStatus: 'dialing', 
            callDirection: payload.callDirection ? mapCallDirection(payload.callDirection) : (this.snapshot.callDirection ?? 'outgoing'),
            lastError: undefined
          }
          // Se temos remoteUri no payload, usar; senão manter o que já temos
          if (payload.remoteUri) {
            this.currentCallTarget = payload.remoteUri
            dialingPatch.remoteUri = payload.remoteUri
          } else if (this.currentCallTarget) {
            // Preservar número chamado se já temos
            dialingPatch.remoteUri = this.currentCallTarget
          }
          this.emit(dialingPatch)
          break

        case 'ringing':
          // Preservar callDirection e número chamado, usar payload se disponível
          const ringingDirection = payload.callDirection ? mapCallDirection(payload.callDirection) : 
                                  (this.snapshot.callDirection ?? 'outgoing')
          const ringingPatch: Partial<SipClientSnapshot> = { 
            callStatus: 'ringing',
            callDirection: ringingDirection,
            lastError: undefined
          }
          // Preservar remoteUri
          if (payload.remoteUri) {
            this.currentCallTarget = payload.remoteUri
            ringingPatch.remoteUri = payload.remoteUri
          } else if (this.currentCallTarget || this.snapshot.remoteUri) {
            ringingPatch.remoteUri = this.currentCallTarget || this.snapshot.remoteUri
          }
          this.emit(ringingPatch)
          break

        case 'connecting':
          // Estado intermediário (PJSIP_INV_STATE_CONNECTING) - tratar como ringing
          // Não sobrescrever se já estiver em established
          if (this.snapshot.callStatus === 'established') {
            // Já estabelecido, ignorar
            break
          }
          // Preservar callDirection existente ou usar outgoing como padrão
          const preservedDirection = this.snapshot.callDirection ?? 
                                     (payload.callDirection ? mapCallDirection(payload.callDirection) : 'outgoing')
          const connectingPatch: Partial<SipClientSnapshot> = { 
            callStatus: 'ringing',  // Tratar connecting como ringing (estado intermediário)
            callDirection: preservedDirection,
            lastError: undefined
          }
          // Preservar remoteUri
          if (payload.remoteUri) {
            this.currentCallTarget = payload.remoteUri
            connectingPatch.remoteUri = payload.remoteUri
          } else if (this.currentCallTarget || this.snapshot.remoteUri) {
            connectingPatch.remoteUri = this.currentCallTarget || this.snapshot.remoteUri
          }
          this.emit(connectingPatch)
          break

        case 'established':
          // Preservar todas as informações da chamada, usar payload se disponível
          // IMPORTANTE: Preservar callDirection existente se não vier no payload
          let establishedDirection: SipCallDirection | undefined
          if (payload.callDirection) {
            establishedDirection = mapCallDirection(payload.callDirection)
          } else if (this.snapshot.callDirection) {
            // Preservar callDirection existente
            establishedDirection = this.snapshot.callDirection
          } else {
            // Fallback: se não temos callDirection, assumir outgoing (chamada saindo)
            establishedDirection = 'outgoing'
          }
          
          const establishedPatch: Partial<SipClientSnapshot> = { 
            callStatus: 'established',
            callDirection: establishedDirection,
            lastError: undefined
          }
          // Preservar remoteUri
          if (payload.remoteUri) {
            this.currentCallTarget = payload.remoteUri
            establishedPatch.remoteUri = payload.remoteUri
          } else if (this.currentCallTarget || this.snapshot.remoteUri) {
            establishedPatch.remoteUri = this.currentCallTarget || this.snapshot.remoteUri
          }
          
          console.log('[NativeSIP] Evento established - Preservando callDirection:', {
            payloadCallDirection: payload.callDirection,
            snapshotCallDirection: this.snapshot.callDirection,
            finalCallDirection: establishedDirection,
            remoteUri: establishedPatch.remoteUri
          })
          
          this.emit(establishedPatch)
          break

        case 'terminated':
          console.log('[NativeSIP] Evento terminated - Limpando estado da chamada')
          this.emit({
            callStatus: 'idle',
            callDirection: undefined,
            incoming: undefined,
            remoteUri: undefined,
            lastError: undefined,
          })
          this.currentCallTarget = ''  // Limpar número chamado
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

        case 'mediaActive':
          // mediaActive apenas indica que a mídia está ativa
          // NÃO deve mudar o callStatus - apenas confirma que a mídia está funcionando
          // O estado da chamada já deve estar correto (ringing ou established)
          console.log('[NativeSIP] mediaActive - Mídia ativa, mantendo estado atual:', {
            currentStatus: this.snapshot.callStatus,
            payloadCallStatus: payload.callStatus,
            payloadCallDirection: payload.callDirection,
            currentCallDirection: this.snapshot.callDirection
          })
          // Não emitir mudanças - apenas confirmar que mídia está ativa
          // O estado da chamada deve ser gerenciado pelos eventos específicos (ringing, established, etc)
          break

        default:
          // Atualizar snapshot completo se disponível
          if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
            const mapped = nativeToSnapshot(payload as NativeSnapshot)
            // Preservar callDirection se não estiver no payload mas já existe no snapshot
            if (!mapped.callDirection && this.snapshot.callDirection && this.snapshot.callStatus !== 'idle') {
              mapped.callDirection = this.snapshot.callDirection
            }
            this.emit(mapped)
          }
      }
    } catch (e) {
      // Erro ao processar evento - silenciar para evitar spam no console
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

    // Aguardar um pouco e verificar snapshot (o evento pode já ter chegado)
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Buscar snapshot atualizado do módulo nativo
    try {
      const snapshot = await window.sipNative.getSnapshot()
      const mapped = nativeToSnapshot(snapshot)
      this.emit(mapped)
    } catch (e) {
      console.warn('[NativeSIP] Erro ao buscar snapshot após registro:', e)
    }

    // O estado também será atualizado via eventos quando chegar
  }

  async unregisterAndDisconnect(): Promise<void> {
    this.emit({ connection: 'unregistered', identity: undefined, muted: false })

    try {
      await window.sipNative.unregister()
      await window.sipNative.clearEventCallback()
      await window.sipNative.destroy()
    } catch {
      // Ignorar erros ao desconectar
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
    console.log('[NativeSIP] startCall - Iniciando chamada:', {
      target,
      snapshotAntes: { ...this.snapshot },
      currentCallTarget: this.currentCallTarget || 'vazio'
    })
    
    // Salvar número chamado antes de iniciar
    this.currentCallTarget = target
    
    // Emitir dialing imediatamente (igual WSS)
    this.emit({ 
      callStatus: 'dialing', 
      callDirection: 'outgoing',
      remoteUri: target,  // Incluir número chamado no snapshot
      lastError: undefined 
    })

    const result = await window.sipNative.makeCall(target)
    console.log('[NativeSIP] startCall - Resultado do makeCall:', {
      success: result.success,
      error: result.error,
      snapshotApos: { ...this.snapshot }
    })
    
    if (!result.success) {
      this.emit({ 
        callStatus: 'failed', 
        lastError: result.error || 'Falha ao iniciar chamada' 
      })
      this.currentCallTarget = ''  // Limpar em caso de erro
      throw new Error(result.error || 'Falha ao iniciar chamada')
    }

    // O evento callStarted ou dialing virá do módulo nativo, mas já emitimos dialing acima
    // para garantir resposta imediata igual ao WSS
    console.log('[NativeSIP] startCall - Chamada iniciada, aguardando eventos do módulo nativo')
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
      // Erro ao rejeitar - estado será atualizado via evento
      return
    }
    this.emit({
      callStatus: 'idle',
      callDirection: undefined,
      incoming: undefined,
    })
  }

  async hangup(): Promise<void> {
    await window.sipNative.hangupCall()
    // Limpar número chamado
    this.currentCallTarget = ''
    // O estado será atualizado via evento terminated
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
