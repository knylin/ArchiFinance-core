import React, { useState } from 'react';
import { AppSettings, BankAccount, Project } from '../types';
import { Save, Plus, Trash2, Building2, CreditCard, Tag, DownloadCloud, AlertTriangle } from 'lucide-react';
import { fetchProjectsFromServer } from '../services/storage';

interface SettingsProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onSyncServer?: (projects: Project[]) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave, onSyncServer }) => {
  const [activeTab, setActiveTab] = useState<'firm' | 'bank' | 'types' | 'sync'>('firm');
  const [newType, setNewType] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Local state for editing
  const [formData, setFormData] = useState<AppSettings>(settings);

  const handleFirmChange = (field: keyof typeof formData.firmInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      firmInfo: { ...prev.firmInfo, [field]: value }
    }));
  };

  const addBankAccount = () => {
    const newAccount: BankAccount = {
      id: crypto.randomUUID(),
      bankName: '新銀行帳戶',
      branch: '',
      accountNumber: '',
      accountName: ''
    };
    setFormData(prev => ({
      ...prev,
      bankAccounts: [...prev.bankAccounts, newAccount]
    }));
  };

  const updateBankAccount = (id: string, field: keyof BankAccount, value: string) => {
    setFormData(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map(acc => 
        acc.id === id ? { ...acc, [field]: value } : acc
      )
    }));
  };

  const removeBankAccount = (id: string) => {
    if (formData.bankAccounts.length <= 1) {
      alert('至少保留一組銀行帳戶');
      return;
    }
    if (confirm('確定要刪除此帳戶嗎？')) {
      setFormData(prev => ({
        ...prev,
        bankAccounts: prev.bankAccounts.filter(acc => acc.id !== id)
      }));
    }
  };

  const addProjectType = () => {
    if (!newType.trim()) return;
    if (formData.projectTypes.includes(newType.trim())) {
      alert('此類型已存在');
      return;
    }
    setFormData(prev => ({
      ...prev,
      projectTypes: [...prev.projectTypes, newType.trim()]
    }));
    setNewType('');
  };

  const removeProjectType = (type: string) => {
    if (formData.projectTypes.length <= 1) {
      alert('至少保留一個案件類型');
      return;
    }
    setFormData(prev => ({
      ...prev,
      projectTypes: prev.projectTypes.filter(t => t !== type)
    }));
  };

  const handleSave = () => {
    onSave(formData);
    alert('設定已儲存！');
  };

  const handleServerSync = async () => {
    if (!onSyncServer) return;
    if (!confirm('警告：此動作將會從伺服器載入 projects.json 並「覆蓋」您目前瀏覽器上的所有資料。\n\n請確認您目前的工作已備份或不需要保留。\n\n是否繼續？')) {
      return;
    }

    setIsSyncing(true);
    try {
      const projects = await fetchProjectsFromServer();
      onSyncServer(projects);
      alert('同步成功！已載入伺服器端資料。');
    } catch (e) {
      alert('同步失敗：無法讀取伺服器上的 projects.json。\n\n請確認檔案是否存在於 NAS 的網站目錄中。');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white">
      <header className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">系統設定</h1>
          <p className="text-zinc-400 text-sm mt-1">管理事務所基本資料、銀行帳戶與案件分類</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-teal-900/20"
        >
          <Save size={18} />
          <span>儲存設定</span>
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-zinc-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('firm')}
              className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 shrink-0 ${
                activeTab === 'firm'
                  ? 'bg-zinc-900 text-teal-400 border-t border-x border-zinc-800 relative -bottom-[1px]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Building2 size={18} /> 事務所資料
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 shrink-0 ${
                activeTab === 'bank'
                  ? 'bg-zinc-900 text-teal-400 border-t border-x border-zinc-800 relative -bottom-[1px]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <CreditCard size={18} /> 銀行帳戶管理
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 shrink-0 ${
                activeTab === 'types'
                  ? 'bg-zinc-900 text-teal-400 border-t border-x border-zinc-800 relative -bottom-[1px]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Tag size={18} /> 案件類型管理
            </button>
             <button
              onClick={() => setActiveTab('sync')}
              className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 shrink-0 ${
                activeTab === 'sync'
                  ? 'bg-zinc-900 text-teal-400 border-t border-x border-zinc-800 relative -bottom-[1px]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <DownloadCloud size={18} /> 資料同步
            </button>
          </div>

          {/* Firm Info Tab */}
          {activeTab === 'firm' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-b-xl rounded-tr-xl p-6 space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">事務所中文名稱 (主標題)</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                    value={formData.firmInfo.name}
                    onChange={e => handleFirmChange('name', e.target.value)}
                    placeholder="例如：常日建築"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">事務所副標題 (選填)</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                    value={formData.firmInfo.subName || ''}
                    onChange={e => handleFirmChange('subName', e.target.value)}
                    placeholder="例如：+ 將來建築師事務所"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">英文名稱</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                    value={formData.firmInfo.englishName}
                    onChange={e => handleFirmChange('englishName', e.target.value)}
                    placeholder="例如：Office of Architecture"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">統一編號 (選填)</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                    value={formData.firmInfo.taxId || ''}
                    onChange={e => handleFirmChange('taxId', e.target.value)}
                    placeholder="例如：12345678"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-zinc-400">聯絡地址</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                    value={formData.firmInfo.address}
                    onChange={e => handleFirmChange('address', e.target.value)}
                    placeholder="例如：台北市..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">聯絡電話</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                    value={formData.firmInfo.phone}
                    onChange={e => handleFirmChange('phone', e.target.value)}
                    placeholder="例如：0912-345678"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Email (選填)</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                    value={formData.firmInfo.email || ''}
                    onChange={e => handleFirmChange('email', e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bank Accounts Tab */}
          {activeTab === 'bank' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-b-xl rounded-tr-xl p-6 animate-in fade-in">
              <div className="space-y-4">
                {formData.bankAccounts.map((account, index) => (
                  <div key={account.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg relative group">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-500">銀行名稱與代碼</label>
                        <input
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                          value={account.bankName}
                          onChange={e => updateBankAccount(account.id, 'bankName', e.target.value)}
                          placeholder="例如：玉山銀行 (808)"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-500">分行名稱</label>
                        <input
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                          value={account.branch}
                          onChange={e => updateBankAccount(account.id, 'branch', e.target.value)}
                          placeholder="例如：朴子分行"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-500">銀行帳號</label>
                        <input
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white font-mono focus:border-teal-500 focus:outline-none"
                          value={account.accountNumber}
                          onChange={e => updateBankAccount(account.id, 'accountNumber', e.target.value)}
                          placeholder="例如：1234-5678-9012"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-500">戶名</label>
                        <input
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                          value={account.accountName}
                          onChange={e => updateBankAccount(account.id, 'accountName', e.target.value)}
                          placeholder="例如：常日有限公司"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => removeBankAccount(account.id)}
                      className="absolute top-4 right-4 text-zinc-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="刪除此帳戶"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="absolute top-4 right-4 text-zinc-700 text-xs font-mono opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none">
                      #{index + 1}
                    </div>
                  </div>
                ))}

                <button 
                  onClick={addBankAccount}
                  className="w-full py-3 border border-dashed border-zinc-800 rounded-lg text-zinc-500 hover:text-teal-400 hover:bg-zinc-900/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> 新增銀行帳戶
                </button>
              </div>
            </div>
          )}

          {/* Project Types Tab */}
          {activeTab === 'types' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-b-xl rounded-tr-xl p-6 animate-in fade-in">
              <div className="space-y-6">
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    placeholder="輸入新類型名稱 (例如：古蹟修復)"
                    onKeyDown={e => e.key === 'Enter' && addProjectType()}
                  />
                  <button 
                    onClick={addProjectType}
                    disabled={!newType.trim()}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-medium disabled:opacity-50"
                  >
                    新增
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.projectTypes.map(type => (
                    <div key={type} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded group hover:border-zinc-700 transition-colors">
                      <span className="text-zinc-300">{type}</span>
                      <button 
                        onClick={() => removeProjectType(type)}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Server Sync Tab */}
          {activeTab === 'sync' && (
             <div className="bg-zinc-900 border border-zinc-800 rounded-b-xl rounded-tr-xl p-6 animate-in fade-in">
               <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg text-center">
                 <DownloadCloud size={48} className="mx-auto text-zinc-700 mb-4" />
                 <h3 className="text-lg font-medium text-white mb-2">NAS 中央檔案同步</h3>
                 <p className="text-zinc-500 text-sm mb-6 max-w-md mx-auto">
                   此功能將會嘗試讀取 NAS 伺服器上的 <code>projects.json</code> 檔案，並覆蓋您目前的資料。
                   請用於載入同事分享的最新備份。
                 </p>
                 
                 <div className="bg-yellow-900/20 border border-yellow-800/50 p-3 rounded mb-6 text-left max-w-md mx-auto flex gap-3">
                   <AlertTriangle className="text-yellow-600 shrink-0" size={18} />
                   <div className="text-xs text-yellow-500/90">
                     <strong>注意：</strong> 您的本地端修改如果尚未備份，將會被覆蓋。請先執行「匯出 JSON」備份後再執行同步。
                   </div>
                 </div>

                 <button 
                   onClick={handleServerSync}
                   disabled={isSyncing}
                   className="px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-teal-900/20 flex items-center gap-2 mx-auto"
                   title="從伺服器下載"
                 >
                   {isSyncing ? '同步中...' : '從伺服器載入資料'}
                 </button>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};