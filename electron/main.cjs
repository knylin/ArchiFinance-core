const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // 建立瀏覽器視窗
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // 允許在渲染進程中使用 Node.js API
      webSecurity: false // 允許讀取本地資源
    },
  });

  // 判斷是否為打包後的生產環境
  if (app.isPackaged) {
    // 生產環境：載入打包好的 index.html
    // 使用 path.join 確保路徑正確指向 dist/index.html
    // 在 asar 打包結構中，__dirname 通常位於 resources/app.asar/electron
    // 所以 ../dist/index.html 指向 resources/app.asar/dist/index.html
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // 開發環境：載入 Vite 開發伺服器網址
    win.loadURL('http://localhost:3000');
    // 開發環境自動開啟開發者工具，方便除錯
    // win.webContents.openDevTools();
  }

  // 隱藏上方選單列 (讓介面更像原生 App)
  win.setMenuBarVisibility(false);
}

// 當 Electron 完成初始化時
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // 在 macOS 上，當點擊 dock 圖示且沒有視窗開啟時，重新建立視窗
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 當所有視窗關閉時退出程式 (Windows/Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
