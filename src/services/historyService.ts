export type CallHistoryEntry = {
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

export async function addCallEntry(entry: CallHistoryEntry): Promise<void> {
  const history = await getCallHistory()
  history.unshift(entry) // Adiciona no início (mais recente primeiro)
  
  // Limita o histórico ao máximo definido
  const limitedHistory = history.slice(0, MAX_HISTORY_ENTRIES)
  
  await setStorage(STORAGE_KEY, limitedHistory)
}

export async function getCallHistory(): Promise<CallHistoryEntry[]> {
  try {
    const history = await getStorage<CallHistoryEntry[]>(STORAGE_KEY)
    return history || []
  } catch (error) {
    console.error('Erro ao carregar histórico:', error)
    return []
  }
}

export async function clearCallHistory(): Promise<void> {
  await setStorage(STORAGE_KEY, [])
}

export async function deleteCallEntry(id: string): Promise<void> {
  const history = await getCallHistory()
  const filtered = history.filter((entry) => entry.id !== id)
  await setStorage(STORAGE_KEY, filtered)
}

export async function updateCallEntry(
  id: string,
  updates: Partial<CallHistoryEntry>
): Promise<void> {
  const history = await getCallHistory()
  const index = history.findIndex((entry) => entry.id === id)
  
  if (index === -1) {
    console.warn(`Entrada de histórico não encontrada: ${id}`)
    return
  }
  
  history[index] = { ...history[index], ...updates }
  await setStorage(STORAGE_KEY, history)
}

// Funções auxiliares de storage (reutilizando do storageService)
async function getStorage<T = any>(key: string): Promise<T> {
  if (typeof window !== 'undefined' && (window as any).storage?.get) {
    return await window.storage.get(key)
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem(key)
    return (raw ? JSON.parse(raw) : undefined) as T
  }

  throw new Error('Storage indisponível')
}

async function setStorage(key: string, value: any): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).storage?.set) {
    await window.storage.set(key, value)
    return
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, JSON.stringify(value))
    return
  }

  throw new Error('Storage indisponível')
}

