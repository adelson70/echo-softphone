import type { SipConfig } from '../../../electron/store'
import { getStorage, setStorage } from '../../services/servicoArmazenamento'

const SIP_KEY = 'sip'

export async function loadSipConfig(): Promise<SipConfig | null> {
  try {
    const cfg = await getStorage<SipConfig>(SIP_KEY)
    if (!cfg || typeof cfg !== 'object') return null
    if (!('username' in cfg) || !('password' in cfg) || !('server' in cfg)) return null
    return cfg
  } catch {
    return null
  }
}

export async function saveSipConfig(next: SipConfig): Promise<void> {
  await setStorage(SIP_KEY, next)
}


