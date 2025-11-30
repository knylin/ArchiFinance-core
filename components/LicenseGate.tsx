import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Unlock, AlertTriangle } from 'lucide-react';

interface LicenseGateProps {
  children: React.ReactNode;
}

export const LicenseGate: React.FC<LicenseGateProps> = ({ children }) => {
  const [isLicensed, setIsLicensed] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [machineId, setMachineId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 簡單檢測是否為 Electron 環境
  const isElectron = navigator.userAgent.toLowerCase().includes(' electron/');

  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    if (!isElectron) {
      // 非 Electron 環境 (瀏覽器預覽)，直接通過，但顯示提示條
      setLoading(false);
      setIsLicensed(true);
      return;
    }

    try {
      // @ts-ignore
      const { ipcRenderer } = window.require('electron');
      
      const id = await ipcRenderer.invoke('get-machine-id');
      setMachineId(id);

      const storedKey = localStorage.getItem('archifinance_license_key');
      if (storedKey) {
        const isValid = await ipcRenderer.invoke('verify-license', storedKey);
        if (isValid) {
          setIsLicensed(true);
        }
      }
    } catch (err) {
      console.error('License check failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!isElectron) return;
    
    setError('');
    setLoading(true);
    try {
      // @ts-ignore
      const { ipcRenderer } = window.require('electron');
      const isValid = await ipcRenderer.invoke('verify-license', licenseKey);
      
      if (isValid) {
        localStorage.setItem('archifinance_license_key', licenseKey);
        setIsLicensed(true);
      } else {
        setError('授權碼無效，請確認是否輸入正確。');
      }
    } catch (err) {
      setError('驗證發生錯誤。');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm">正在驗證授權...</p>
        </div>
      </div>
    );
  }

  // 瀏覽器預覽模式：渲染內容加上提示
  if (!isElectron) {
    return (
      <>
        <div className="bg-yellow-600/20 text-yellow-500 text-xs text-center py-1 border-b border-yellow-600/20 print:hidden select-none">
          開發預覽模式：已略過授權驗證 (僅在瀏覽器中顯示)
        </div>
        {children}
      </>
    );
  }

  // Electron 模式且已授權
  if (isLicensed) {
    return <>{children}</>;
  }

  // Electron 模式且未授權 (鎖定畫面)
  return (
    <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl animate-in zoom-in-95">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-red-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">軟體尚未啟用</h1>
          <p className="text-zinc-400 text-sm">
            請輸入授權金鑰以解除鎖定。此軟體授權綁定您的硬體裝置。
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-950 p-4 rounded border border-zinc-800">
            <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">您的機器識別碼 (Machine ID)</label>
            <code className="block bg-black/50 p-2 rounded text-teal-400 font-mono text-sm break-all select-all cursor-pointer hover:bg-black/70 transition-colors" onClick={() => navigator.clipboard.writeText(machineId)} title="點擊複製">
              {machineId || '讀取中...'}
            </code>
            <p className="text-[10px] text-zinc-600 mt-2 text-center">
              請將此代碼複製並傳送給管理員以取得授權金鑰
            </p>
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">輸入授權金鑰</label>
            <input 
              type="text" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-3 text-white focus:outline-none focus:border-teal-500 font-mono text-sm"
              placeholder="貼上您的授權碼..."
              value={licenseKey}
              onChange={e => setLicenseKey(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/10 p-3 rounded border border-red-900/50">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <button 
            onClick={handleActivate}
            disabled={!licenseKey}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Unlock size={18} /> 啟用軟體
          </button>
        </div>
        
        <div className="mt-8 text-center text-xs text-zinc-600">
          &copy; ArchiFinance Core. All rights reserved.
        </div>
      </div>
    </div>
  );
};