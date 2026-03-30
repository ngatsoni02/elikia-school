const { app, BrowserWindow, session } = require('electron');
const path = require('path');

let dbModule = null;
let ipcModule = null;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // icon: path.join(__dirname, '../../assets/icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, '../../index.html'));

  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';"
        ],
      },
    });
  });

  // Only open DevTools in development
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  // Initialize database
  try {
    dbModule = require('./database');
    dbModule.initDatabase();
    console.log('[Main] Database initialized');
  } catch (err) {
    console.warn('[Main] SQLite not available, falling back to localStorage mode:', err.message);
  }

  // Register IPC handlers
  try {
    ipcModule = require('./ipc-handlers');
    ipcModule.registerIpcHandlers();
    console.log('[Main] IPC handlers registered');
  } catch (err) {
    console.warn('[Main] IPC handlers not registered:', err.message);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (dbModule) {
    try {
      dbModule.closeDatabase();
      console.log('[Main] Database closed');
    } catch (err) {
      console.error('[Main] Error closing database:', err);
    }
  }
});
