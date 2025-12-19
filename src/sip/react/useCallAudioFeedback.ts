import { useEffect, useRef } from 'react'
import type { SipClientSnapshot } from '../types'
import { audioFeedbackService } from '../../services/servicoFeedbackAudio'

/**
 * Hook que monitora estados de chamada SIP e toca sons de feedback apropriados.
 * 
 * Sons tocados:
 * - outgoing.mp3: quando está chamando (dialing/ringing outgoing)
 * - ingoing.mp3: quando está recebendo chamada (incoming)
 * - busy.mp3: quando recebe status 486 (Busy Here) ou erro de ocupado
 * - cancel-call.mp3: quando cancela ou encerra chamada
 */
export function useCallAudioFeedback(snapshot: SipClientSnapshot): void {
  const prevStatusRef = useRef<typeof snapshot.callStatus>(snapshot.callStatus)
  const prevDirectionRef = useRef<typeof snapshot.callDirection>(snapshot.callDirection)
  const prevErrorRef = useRef<string | undefined>(snapshot.lastError)
  const wasPlayingOutgoingRef = useRef(false)
  const wasPlayingIngoingRef = useRef(false)

  useEffect(() => {
    const prevStatus = prevStatusRef.current
    const prevDirection = prevDirectionRef.current
    const prevError = prevErrorRef.current
    const currentStatus = snapshot.callStatus
    const currentDirection = snapshot.callDirection
    const currentError = snapshot.lastError

    // Detecção de busy: verifica se há erro novo relacionado a busy
    const isBusyError =
      currentError &&
      currentError !== prevError &&
      (currentError.toLowerCase().includes('busy') ||
        currentError.includes('486') ||
        currentError.includes('Ocupado'))

    // Detecção de cancelamento: transição de qualquer estado de chamada para idle/terminated
    const wasInCall =
      prevStatus === 'dialing' ||
      prevStatus === 'ringing' ||
      prevStatus === 'incoming' ||
      prevStatus === 'established' ||
      prevStatus === 'terminating'
    const isNowIdle = currentStatus === 'idle' || currentStatus === 'terminated'

    // Caso 1: Busy detectado
    if (isBusyError) {
      audioFeedbackService.stopAll()
      audioFeedbackService.play('busy')
      // Atualiza referências
      prevStatusRef.current = currentStatus
      prevDirectionRef.current = currentDirection
      prevErrorRef.current = currentError
      wasPlayingOutgoingRef.current = false
      wasPlayingIngoingRef.current = false
      return
    }

    // Caso 2: Cancelamento (transição de chamada ativa para idle)
    // Toca cancel-call quando:
    // - Cancela durante dialing/ringing (chamada não estabelecida)
    // - Encerra chamada estabelecida (tanto local quanto remoto)
    if (wasInCall && isNowIdle) {
      // Para sons de chamada se estavam tocando
      audioFeedbackService.stopAll()
      
      // Toca cancel-call em todos os casos de cancelamento/encerramento
      // Exceto se foi busy (já tratado no Caso 1)
      if (!isBusyError) {
        audioFeedbackService.play('cancel-call')
      }
      
      wasPlayingOutgoingRef.current = false
      wasPlayingIngoingRef.current = false
      prevStatusRef.current = currentStatus
      prevDirectionRef.current = currentDirection
      prevErrorRef.current = currentError
      return
    }

    // Caso 3: Chamada de saída (outgoing)
    if (
      currentDirection === 'outgoing' &&
      (currentStatus === 'dialing' || currentStatus === 'ringing')
    ) {
      if (!wasPlayingOutgoingRef.current) {
        audioFeedbackService.stopAll()
        audioFeedbackService.play('outgoing')
        wasPlayingOutgoingRef.current = true
        wasPlayingIngoingRef.current = false
      }
      // Se a chamada foi estabelecida, para o som
      if (currentStatus === 'established') {
        audioFeedbackService.stop()
        wasPlayingOutgoingRef.current = false
      }
    } else if (wasPlayingOutgoingRef.current && currentStatus !== 'dialing' && currentStatus !== 'ringing') {
      // Para outgoing se não está mais em dialing/ringing
      audioFeedbackService.stop()
      wasPlayingOutgoingRef.current = false
    }

    // Caso 4: Chamada recebida (incoming)
    if (currentStatus === 'incoming') {
      if (!wasPlayingIngoingRef.current) {
        audioFeedbackService.stopAll()
        audioFeedbackService.play('ingoing')
        wasPlayingIngoingRef.current = true
        wasPlayingOutgoingRef.current = false
      }
      // Se a chamada foi estabelecida, para o som
      if (currentStatus === 'established') {
        audioFeedbackService.stop()
        wasPlayingIngoingRef.current = false
      }
    } else if (wasPlayingIngoingRef.current && currentStatus !== 'incoming') {
      // Para ingoing se não está mais em incoming
      audioFeedbackService.stop()
      wasPlayingIngoingRef.current = false
    }

    // Atualiza referências para próxima iteração
    prevStatusRef.current = currentStatus
    prevDirectionRef.current = currentDirection
    prevErrorRef.current = currentError
  }, [snapshot.callStatus, snapshot.callDirection, snapshot.lastError])

  // Cleanup: para todos os sons quando o componente desmonta
  useEffect(() => {
    return () => {
      audioFeedbackService.stopAll()
    }
  }, [])
}

