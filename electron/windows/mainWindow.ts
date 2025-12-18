import { BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { VITE_DEV_SERVER_URL, RENDERER_DIST } from '../app/paths'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    icon: path.join(__dirname, 'assets', 'icon.png'),
    width: Number(process.env.WINDOW_WIDTH),
    height: Number(process.env.WINDOW_HEIGHT),
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      // `preload.mjs` é gerado pelo vite-plugin-electron em `dist-electron/`
      // e fica no mesmo diretório do `main.js` em runtime.
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setMenuBarVisibility(false)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  return win
}

