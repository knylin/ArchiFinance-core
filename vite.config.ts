import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 關鍵設定：支援相對路徑部署 (NAS/Docker 子目錄)
  server: {
    port: 3000,
    open: true, // 啟動時自動開啟瀏覽器
  },
  preview: {
    port: 3000,
    open: true, // 預覽 Build 結果時自動開啟瀏覽器
  }
})