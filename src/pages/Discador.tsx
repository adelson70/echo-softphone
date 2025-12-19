import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TopBar } from '../components/ui/BarraSuperior'
import { useSip } from '../sip/react/useSip'
import { clearStorage } from '../services/servicoArmazenamento'
import { IdleState } from '../components/chamadas/EstadoOcioso'
import { EstablishedState } from '../components/chamadas/EstadoEstabelecido'
import { OutgoingState } from '../components/chamadas/EstadoSaindo'
import { setCurrentDialNumber } from '../sip/react/useCallHistory'

export default function Discador() {
  const navigate = useNavigate()
  const sip = useSip()
  const [searchParams, setSearchParams] = useSearchParams()

  const [valorDiscagem, setValorDiscagem] = useState('')
  const [mostrarTeclado, setMostrarTeclado] = useState(false)
  const [modalTransferenciaAberto, setModalTransferenciaAberto] = useState(false)
  const [tipoTransferencia, setTipoTransferencia] = useState<'assisted' | 'blind' | null>(null)
  const [destinoTransferencia, setDestinoTransferencia] = useState('')

  const podeChamar = useMemo(() => valorDiscagem.trim().length > 0, [valorDiscagem])
  const emChamada = sip.snapshot.callStatus !== 'idle'
  const estaEstabelecido = sip.snapshot.callStatus === 'established'
  const estaEntrando = sip.snapshot.callStatus === 'incoming'
  const estaSaindo = sip.snapshot.callStatus === 'dialing' || sip.snapshot.callStatus === 'ringing'

  const numeroContatoEstabelecido = useMemo(() => {
    if (!estaEstabelecido) return null
    if (sip.snapshot.callDirection === 'incoming') {
      return sip.snapshot.incoming?.user ?? sip.snapshot.incoming?.uri ?? ''
    }
    return valorDiscagem || ''
  }, [estaEstabelecido, sip.snapshot.callDirection, sip.snapshot.incoming, valorDiscagem])

  const nomeContatoEstabelecido = useMemo(() => {
    if (!estaEstabelecido) return undefined
    if (sip.snapshot.callDirection === 'incoming') {
      return sip.snapshot.incoming?.displayName ?? undefined
    }
    return undefined
  }, [estaEstabelecido, sip.snapshot.callDirection, sip.snapshot.incoming])

  // Suporte a query param ?number=XXX para pré-preencher número
  useEffect(() => {
    const parametroNumero = searchParams.get('number')
    if (parametroNumero) {
      setValorDiscagem(parametroNumero)
      setSearchParams({}, { replace: true }) // Remove o param após usar
    }
  }, [searchParams, setSearchParams])

  function adicionarTecla(tecla: string) {
    setValorDiscagem((prev) => (prev + tecla).slice(0, 128))
  }

  function lidarComMudancaDiscagem(proximo: string) {
    setValorDiscagem(proximo.slice(0, 128))
  }

  async function lidarComChamada() {
    if (!podeChamar) return
    setCurrentDialNumber(valorDiscagem) // Armazena o número para o histórico
    await sip.startCall(valorDiscagem)
  }

  async function lidarComDesligar() {
    try {
      await sip.hangup()
    } catch (error) {
      console.error('Erro ao encerrar chamada:', error)
    }
  }

  function lidarComAlternarMudo() {
    try {
      sip.toggleMute()
    } catch (error) {
      console.error('Erro ao alternar mudo:', error)
    }
  }

  function lidarComAlternarTeclado() {
    setMostrarTeclado((prev) => !prev)
  }

  function lidarComCliqueDiscador() {
    navigate('/discador')
  }

  function lidarComCliqueHistorico() {
    navigate('/historico')
  }

  function lidarComCliqueContatos() {
    navigate('/contatos')
  }

  function lidarComAbrirTransferencia() {
    setTipoTransferencia(null)
    setDestinoTransferencia('')
    setModalTransferenciaAberto(true)
  }

  function lidarComFecharTransferencia() {
    setModalTransferenciaAberto(false)
    setTipoTransferencia(null)
    setDestinoTransferencia('')
  }

  async function lidarComConfirmarTransferencia() {
    if (!tipoTransferencia || !destinoTransferencia.trim()) return

    try {
      if (tipoTransferencia === 'assisted') {
        await sip.transferAttended(destinoTransferencia.trim())
      } else {
        await sip.transferBlind(destinoTransferencia.trim())
      }
      lidarComFecharTransferencia()
    } catch (error) {
      console.error('Erro ao transferir chamada:', error)
    }
  }

  async function lidarComSair() {
    // Limpa credenciais/config no store para não auto-reconectar
    await clearStorage().catch(() => {})

    // Não bloqueia a navegação caso o SIP demore/trave ao desconectar (ex.: durante chamada)
    if (sip.snapshot.callStatus !== 'idle') {
      void sip.hangup().catch(() => {})
    }
    void sip.unregisterAndDisconnect().catch(() => {})
    navigate('/')
  }


  const conectadoComo = sip.snapshot.identity
    ? `${sip.snapshot.identity.username}@${sip.snapshot.identity.domain}`
    : ''

  return (
    <div className="h-screen overflow-hidden bg-background text-text">
      {/* Modal de Transferência */}
      {modalTransferenciaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-background p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-text">Transferir Chamada</h3>

            {!tipoTransferencia ? (
              <>
                <p className="mb-4 text-sm text-muted">
                  Escolha o tipo de transferência:
                </p>
                <div className="mb-4 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoTransferencia('assisted')}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-white/10"
                  >
                    Transferência Assistida
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoTransferencia('blind')}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-white/10"
                  >
                    Transferência Cega
                  </button>
                </div>
                <button
                  type="button"
                  onClick={lidarComFecharTransferencia}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-white/10"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted">
                  {tipoTransferencia === 'assisted'
                    ? 'Digite o número ou extensão para transferência assistida:'
                    : 'Digite o número ou extensão para transferência cega:'}
                </p>
                <input
                  type="text"
                  value={destinoTransferencia}
                  onChange={(e) => setDestinoTransferencia(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void lidarComConfirmarTransferencia()
                    } else if (e.key === 'Escape') {
                      lidarComFecharTransferencia()
                    }
                  }}
                  placeholder="Número destino"
                  autoFocus
                  className="mb-4 h-12 w-full rounded-xl border border-white/10 bg-background px-4 text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoTransferencia(null)
                      setDestinoTransferencia('')
                    }}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-white/10"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => void lidarComConfirmarTransferencia()}
                    disabled={!destinoTransferencia.trim()}
                    className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Transferir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {!estaEntrando && (
        <TopBar
          onDialerClick={lidarComCliqueDiscador}
          onHistoryClick={lidarComCliqueHistorico}
          onContactsClick={lidarComCliqueContatos}
          onLogout={lidarComSair}
          active="dialer"
        />
      )}

      <main className="mx-auto flex h-full min-h-0 max-w-2xl flex-col overflow-hidden px-4 pb-6 pt-24">
        {/* Status centralizado no topo (não atrapalha o input) */}
        {!emChamada ? (
          <div className="fixed top-16 left-1/2 z-30 -translate-x-1/2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/80 px-3 py-2 text-xs text-text backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-success" aria-hidden="true" />
              <span className="font-semibold">{conectadoComo || 'Conectado'}</span>
            </div>
          </div>
        ) : null}

        {/* Renderização dinâmica dos estados */}
        {estaEstabelecido ? (
         <EstablishedState
          callDurationSec={sip.callDurationSec}
          contactNumber={numeroContatoEstabelecido || ''}
          contactName={nomeContatoEstabelecido}
          speakerOn={sip.speakerOn}
          onToggleSpeaker={sip.toggleSpeaker}
          showKeypad={mostrarTeclado}
          onToggleKeypad={lidarComAlternarTeclado}
          onTransferOpen={lidarComAbrirTransferencia}
          onToggleMute={lidarComAlternarMudo}
          onSendDtmf={(k) => sip.sendDtmf(k, { playLocal: true, sendRemote: true })}
          onHangup={() => void lidarComDesligar()}
          isMuted={sip.snapshot.muted ?? false}
        />
        ) : estaSaindo ? (
          <OutgoingState
            dialValue={valorDiscagem}
            callStatus={sip.snapshot.callStatus === 'dialing' ? 'dialing' : 'ringing'}
            onHangup={() => void sip.hangup()}
          />
        ) : (
          <IdleState
            dialValue={valorDiscagem}
            onDialChange={lidarComMudancaDiscagem}
            onKeyPress={(k) => {
              adicionarTecla(k)
              sip.sendDtmf(k, { playLocal: true, sendRemote: false })
            }}
            onCall={lidarComChamada}
            onHangup={lidarComDesligar}
            canCall={podeChamar}
            inCall={emChamada}
            isRegistered={sip.snapshot.connection === 'registered'}
            showKeypad={true}
          />
        )}
          
      </main>
    </div>
  )
}