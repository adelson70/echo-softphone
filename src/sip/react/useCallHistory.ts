import { useEffect, useRef } from 'react'
import type { SipClientSnapshot } from '../types'
import { addCallEntry, updateCallEntry, type CallHistoryEntry } from '../../services/historyService'

type UseCallHistoryOptions = {
  snapshot: SipClientSnapshot
  currentDialNumber?: string
}

// Módulo compartilhado para armazenar o número atual sendo discado
let currentDialNumber: string | null = null

export function setCurrentDialNumber(number: string | null): void {
  currentDialNumber = number
}

let currentCallEntryId: string | null = null
let callStartTime: number | null = null

export function useCallHistory({ snapshot, currentDialNumber: dialNumber }: UseCallHistoryOptions): void {
  const prevSnapshotRef = useRef<SipClientSnapshot>(snapshot)
  const prevCallStatusRef = useRef(snapshot.callStatus)

  useEffect(() => {
    const prevSnapshot = prevSnapshotRef.current
    const prevCallStatus = prevCallStatusRef.current
    const currentCallStatus = snapshot.callStatus

    // Detecta início de chamada de saída
    if (
      prevCallStatus === 'idle' &&
      currentCallStatus === 'dialing' &&
      snapshot.callDirection === 'outgoing'
    ) {
      const entryId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      currentCallEntryId = entryId
      callStartTime = Date.now()

      const number = dialNumber || currentDialNumber || 'Desconhecido'

      const entry: CallHistoryEntry = {
        id: entryId,
        number,
        direction: 'outgoing',
        status: 'failed', // Status inicial, será atualizado
        startTime: callStartTime,
      }

      void addCallEntry(entry)
    }

    // Detecta início de chamada de entrada
    if (
      prevCallStatus === 'idle' &&
      currentCallStatus === 'incoming' &&
      snapshot.callDirection === 'incoming'
    ) {
      const entryId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      currentCallEntryId = entryId
      callStartTime = Date.now()

      const entry: CallHistoryEntry = {
        id: entryId,
        number: snapshot.incoming?.user || snapshot.incoming?.uri || 'Desconhecido',
        displayName: snapshot.incoming?.displayName,
        direction: 'incoming',
        status: 'missed', // Status inicial, será atualizado se atender
        startTime: callStartTime,
      }

      void addCallEntry(entry)
    }

    // Atualiza quando chamada é estabelecida
    if (
      prevCallStatus !== 'established' &&
      currentCallStatus === 'established' &&
      currentCallEntryId
    ) {
      const updates: Partial<CallHistoryEntry> = {
        status: snapshot.callDirection === 'incoming' ? 'answered' : 'completed',
      }

      // Se for chamada de saída e o número ainda não foi definido, atualiza
      if (snapshot.callDirection === 'outgoing' && (dialNumber || currentDialNumber)) {
        const number = dialNumber || currentDialNumber
        if (number) {
          updates.number = number
        }
      }

      void updateCallEntry(currentCallEntryId, updates)
    }

    // Finaliza quando chamada termina
    if (
      prevCallStatus !== 'idle' &&
      currentCallStatus === 'idle' &&
      currentCallEntryId &&
      callStartTime
    ) {
      const endTime = Date.now()
      const duration = Math.floor((endTime - callStartTime) / 1000)

      const updates: Partial<CallHistoryEntry> = {
        endTime,
        duration,
      }

      // Se a chamada não foi estabelecida, marca como falhou ou perdida/rejeitada
      if (prevCallStatus !== 'established') {
        if (snapshot.callDirection === 'incoming') {
          // Se estava em incoming e voltou para idle sem estabelecer, foi rejeitada ou perdida
          updates.status = prevCallStatus === 'incoming' ? 'rejected' : 'missed'
        } else {
          updates.status = 'failed'
        }
      }

      // Atualiza o número se ainda não foi definido (para chamadas de saída)
      if (snapshot.callDirection === 'outgoing' && (dialNumber || currentDialNumber)) {
        const number = dialNumber || currentDialNumber
        if (number) {
          updates.number = number
        }
      }

      void updateCallEntry(currentCallEntryId, updates)
      currentCallEntryId = null
      callStartTime = null
      currentDialNumber = null // Limpa após finalizar
    }

    // Atualiza referências
    prevSnapshotRef.current = snapshot
    prevCallStatusRef.current = currentCallStatus
  }, [snapshot, dialNumber])
}

