import { ipcMain } from 'electron'
import { appStore } from '../store'

export function setupStoreIPC(): void {
  ipcMain.handle('store:get', (_event, key: string) => {
    return appStore.get(key)
  })

  ipcMain.handle('store:set', (_event, key: string, value: any) => {
    appStore.set(key, value)
  })

  ipcMain.handle('store:clear', () => {
    appStore.clear()
  })

  ipcMain.handle('store:delete', (_event, key: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(appStore as any).delete(key)
  })
}

