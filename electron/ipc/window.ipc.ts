import { ipcMain } from 'electron'
import { getMainWindow } from '../app/lifecycle'

export function setupWindowIPC(): void {
  ipcMain.handle('window:restoreAndFocus', () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      return
    }

    // Restaura a janela se estiver minimizada
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }

    // Mostra a janela se estiver oculta
    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }

    // Traz a janela para o primeiro plano
    mainWindow.focus()

    // No Linux, pode ser necessário usar setAlwaysOnTop temporariamente
    // para garantir que a janela apareça acima de outras
    if (process.platform === 'linux') {
      const wasAlwaysOnTop = mainWindow.isAlwaysOnTop()
      if (!wasAlwaysOnTop) {
        mainWindow.setAlwaysOnTop(true)
        // Remove o alwaysOnTop após um breve delay para não interferir com o comportamento normal
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setAlwaysOnTop(false)
          }
        }, 100)
      }
    }
  })
}



