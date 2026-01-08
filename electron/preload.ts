import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// --------- Expose storage API to the Renderer process ---------
contextBridge.exposeInMainWorld('storage', {
  get(key: string) {
    return ipcRenderer.invoke('store:get', key)
  },
  set(key: string, value: any) {
    return ipcRenderer.invoke('store:set', key, value)
  },
  clear() {
    return ipcRenderer.invoke('store:clear')
  },
})

// --------- Expose Native SIP API to the Renderer process ---------
contextBridge.exposeInMainWorld('sipNative', {
  // Lifecycle
  init() {
    return ipcRenderer.invoke('sip-native:init')
  },
  destroy() {
    return ipcRenderer.invoke('sip-native:destroy')
  },
  isInitialized() {
    return ipcRenderer.invoke('sip-native:isInitialized')
  },

  // Registration
  register(credentials: {
    username: string
    password: string
    server: string
    port: number
    transport: 'udp' | 'tcp'
  }) {
    return ipcRenderer.invoke('sip-native:register', credentials)
  },
  unregister() {
    return ipcRenderer.invoke('sip-native:unregister')
  },

  // Calls
  makeCall(target: string) {
    return ipcRenderer.invoke('sip-native:makeCall', target)
  },
  answerCall() {
    return ipcRenderer.invoke('sip-native:answerCall')
  },
  rejectCall() {
    return ipcRenderer.invoke('sip-native:rejectCall')
  },
  hangupCall() {
    return ipcRenderer.invoke('sip-native:hangupCall')
  },

  // DTMF
  sendDtmf(digits: string) {
    return ipcRenderer.invoke('sip-native:sendDtmf', digits)
  },

  // Transfer
  transferBlind(target: string) {
    return ipcRenderer.invoke('sip-native:transferBlind', target)
  },
  transferAttended(target: string) {
    return ipcRenderer.invoke('sip-native:transferAttended', target)
  },

  // Audio
  setMuted(muted: boolean) {
    return ipcRenderer.invoke('sip-native:setMuted', muted)
  },
  toggleMuted() {
    return ipcRenderer.invoke('sip-native:toggleMuted')
  },
  isMuted() {
    return ipcRenderer.invoke('sip-native:isMuted')
  },
  getAudioDevices() {
    return ipcRenderer.invoke('sip-native:getAudioDevices')
  },
  setAudioDevices(captureId: number, playbackId: number) {
    return ipcRenderer.invoke('sip-native:setAudioDevices', captureId, playbackId)
  },

  // State
  getSnapshot() {
    return ipcRenderer.invoke('sip-native:getSnapshot')
  },

  // Events
  setEventCallback() {
    return ipcRenderer.invoke('sip-native:setEventCallback')
  },
  clearEventCallback() {
    return ipcRenderer.invoke('sip-native:clearEventCallback')
  },
  onEvent(callback: (data: { event: string; payload: string }) => void) {
    const handler = (_event: Electron.IpcRendererEvent, data: { event: string; payload: string }) => {
      callback(data)
    }
    ipcRenderer.on('sip-native:event', handler)
    return () => {
      ipcRenderer.off('sip-native:event', handler)
    }
  },
})