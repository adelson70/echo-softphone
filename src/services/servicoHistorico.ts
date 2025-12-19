export type EntradaHistoricoChamadas = {
  id: string
  number: string
  displayName?: string
  direction: 'incoming' | 'outgoing'
  status: 'answered' | 'missed' | 'rejected' | 'failed' | 'completed'
  startTime: number
  endTime?: number
  duration?: number
}

const MAX_HISTORY_ENTRIES = 1000
const STORAGE_KEY = 'callHistory'

export async function adicionarEntradaChamada(entrada: EntradaHistoricoChamadas): Promise<void> {
  const historico = await obterHistoricoChamadas()
  historico.unshift(entrada) // Adiciona no início (mais recente primeiro)
  
  // Limita o histórico ao máximo definido
  const historicoLimitado = historico.slice(0, MAX_HISTORY_ENTRIES)
  
  await setStorage(STORAGE_KEY, historicoLimitado)
}

export async function obterHistoricoChamadas(): Promise<EntradaHistoricoChamadas[]> {
  try {
    const historico = await getStorage<EntradaHistoricoChamadas[]>(STORAGE_KEY)
    return historico || []
  } catch (error) {
    console.error('Erro ao carregar histórico:', error)
    return []
  }
}

export async function limparHistoricoChamadas(): Promise<void> {
  await setStorage(STORAGE_KEY, [])
}

export async function excluirEntradaChamada(id: string): Promise<void> {
  const historico = await obterHistoricoChamadas()
  const filtrado = historico.filter((entrada) => entrada.id !== id)
  await setStorage(STORAGE_KEY, filtrado)
}

export async function atualizarEntradaChamada(
  id: string,
  updates: Partial<EntradaHistoricoChamadas>
): Promise<void> {
  const historico = await obterHistoricoChamadas()
  const indice = historico.findIndex((entrada) => entrada.id === id)
  
  if (indice === -1) {
    console.warn(`Entrada de histórico não encontrada: ${id}`)
    return
  }
  
  historico[indice] = { ...historico[indice], ...updates }
  await setStorage(STORAGE_KEY, historico)
}

// Aliases para manter compatibilidade durante a transição
export const getCallHistory = obterHistoricoChamadas
export const addCallEntry = adicionarEntradaChamada
export const clearCallHistory = limparHistoricoChamadas
export const deleteCallEntry = excluirEntradaChamada
export const updateCallEntry = atualizarEntradaChamada
export type CallHistoryEntry = EntradaHistoricoChamadas

// Funções auxiliares de storage (reutilizando do servicoArmazenamento)
import { obterArmazenamento as getStorage, definirArmazenamento as setStorage } from './servicoArmazenamento'

