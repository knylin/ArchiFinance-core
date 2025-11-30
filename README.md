# ArchiFinance Core - 建築專案財務管理系統

<div align="center">
  <h3 align="center">專為建築師事務所設計的輕量級財務管理工具</h3>
</div>

## 🌟 專案簡介

ArchiFinance Core 是一個基於 React 開發的單頁應用程式 (SPA)，專注於解決建築專案的報價、分期請款與成本追蹤問題。

**特色：**
*   **完全離線**：資料儲存於瀏覽器 LocalStorage，無需連網。
*   **資料隱私**：資料不出您的電腦。
*   **A4 輸出**：自動排版的報價單與請款單 PDF 預覽。
*   **成本損益**：即時計算專案淨利。

---

## 💻 如何在電腦上安裝 (單機版部署)

由於現代瀏覽器的安全性限制，本系統建議透過輕量級伺服器啟動，而非直接點擊 html 檔案。

### 步驟 1：安裝環境
1. 下載並安裝 **[Node.js](https://nodejs.org/)** (建議選擇 LTS 版本)。
2. 下載本專案程式碼至您的電腦。

### 步驟 2：安裝依賴與打包
在專案資料夾中開啟終端機 (Terminal / CMD)，執行以下指令：

```bash
# 1. 安裝程式所需的套件
npm install

# 2. 編譯成可執行的靜態檔案 (會產生 dist 資料夾)
npm run build
```

### 步驟 3：製作「一鍵啟動」圖示

為了方便日後使用，您可以製作一個啟動腳本，放在桌面上。

#### 🪟 Windows 使用者

1. 在專案資料夾中，建立一個新文字文件。
2. 貼上以下內容：
   ```batch
   @echo off
   echo 正在啟動 ArchiFinance Core...
   cd /d "%~dp0"
   npm run preview
   ```
3. 將檔案另存為 `啟動系統.bat` (注意副檔名要是 .bat)。
4. 以後只需點擊這個檔案，系統就會自動啟動並打開瀏覽器。

#### 🍎 Mac 使用者

1. 開啟終端機，進入專案目錄。
2. 執行 `npm run preview` 即可啟動。
3. 若要製作自動腳本，可建立 `start.command` 檔案：
   ```bash
   #!/bin/bash
   cd "$(dirname "$0")"
   npm run preview
   ```
4. 記得執行 `chmod +x start.command` 給予執行權限。

---

## 🛠️ 開發模式

如果您是開發者，想要修改程式碼：

```bash
npm run dev
```

## ⚠️ 資料備份提醒

本系統採用 **LocalStorage** 技術。
*   **風險**：清除瀏覽器快取或重灌電腦會導致資料遺失。
*   **建議**：請定期使用系統右上角的「匯出 JSON」功能進行備份。

