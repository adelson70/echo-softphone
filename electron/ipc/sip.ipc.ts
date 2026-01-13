/**
 * @file sip.ipc.ts
 * @brief IPC handlers para o módulo nativo PJSIP
 * 
 * Este arquivo configura os handlers IPC que permitem ao renderer process
 * se comunicar com o módulo nativo PJSIP no main process.
 */

import { ipcMain, app } from 'electron'
import path from 'node:path'
import { createRequire } from 'node:module'
import { getMainWindow } from '../app/lifecycle'

// Criar require para ES modules
const require = createRequire(import.meta.url)

// Tipo para as credenciais SIP
interface NativeSipCredentials {
  username: string
  password: string
  server: string
  port: number
  transport: 'udp' | 'tcp'
}

// Tipo para o snapshot de estado
interface NativeSipSnapshot {
  connection: string
  callStatus: string
  callDirection: string
  muted: boolean
  lastError?: string
  username?: string
  domain?: string
  incoming?: {
    displayName: string
    user: string
    uri: string
  }
}

// Tipo para dispositivo de áudio
interface AudioDevice {
  id: number
  name: string
  inputCount: number
  outputCount: number
  isDefault: boolean
}

// Interface do módulo nativo
interface PjsipAddon {
  init(): boolean
  destroy(): void
  isInitialized(): boolean
  register(credentials: NativeSipCredentials): boolean
  unregister(): boolean
  makeCall(target: string): boolean
  answerCall(): boolean
  rejectCall(): boolean
  hangupCall(): boolean
  sendDtmf(digits: string): boolean
  transferBlind(target: string): boolean
  transferAttended(target: string): boolean
  setMuted(muted: boolean): void
  toggleMuted(): boolean
  isMuted(): boolean
  getAudioDevices(): AudioDevice[]
  setAudioDevices(captureId: number, playbackId: number): boolean
  getSnapshot(): NativeSipSnapshot
  setEventCallback(callback: (event: string, payload: string) => void): void
  clearEventCallback(): void
  processEvents(): void
}

// Instância do addon nativo (carregado sob demanda)
let sipAddon: PjsipAddon | null = null

/**
 * Carrega o módulo nativo PJSIP
 */
function loadNativeAddon(): PjsipAddon | null {
  if (sipAddon) {
    return sipAddon
  }

  try {
    // Determinar o caminho do addon baseado no ambiente
    let addonPath: string

    if (app.isPackaged) {
      // Em produção, o addon está em resources/native/
      addonPath = path.join(process.resourcesPath, 'native', 'pjsip_addon.node')
    } else {
      // Em desenvolvimento, está em native/build/Release/
      // app.getAppPath() retorna o diretório do app (raiz do projeto em dev)
      const appPath = app.getAppPath()
      addonPath = path.join(appPath, 'native', 'build', 'Release', 'pjsip_addon.node')
    }

    console.log('[SIP Native] Carregando addon de:', addonPath)
    
    sipAddon = require(addonPath) as PjsipAddon
    
    console.log('[SIP Native] Addon carregado com sucesso')
    return sipAddon
  } catch (error) {
    console.error('[SIP Native] Erro ao carregar addon:', error)
    return null
  }
}

/**
 * Configura os handlers IPC para o módulo nativo
 */
export function setupSipIPC(): void {
  // Inicialização
  ipcMain.handle('sip-native:init', async () => {
    const addon = loadNativeAddon()
    if (!addon) {
      return { success: false, error: 'Módulo nativo não disponível' }
    }

    try {
      const result = addon.init()
      return { success: result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Destruir
  ipcMain.handle('sip-native:destroy', async () => {
    if (sipAddon) {
      try {
        sipAddon.clearEventCallback()
        sipAddon.destroy()
      } catch (error) {
        console.error('[SIP Native] Erro ao destruir:', error)
      }
    }
    return { success: true }
  })

  // Verificar se está inicializado
  ipcMain.handle('sip-native:isInitialized', async () => {
    if (!sipAddon) return false
    return sipAddon.isInitialized()
  })

  // Registrar
  ipcMain.handle('sip-native:register', async (_, credentials: NativeSipCredentials) => {
    const addon = loadNativeAddon()
    if (!addon) {
      return { success: false, error: 'Módulo nativo não disponível' }
    }

    try {
      const result = addon.register(credentials)
      return { success: result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Desregistrar
  ipcMain.handle('sip-native:unregister', async () => {
    if (!sipAddon) {
      return { success: false, error: 'Módulo não inicializado' }
    }

    try {
      const result = sipAddon.unregister()
      return { success: result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Fazer chamada
  ipcMain.handle('sip-native:makeCall', async (_, target: string) => {
    if (!sipAddon) {
      return { success: false, error: 'Módulo não inicializado' }
    }

    try {
      const result = sipAddon.makeCall(target)
      return { success: result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Atender chamada
  ipcMain.handle('sip-native:answerCall', async () => {
    if (!sipAddon) {
      return { success: false, error: 'Módulo não inicializado' }
    }

    try {
      const result = sipAddon.answerCall()
      return { success: result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Rejeitar chamada
  ipcMain.handle('sip-native:rejectCall', async () => {
    if (!sipAddon) {
      return { success: false, error: 'Módulo não inicializado' }
    }

    try {
      const result = sipAddon.rejectCall()
      return { success: result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Desligar chamada
  ipcMain.handle('sip-native:hangupCall', async () => {
    if (!sipAddon) {
      return { success: false, error: 'Módulo não inicializado' }
    }

    try {
      const result = sipAddon.hangupCall()
      return { success: result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Enviar DTMF
  ipcMain.handle('sip-native:sendDtmf', async (_, digits: string) => {
    if (!sipAddon) {
      return { success: false, error: 'Módulo não inicializado' }
    }

    try {
      const result = sipAddon.sendDtmf(digits)
      return { success: result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Transferência cega
  ipcMain.handle('sip-native:transferBlind', async (_, target: string) => {
    if (!sipAddon) {
      return { success: false, error: 'Módulo não inicializado' }
    }

    try {
      const result = sipAddon.transferBlind(target)
      return { success: result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Transferência assistida
  ipcMain.handle('sip-native:transferAttended', async (_, target: string) => {
    if (!sipAddon) {
      return { success: false, error: 'Módulo não inicializado' }
    }

    try {
      const result = sipAddon.transferAttended(target)
      return { success: result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Definir mute
  ipcMain.handle('sip-native:setMuted', async (_, muted: boolean) => {
    if (!sipAddon) return

    try {
      sipAddon.setMuted(muted)
    } catch (error) {
      console.error('[SIP Native] Erro ao definir mute:', error)
    }
  })

  // Alternar mute
  ipcMain.handle('sip-native:toggleMuted', async () => {
    if (!sipAddon) return false

    try {
      return sipAddon.toggleMuted()
    } catch (error) {
      console.error('[SIP Native] Erro ao alternar mute:', error)
      return false
    }
  })

  // Verificar mute
  ipcMain.handle('sip-native:isMuted', async () => {
    if (!sipAddon) return false
    return sipAddon.isMuted()
  })

  // Obter dispositivos de áudio
  ipcMain.handle('sip-native:getAudioDevices', async () => {
    if (!sipAddon) return []

    try {
      return sipAddon.getAudioDevices()
    } catch (error) {
      console.error('[SIP Native] Erro ao obter dispositivos:', error)
      return []
    }
  })

  // Definir dispositivos de áudio
  ipcMain.handle('sip-native:setAudioDevices', async (_, captureId: number, playbackId: number) => {
    if (!sipAddon) {
      return { success: false, error: 'Módulo não inicializado' }
    }

    try {
      const result = sipAddon.setAudioDevices(captureId, playbackId)
      return { success: result }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Obter snapshot
  ipcMain.handle('sip-native:getSnapshot', async () => {
    if (!sipAddon) {
      return {
        connection: 'idle',
        callStatus: 'idle',
        callDirection: 'none',
        muted: false
      }
    }

    try {
      return sipAddon.getSnapshot()
    } catch (error) {
      console.error('[SIP Native] Erro ao obter snapshot:', error)
      return {
        connection: 'idle',
        callStatus: 'idle',
        callDirection: 'none',
        muted: false
      }
    }
  })

  // Registrar callback de eventos
  ipcMain.handle('sip-native:setEventCallback', async () => {
    if (!sipAddon) {
      return { success: false, error: 'Módulo não inicializado' }
    }

    try {
      sipAddon.setEventCallback((event: string, payload: string) => {
        // Enviar evento para o renderer via IPC
        const mainWindow = getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('sip-native:event', { event, payload })
        }
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Remover callback de eventos
  ipcMain.handle('sip-native:clearEventCallback', async () => {
    if (sipAddon) {
      try {
        sipAddon.clearEventCallback()
      } catch (error) {
        console.error('[SIP Native] Erro ao limpar callback:', error)
      }
    }
    return { success: true }
  })

  console.log('[SIP Native] IPC handlers configurados')
}

/**
 * Limpa recursos do módulo nativo
 */
export function cleanupSipNative(): void {
  if (sipAddon) {
    try {
      sipAddon.clearEventCallback()
      sipAddon.destroy()
    } catch (error) {
      console.error('[SIP Native] Erro ao limpar:', error)
    }
    sipAddon = null
  }
}
