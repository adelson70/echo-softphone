import { setupAppLifecycle } from './app/lifecycle'
import { setupStoreIPC } from './ipc/store.ipc'
import { setupWindowIPC } from './ipc/window.ipc'
import { setupSipIPC, cleanupSipNative } from './ipc/sip.ipc'
import { createMainWindow } from './windows/mainWindow'
import { app } from 'electron'
import './app/paths' // inicializa paths

setupStoreIPC()
setupWindowIPC()
setupSipIPC()
setupAppLifecycle(createMainWindow)

// Limpar recursos nativos ao fechar
app.on('before-quit', () => {
  cleanupSipNative()
})
