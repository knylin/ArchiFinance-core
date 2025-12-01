
import React, { useState, useEffect, useRef } from 'react';
import { Project, ViewState, AppSettings, GeneralTransaction } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { FinanceManager } from './components/FinanceManager';
import { loadProjects, saveProjects, createEmptyProject, loadSettings, saveSettings, loadGeneralTransactions, saveGeneralTransactions } from './services/storage';
import { AlertTriangle, ShieldCheck, Upload, FileText, ArrowRight, Download } from 'lucide-react';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setAppSettings] = useState<AppSettings>(loadSettings());
  const [generalTransactions, setGeneralTransactions] = useState<GeneralTransaction[]>([]);
  
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // State for Startup Dialog
  const [showStartupDialog, setShowStartupDialog] = useState(true);
  
  // State for "Unexported Changes" tracking (Dirty Check)
  const [hasUnexportedChanges, setHasUnexportedChanges] = useState(false);
  const hasChangesRef = useRef(false);

  const updateChangesState = (isDirty: boolean) => {
    setHasUnexportedChanges(isDirty);
    hasChangesRef.current = isDirty;
  };

  // Initial Load
  useEffect(() => {
    const loadedProjects = loadProjects();
    const loadedGeneral = loadGeneralTransactions();
    setProjects(loadedProjects);
    setGeneralTransactions(loadedGeneral);
  }, []);

  // Persistence
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveGeneralTransactions(generalTransactions);
  }, [generalTransactions]);

  // Handle Browser Close / Refresh Warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        e.preventDefault();
        e.returnValue = ''; 
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Handler for Settings Save
  const handleSaveSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    saveSettings(newSettings);
    updateChangesState(true);
  };

  // Handler for Server Sync
  const handleServerSync = (serverProjects: Project[]) => {
    setProjects(serverProjects);
    setActiveView('dashboard');
    setSelectedProjectId(null);
    updateChangesState(false);
  };

  // Handlers
  const handleCreateProject = () => {
    const newProject = createEmptyProject();
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
    setActiveView('project-detail');
    updateChangesState(true);
  };

  const handleDuplicateProject = (id: string) => {
    const original = projects.find(p => p.id === id);
    if (!original) return;

    // Deep copy and reset execution data (invoices, costs, dates)
    // We regenerate IDs for internal items to avoid React key collisions
    const newProject: Project = {
      ...JSON.parse(JSON.stringify(original)), // Deep copy basic fields
      id: crypto.randomUUID(),
      name: `${original.name} (副本)`,
      status: 'active',
      createdAt: Date.now(),
      lastModified: Date.now(),
      invoices: [], // Reset execution data
      costs: [],    // Reset execution data
      quote: {
        ...original.quote,
        // Regenerate IDs for Categories and Items
        categories: original.quote.categories.map(cat => ({
          ...cat,
          id: crypto.randomUUID(),
          items: cat.items.map(item => ({...item, id: crypto.randomUUID()}))
        })),
        // Regenerate IDs for Payment Terms
        paymentTerms: original.quote.paymentTerms.map(term => ({
          ...term,
          id: crypto.randomUUID()
        }))
      }
    };

    setProjects(prev => [newProject, ...prev]);
    alert(`已建立專案副本：「${newProject.name}」`);
    updateChangesState(true);
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    updateChangesState(true);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) {
      setActiveView('dashboard');
      setSelectedProjectId(null);
    }
    updateChangesState(true);
  };

  const handleUpdateGeneralTransactions = (txs: GeneralTransaction[]) => {
    setGeneralTransactions(txs);
    updateChangesState(true);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Scenario 1: Full Backup (Object with projects and generalFund)
        if (json.projects && Array.isArray(json.projects)) {
          if (confirm(`偵測到完整備份檔案。\n包含 ${json.projects.length} 個專案與公基金資料。\n\n確定要「覆蓋」目前的資料嗎？`)) {
             setProjects(json.projects);
             if (json.generalFund) setGeneralTransactions(json.generalFund);
             alert('匯入成功！系統資料已還原。');
             updateChangesState(false);
             setShowStartupDialog(false);
          }
        }
        // Scenario 2: Legacy Array (Projects Only)
        else if (Array.isArray(json)) {
          if (confirm(`偵測到舊版備份檔案 (${json.length} 個專案)。\n\n確定要「覆蓋」目前的專案資料嗎？`)) {
             setProjects(json);
             alert('匯入成功！專案資料已還原。');
             updateChangesState(false);
             setShowStartupDialog(false);
          }
        } 
        // Scenario 3: Single Project Object
        else if (json && json.id && json.name) {
          const newProject = json as Project;
          const existingIndex = projects.findIndex(p => p.id === newProject.id);
          
          if (existingIndex >= 0) {
             if (confirm(`專案「${newProject.name}」已存在。\n\n要更新此專案的資料嗎？`)) {
               const newProjects = [...projects];
               newProjects[existingIndex] = newProject;
               setProjects(newProjects);
               alert(`專案「${newProject.name}」已更新。`);
               updateChangesState(true);
               setShowStartupDialog(false);
             }
          } else {
             setProjects(prev => [newProject, ...prev]);
             alert(`已新增專案：「${newProject.name}」`);
             updateChangesState(true);
             setShowStartupDialog(false);
          }
        } else {
          alert('無效的 JSON 格式。');
        }
      } catch (err) {
        console.error(err);
        alert('JSON 解析失敗，檔案可能已損毀。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const saveFile = async (filename: string, content: string) => {
    // Create Blob to ensure content is handled correctly and prevent empty files
    const blob = new Blob([content], { type: 'application/json' });

    // Attempt to use File System Access API (Save As Dialog)
    if ('showSaveFilePicker' in window) {
      try {
        // @ts-ignore
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'JSON Backup File',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        alert('檔案已成功儲存至指定路徑！');
        return; // Success, exit function
      } catch (err: any) {
        // If user actively cancelled, stop here
        if (err.name === 'AbortError') return;
        
        // If it's a security error (e.g. iframe restriction) or other API error, 
        // log it and fall through to the legacy method automatically.
        console.warn('showSaveFilePicker failed (likely due to environment), falling back to download:', err);
      }
    }

    // Fallback: Legacy Download via Anchor tag
    // This runs if showSaveFilePicker is not available OR if it failed (e.g. inside iframe)
    try {
      const url = URL.createObjectURL(blob);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute("download", filename);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Fallback download failed:', err);
      alert('匯出失敗，請重試。');
    }
  };

  const handleExport = async () => {
    // Export both Projects and General Fund
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') + '_' +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0');

    const filename = `ArchiFinance_FullBackup_${timestamp}.json`;
    
    // v1.5.0 Structure
    const exportData = {
      version: '1.5.0',
      exportedAt: now.toISOString(),
      projects: projects,
      generalFund: generalTransactions
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    await saveFile(filename, jsonString);
    updateChangesState(false);
  };

  const handleExportSingleProject = async (project: Project) => {
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');
    
    const safeName = project.name.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
    const filename = `${safeName}_${timestamp}.json`;
    const jsonString = JSON.stringify(project, null, 2);

    await saveFile(filename, jsonString);
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);

  return (
    <Layout 
      activeView={activeView} 
      onNavigate={(view) => {
        setActiveView(view);
        if (view === 'dashboard') setSelectedProjectId(null);
      }}
    >
      {/* Startup Dialog */}
      {showStartupDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm print:hidden">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal-900/30 rounded-full flex items-center justify-center mb-4 mx-auto border border-teal-700/50">
                <ShieldCheck size={32} className="text-teal-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">系統啟動檢查</h2>
              <p className="text-zinc-400">
                偵測到您上次有 {projects.length} 個專案儲存於瀏覽器中。
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-4 p-4 rounded-lg border border-teal-800 bg-teal-900/20 hover:bg-teal-900/30 cursor-pointer transition-colors group">
                <div className="bg-teal-600 p-3 rounded-lg text-white group-hover:bg-teal-500 transition-colors">
                  <Upload size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">匯入備份檔案 (推薦)</h3>
                  <p className="text-zinc-400 text-xs">還原包含專案與公基金的完整備份</p>
                </div>
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>

              <button 
                onClick={() => setShowStartupDialog(false)}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors group text-left"
              >
                <div className="bg-zinc-800 p-3 rounded-lg text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-zinc-300 font-bold group-hover:text-white transition-colors">繼續使用現有資料</h3>
                  <p className="text-zinc-500 text-xs">使用瀏覽器快取中的資料</p>
                </div>
                <ArrowRight size={20} className="text-zinc-600 group-hover:text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === 'dashboard' && (
        <Dashboard
          projects={projects}
          projectTypes={settings.projectTypes}
          onCreateProject={handleCreateProject}
          onSelectProject={(id) => {
            setSelectedProjectId(id);
            setActiveView('project-detail');
          }}
          onDeleteProject={handleDeleteProject}
          onImport={handleImport}
          onExport={handleExport}
          onExportSingle={handleExportSingleProject}
          onDuplicateProject={handleDuplicateProject}
          onUpdateProject={handleUpdateProject}
        />
      )}

      {activeView === 'finance' && (
        <FinanceManager 
          generalTransactions={generalTransactions}
          projects={projects}
          onUpdateGeneral={handleUpdateGeneralTransactions}
          onUpdateProject={handleUpdateProject}
          settings={settings}
        />
      )}

      {!showStartupDialog && hasUnexportedChanges && (
        <div className="fixed bottom-4 right-4 z-40 animate-in slide-in-from-bottom-5 fade-in print:hidden">
          <div className="bg-red-900/90 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-lg border border-red-700/50 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-300"/> 資料尚未備份
              </span>
              <span className="text-xs text-red-200">您有變更尚未匯出至 JSON 檔案</span>
            </div>
            <button 
              onClick={handleExport}
              className="bg-white text-red-900 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <Download size={14} /> 立即備份
            </button>
          </div>
        </div>
      )}

      {activeView === 'reports' && (
        <Reports projects={projects} />
      )}

      {activeView === 'settings' && (
        <Settings 
          settings={settings} 
          onSave={handleSaveSettings} 
          onSyncServer={handleServerSync}
        />
      )}

      {activeView === 'project-detail' && activeProject && (
        <ProjectDetail
          project={activeProject}
          onUpdate={handleUpdateProject}
          onBack={() => {
            setActiveView('dashboard');
            setSelectedProjectId(null);
          }}
          settings={settings}
        />
      )}
    </Layout>
  );
};

export default App;
