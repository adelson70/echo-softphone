export async function obterArmazenamento<T = any>(chave: string): Promise<T> {
  // Preferência: Electron Store via preload (contextBridge)
  if (typeof window !== 'undefined' && (window as any).storage?.get) {
    return await window.storage.get(chave)
  }

  // Fallback (browser / `npm run dev` que roda só o Vite): localStorage
  // Mantém a UI funcionando fora do Electron, mas o softphone SIP deve rodar no Electron.
  if (typeof window !== 'undefined' && window.localStorage) {
    console.warn('[storageService] window.storage não está disponível; usando localStorage como fallback (modo browser).')
    const raw = window.localStorage.getItem(chave)
    return (raw ? JSON.parse(raw) : undefined) as T
  }

  throw new Error('Storage indisponível: rode no Electron (preload) para usar window.storage.')
}

export async function definirArmazenamento(chave: string, valor: any): Promise<void> {
  // Preferência: Electron Store via preload (contextBridge)
  if (typeof window !== 'undefined' && (window as any).storage?.set) {
    await window.storage.set(chave, valor)
    return
  }

  // Fallback (browser / Vite puro)
  if (typeof window !== 'undefined' && window.localStorage) {
    console.warn('[storageService] window.storage não está disponível; salvando em localStorage como fallback (modo browser).')
    window.localStorage.setItem(chave, JSON.stringify(valor))
    return
  }

  throw new Error('Storage indisponível: rode no Electron (preload) para usar window.storage.')
}

export async function limparArmazenamento(): Promise<void> {
  // Preferência: Electron Store via preload (contextBridge)
  if (typeof window !== 'undefined' && (window as any).storage?.clear) {
    await window.storage.clear()
    return
  }

  // Fallback (browser)
  if (typeof window !== 'undefined' && window.localStorage) {
    console.warn('[storageService] window.storage não está disponível; limpando localStorage (modo browser).')
    window.localStorage.clear()
    return
  }
}

// Aliases para manter compatibilidade durante a transição
export const getStorage = obterArmazenamento
export const setStorage = definirArmazenamento
export const clearStorage = limparArmazenamento

