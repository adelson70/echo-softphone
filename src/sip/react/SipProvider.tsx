import { createContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { SipClientSnapshot, SipCredentials } from '../types'
import { SipClient } from '../core/sipClient'
import { bindRemoteAudio } from '../media/audioBinding'
import { handleDtmf } from '../media/dtmf'
import { useCallAudioFeedback } from './useCallAudioFeedback'
import { useCallHistory } from './useCallHistory'

export type SipContextValue = {
  snapshot: SipClientSnapshot
  isRegistered: boolean
  callDurationSec: number
  speakerOn: boolean

  connectAndRegister: (credentials: SipCredentials) => Promise<void>
  unregisterAndDisconnect: () => Promise<void>
  startCall: (target: string) => Promise<void>
  answer: () => Promise<void>
  reject: () => Promise<void>
  hangup: () => Promise<void>
  sendDtmf: (key: string, opts?: { playLocal?: boolean; sendRemote?: boolean }) => boolean
  toggleMute: () => boolean
  toggleSpeaker: () => void
  transferBlind: (target: string) => Promise<void>
  transferAttended: (target: string) => Promise<void>
}

export const SipContext = createContext<SipContextValue | null>(null)

export function SipProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<SipClientSnapshot>({ connection: 'idle', callStatus: 'idle' })
  const [callDurationSec, setCallDurationSec] = useState(0)
  const [speakerOn, setSpeakerOn] = useState(false)

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const clientRef = useRef<SipClient | null>(null)
  const timerRef = useRef<number | null>(null)

  if (!clientRef.current) {
    clientRef.current = new SipClient({
      onSnapshot: (snap) => setSnapshot(snap),
    })
  }

  // Timer simples (UI)
  useEffect(() => {
    if (snapshot.callStatus !== 'established') {
      setCallDurationSec(0)
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
      return
    }
    const started = Date.now()
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setCallDurationSec(Math.floor((Date.now() - started) / 1000))
    }, 1000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [snapshot.callStatus])

  // Bind do áudio remoto quando estabelece a sessão
  useEffect(() => {
    const client = clientRef.current
    const audioEl = remoteAudioRef.current
    if (!client || !audioEl) return
    
    // Se a chamada foi cancelada/terminada, para o áudio imediatamente
    if (snapshot.callStatus === 'idle' || snapshot.callStatus === 'terminating' || snapshot.callStatus === 'terminated') {
      audioEl.pause()
      audioEl.srcObject = null
      return
    }
    
    if (snapshot.callStatus !== 'established') return
    const session = client.getActiveSession()
    if (!session) return
    bindRemoteAudio(session, audioEl)
  }, [snapshot.callStatus, snapshot.sipSessionState])

  // Viva-voz (primeira versão): controla volume do áudio remoto.
  useEffect(() => {
    const audioEl = remoteAudioRef.current
    if (!audioEl) return
    audioEl.volume = speakerOn ? 1.0 : 0.35
  }, [speakerOn])

  // Sons de feedback de chamada
  useCallAudioFeedback(snapshot)

  // Histórico de chamadas
  useCallHistory({ snapshot })

  const value = useMemo<SipContextValue>(() => {
    const client = clientRef.current!

    return {
      snapshot,
      isRegistered: snapshot.connection === 'registered',
      callDurationSec,
      speakerOn,

      connectAndRegister: (credentials) => client.connectAndRegister(credentials),
      unregisterAndDisconnect: () => client.unregisterAndDisconnect(),
      startCall: (target) => client.startCall(target),
      answer: () => client.answer(),
      reject: () => client.reject(),
      hangup: () => client.hangup(),
      sendDtmf: (key, opts) => {
        const session = client.getActiveSession()
        return handleDtmf(session, key, {
          playLocal: opts?.playLocal ?? true,
          sendRemote: opts?.sendRemote ?? true,
        })
      },
      toggleMute: () => client.toggleMuted(),
      toggleSpeaker: () => setSpeakerOn((prev) => !prev),
      transferBlind: (target) => client.transferBlind(target),
      transferAttended: (target) => client.transferAttended(target),
    }
  }, [snapshot, callDurationSec, speakerOn])

  return (
    <SipContext.Provider value={value}>
      {children}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
    </SipContext.Provider>
  )
}


