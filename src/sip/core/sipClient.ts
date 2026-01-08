import {
  Invitation,
  Inviter,
  Registerer,
  RegistererState,
  SIPExtension,
  SessionState,
  UserAgent,
} from 'sip.js'
import type { Session, URI } from 'sip.js'
import type { SipClientSnapshot, SipCredentials } from '../types'
import type { ISipClient, SipClientEvents } from './sipClientInterface'
import { canCancel, canReject, canSendBye } from './sessionGuards'
import { createFixedSessionDescriptionHandlerFactory } from './customSessionDescriptionHandler'
import { sendDtmf as sendDtmfToSession } from '../media/dtmf'

function formatSipFailure(statusCode?: number, reasonPhrase?: string) {
  if (!statusCode) return 'Falha SIP'
  const reason = reasonPhrase ? ` ${reasonPhrase}` : ''
  return `Falha SIP (${statusCode})${reason}`
}

type NormalizedServer = {
  domain: string
  wsServer: string
  aor: string
}

function normalizeServer(credentials: SipCredentials): NormalizedServer {
  const raw = credentials.server.trim()
  const wsPath = credentials.wsPath ?? '/ws'
  // Porta padrão SIP é 5060.
  const port = credentials.port ?? 5060
  const protocol = credentials.protocol ?? 'wss'

  // Se vier URL WS/WSS completa, usamos direto.
  if (raw.startsWith('ws://') || raw.startsWith('wss://')) {
    const u = new URL(raw)
    const domain = u.hostname
    const portPart = u.port ? `:${u.port}` : ''
    const aor = `sip:${credentials.username}@${domain}${portPart}`
    return { domain, wsServer: raw, aor }
  }

  // Aceita "host:port" também.
  const [host, portMaybe] = raw.split(':')
  const finalPort = portMaybe ? Number(portMaybe) : port
  const domain = host
  const wsServer = `${protocol}://${domain}:${finalPort}${wsPath.startsWith('/') ? wsPath : `/${wsPath}`}`
  const aor = `sip:${credentials.username}@${domain}:${finalPort}`
  return { domain, wsServer, aor }
}

function makeTargetURI(target: string, domain: string): URI {
  const trimmed = target.trim()
  const uriString = trimmed.startsWith('sip:') ? trimmed : `sip:${trimmed}@${domain}`
  const uri = UserAgent.makeURI(uriString)
  if (!uri) throw new Error('Número/URI SIP inválido')
  return uri
}

function getIncomingInfo(inv: Invitation) {
  const displayName = inv.remoteIdentity.displayName
  const uri = inv.remoteIdentity.uri?.toString()
  const user = inv.remoteIdentity.uri?.user
  return { displayName, uri, user }
}

export class SipClient implements ISipClient {
  private events: SipClientEvents
  private server?: NormalizedServer

  private userAgent?: UserAgent
  private registerer?: Registerer
  private session?: Session
  private inviter?: Inviter
  private invitation?: Invitation

  private snapshot: SipClientSnapshot = { connection: 'idle', callStatus: 'idle' }
  private muted = false

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

  private clearCallState() {
    // Limpa streams de áudio antes de limpar referências
    const s = this.session
    if (s) {
      try {
        const sdh = (s as any)?.sessionDescriptionHandler
        const pc: RTCPeerConnection | undefined = sdh?.peerConnection
        if (pc) {
          // Para todos os tracks de áudio
          pc.getReceivers().forEach((receiver) => {
            if (receiver.track) {
              receiver.track.stop()
            }
          })
          pc.getSenders().forEach((sender) => {
            if (sender.track) {
              sender.track.stop()
            }
          })
          // Fecha a conexão para parar qualquer áudio de ringback
          pc.close()
        }
      } catch (e) {
        // Ignora erros ao limpar áudio
      }
    }

    this.session = undefined
    this.inviter = undefined
    this.invitation = undefined
    this.muted = false
    this.emit({
      callStatus: 'idle',
      callDirection: undefined,
      incoming: undefined,
      sipSessionState: undefined,
      muted: false,
    })
  }

  private bindSession(session: Session, direction: 'outgoing' | 'incoming') {
    this.session = session
    this.emit({ callDirection: direction, sipSessionState: session.state })

    const sessionStateListener = (st: SessionState) => {
      this.emit({ sipSessionState: st })
      if (st === SessionState.Establishing) {
        if (direction === 'outgoing') this.emit({ callStatus: 'dialing' })
        if (direction === 'incoming') this.emit({ callStatus: 'incoming' })
      }
      if (st === SessionState.Established) this.emit({ callStatus: 'established' })
      if (st === SessionState.Terminating) this.emit({ callStatus: 'terminating' })
      // Garantir limpeza imediata quando sessão for terminada em qualquer estado
      // Isso trata cancelamentos remotos durante dialing/ringing
      if (st === SessionState.Terminated) {
        // Remove o listener para evitar chamadas duplicadas
        session.stateChange.removeListener(sessionStateListener)
        this.clearCallState()
      }
    }
    
    session.stateChange.addListener(sessionStateListener)
  }

  async connectAndRegister(credentials: SipCredentials): Promise<void> {
    this.server = normalizeServer(credentials)
    this.emit({
      connection: 'connecting',
      lastError: undefined,
      identity: { username: credentials.username, domain: this.server.domain },
    })

    const uri = UserAgent.makeURI(this.server.aor)
    if (!uri) throw new Error('URI SIP inválida para o usuário')

    const userAgent = new UserAgent({
      uri,
      authorizationUsername: credentials.username,
      authorizationPassword: credentials.password,
      logLevel: 'debug',
      // Ajuda em transferência assistida (REFER w/Replaces)
      sipExtensionReplaces: SIPExtension.Supported,
      // Alguns PBXs/WebRTC são sensíveis a ICE incompleto; aumentar o timeout ajuda em redes mais lentas.
      sessionDescriptionHandlerFactoryOptions: { iceGatheringTimeout: 10000 },
      // Factory customizada que corrige SDPs malformados com fingerprint incompleto
      sessionDescriptionHandlerFactory: createFixedSessionDescriptionHandlerFactory(),
      transportOptions: {
        server: this.server.wsServer,
      },
      delegate: {
        onInvite: (invitation: Invitation) => {
          // Se já existe sessão ativa, rejeita (busy).
          if (this.session) {
            invitation.reject({ statusCode: 486, reasonPhrase: 'Busy Here' }).catch(() => {})
            return
          }
          this.invitation = invitation
          this.bindSession(invitation, 'incoming')
          this.emit({ incoming: getIncomingInfo(invitation), callStatus: 'incoming' })
        },
      },
    })

    this.userAgent = userAgent

    userAgent.transport.stateChange.addListener((state) => {
      if (state === 'Connected') this.emit({ connection: 'connected' })
      if (state === 'Disconnected') this.emit({ connection: 'unregistered' })
    })

    await userAgent.start()

    const registerer = new Registerer(userAgent)
    this.registerer = registerer
    registerer.stateChange.addListener((st) => {
      if (st === RegistererState.Registered) this.emit({ connection: 'registered' })
      if (st === RegistererState.Unregistered) this.emit({ connection: 'unregistered' })
    })

    await registerer.register()
  }

  async unregisterAndDisconnect(): Promise<void> {
    // Ajuda a UI/rotas a não “reconectar” por ver estado ainda registrado.
    this.emit({ connection: 'unregistered', identity: undefined, muted: false })
    try {
      if (this.registerer) {
        await this.registerer.unregister().catch(() => {})
        await this.registerer.dispose().catch(() => {})
      }
    } finally {
      this.registerer = undefined
    }

    try {
      if (this.userAgent) {
        await this.userAgent.stop().catch(() => {})
      }
    } finally {
      this.userAgent = undefined
      this.emit({ connection: 'unregistered', identity: undefined, muted: false })
    }
  }

  /**
   * Mudo (mute) do microfone local: desabilita o track de áudio do sender no RTCPeerConnection.
   */
  setMuted(nextMuted: boolean): boolean {
    this.muted = nextMuted
    const s = this.session
    const pc: RTCPeerConnection | undefined = (s as any)?.sessionDescriptionHandler?.peerConnection
    if (!pc) {
      this.emit({ muted: this.muted })
      return false
    }
    pc.getSenders().forEach((sender) => {
      const t = sender.track
      if (t && t.kind === 'audio') t.enabled = !nextMuted
    })
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
    if (!this.userAgent || !this.server) throw new Error('Usuário não registrado')
    if (this.session) throw new Error('Já existe uma chamada em andamento')

    // Ao iniciar uma nova chamada, limpa erro anterior (não renderizamos mais, mas evita estado “sujo”)
    this.emit({ lastError: undefined })

    const targetURI = makeTargetURI(target, this.server.domain)
    const inviter = new Inviter(this.userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    })

    this.inviter = inviter
    this.bindSession(inviter, 'outgoing')
    this.emit({ callStatus: 'dialing' })

    // Listener adicional para detectar cancelamentos remotos durante o progresso
    const stateListener = (st: SessionState) => {
      // Se a sessão for terminada durante dialing/ringing, limpa imediatamente
      if (st === SessionState.Terminated) {
        // Verifica se ainda é a mesma sessão antes de limpar
        if (this.inviter === inviter) {
          this.clearCallState()
        }
        // Remove o listener para evitar chamadas duplicadas
        inviter.stateChange.removeListener(stateListener)
      }
    }
    inviter.stateChange.addListener(stateListener)

    try {
      await inviter.invite({
        requestDelegate: {
          onProgress: () => {
            // Durante o progresso, o servidor pode enviar early media (ringback)
            this.emit({ callStatus: 'ringing' })
          },
          onReject: (response) => {
            // Trata rejeições explícitas (486, 487, etc.)
            // Importante: não deixar a UI "presa" em failed (isso trava inputs/novas chamadas).
            // A sessão pode terminar e depois o callback rodar fora de ordem.
            const statusCode = response.message.statusCode
            const reasonPhrase = response.message.reasonPhrase
            
            // Limpa o estado imediatamente para parar o áudio
            this.clearCallState()
            
            // 486 Busy Here - detecta ocupado para tocar som de busy
            if (statusCode === 486) {
              this.emit({ lastError: 'Linha ocupada (Busy)' })
            } else if (statusCode === 487) {
              // 487 Request Terminated é comum quando o número chamado desliga
              this.emit({ lastError: 'Chamada cancelada pelo destinatário' })
            } else {
              this.emit({ lastError: formatSipFailure(statusCode, reasonPhrase) })
            }
            
            // Remove o listener para evitar chamadas duplicadas
            inviter.stateChange.removeListener(stateListener)
          },
          onAccept: () => {
            // Chamada aceita - estado será atualizado pelo bindSession
            // Remove o listener pois a chamada foi estabelecida
            inviter.stateChange.removeListener(stateListener)
          },
        },
      })
    } catch (e: any) {
      this.clearCallState()
      this.emit({ lastError: e?.message ?? 'Falha ao iniciar chamada' })
      throw e
    }
  }

  async answer(): Promise<void> {
    if (!this.invitation) throw new Error('Nenhuma chamada recebida')
    await this.invitation.accept({
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    })
  }

  async reject(): Promise<void> {
    if (!this.invitation) {
      console.error('[SIP] reject(): Nenhuma chamada recebida')
      throw new Error('Nenhuma chamada recebida')
    }
    
    if (!canReject(this.invitation)) {
      console.warn('[SIP] reject(): Não é possível rejeitar a chamada. Estado atual:', this.invitation.state)
      // Mesmo assim, limpa o estado para evitar que a UI fique presa
      this.clearCallState()
      return
    }
    
    console.log('[SIP] reject(): Rejeitando chamada incoming. Estado:', this.invitation.state)
    try {
      await this.invitation.reject({ statusCode: 486, reasonPhrase: 'Rejected' })
      console.log('[SIP] reject(): Chamada rejeitada com sucesso')
    } catch (error) {
      console.error('[SIP] reject(): Erro ao rejeitar chamada:', error)
    } finally {
      // Garante que o estado seja limpo mesmo em caso de erro
      this.clearCallState()
    }
  }

  /**
   * Encerra a chamada atual:
   * - Sessão estabelecida -> BYE (prioridade)
   * - Chamada de saída em progresso (dialing/ringing) -> CANCEL
   * - Chamada recebida (tocando) -> REJECT
   */
  async hangup(): Promise<void> {
    // Sessão estabelecida: BYE (verificar primeiro, antes de tentar cancelar)
    const s = this.session
    if (s && canSendBye(s)) {
      await s.bye().catch(() => {})
      return
    }

    // Outgoing: CANCEL (dialing ou ringing) - só se não estiver estabelecida
    if (this.inviter && canCancel(this.inviter)) {
      // Verificar se o inviter não está em estado Established
      if (this.inviter.state !== SessionState.Established) {
        await this.inviter.cancel().catch(() => {})
        return
      }
    }

    // Incoming: REJECT
    if (this.invitation && canReject(this.invitation)) {
      await this.invitation.reject({ statusCode: 486, reasonPhrase: 'Busy Here' }).catch(() => {})
      this.clearCallState()
      return
    }
  }

  /**
   * Transferência cega (REFER) do diálogo atual para o destino.
   * Após enviar o REFER com sucesso, encerra automaticamente a chamada no softphone.
   */
  async transferBlind(target: string): Promise<void> {
    if (!this.session) throw new Error('Nenhuma chamada ativa')
    if (!this.userAgent || !this.server) throw new Error('Usuário não registrado')

    const referTo = makeTargetURI(target, this.server.domain)
    await this.session.refer(referTo, {
      onNotify: () => {
        // Opcional: pode mapear notifies para UI depois
      },
    })
    
    // Encerra a chamada automaticamente após a transferência cega ser enviada
    await this.hangup()
  }

  /**
   * Transferência assistida:
   * 1) Inicia uma chamada de consulta para o destino.
   * 2) Ao estabelecer, envia REFER w/Replaces (referTo = sessionConsulta).
   * 3) Fallback: se falhar, tenta transferência cega para o mesmo destino.
   *
   * Observação: apesar da UI ser “1 chamada”, internamente abrimos uma sessão temporária.
   */
  async transferAttended(target: string): Promise<void> {
    if (!this.session) throw new Error('Nenhuma chamada ativa')
    if (!this.userAgent || !this.server) throw new Error('Usuário não registrado')
    const originalSession = this.session

    const targetURI = makeTargetURI(target, this.server.domain)
    const consult = new Inviter(this.userAgent, targetURI, {
      sessionDescriptionHandlerOptions: { constraints: { audio: true, video: false } },
    })

    // NÃO substitui o estado principal; é uma sessão auxiliar.
    await consult.invite()

    // Espera até Established ou Terminated.
    await new Promise<void>((resolve, reject) => {
      let done = false
      consult.stateChange.addListener((st) => {
        if (done) return
        if (st === SessionState.Established) {
          done = true
          resolve()
          return
        }
        if (st === SessionState.Terminated) {
          done = true
          reject(new Error('Consulta encerrada antes de estabelecer'))
        }
      })
    })

    try {
      // REFER w/Replaces: passando a sessão (consult) como referTo
      await originalSession.refer(consult)
    } catch (e) {
      // fallback (PBX sem Replaces, por exemplo)
      await this.transferBlind(target)
    } finally {
      // encerra consulta se ainda estiver ativa
      try {
        if (consult.state === SessionState.Established) await consult.bye()
      } catch {
        // ignore
      }
    }
  }

  getActiveSession(): Session | undefined {
    return this.session
  }

  getActiveInvitation(): Invitation | undefined {
    return this.invitation
  }

  getActiveInviter(): Inviter | undefined {
    return this.inviter
  }

  getDomain(): string | undefined {
    return this.server?.domain
  }

  /**
   * Envia DTMF na sessão ativa
   */
  sendDtmf(tones: string): boolean {
    if (!this.session) return false
    return sendDtmfToSession(this.session, tones)
  }
}


