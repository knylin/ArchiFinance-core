
import React, { useState, useEffect, useRef } from 'react';
import { Project, ViewState, AppSettings } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { loadProjects, saveProjects, createEmptyProject, loadSettings, saveSettings } from './services/storage';
import { AlertTriangle, ShieldCheck, Upload, FileText, ArrowRight, Download } from 'lucide-react';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setAppSettings] = useState<AppSettings>(loadSettings());
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // State for Startup Dialog
  const [showStartupDialog, setShowStartupDialog] = useState(true);
  
  // State for "Unexported Changes" tracking (Dirty Check)
  // We use a Ref for the event listener to always get the latest value, 
  // and State to trigger re-renders if needed for UI indicators.
  const [hasUnexportedChanges, setHasUnexportedChanges] = useState(false);
  const hasChangesRef = useRef(false);

  const updateChangesState = (isDirty: boolean) => {
    setHasUnexportedChanges(isDirty);
    hasChangesRef.current = isDirty;
  };

  // Initial Load
  useEffect(() => {
    const loaded = loadProjects();
    setProjects(loaded);
  }, []);

  // Persistence for Projects & Dirty Check Logic
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  // Handle Browser Close / Refresh Warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Feature 3: Force/Remind export on close if changes exist
      if (hasChangesRef.current) {
        e.preventDefault();
        // Chrome requires returnValue to be set
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
    // Settings change counts as a change that needs backup
    updateChangesState(true);
  };

  // Handler for Server Sync
  const handleServerSync = (serverProjects: Project[]) => {
    setProjects(serverProjects);
    setActiveView('dashboard');
    setSelectedProjectId(null);
    updateChangesState(false); // Synced with server, considered "saved"
  };

  // Handlers
  const handleCreateProject = () => {
    const newProject = createEmptyProject();
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
    setActiveView('project-detail');
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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Scenario 1: Array (Full Backup)
        if (Array.isArray(json)) {
          if (confirm(`偵測到完整備份檔案 (${json.length} 個專案)。\n\n確定要「覆蓋」目前的資料嗎？\n此動作將會清除目前的專案列表。`)) {
             setProjects(json);
             alert('匯入成功！系統資料已還原。');
             updateChangesState(false);
             setShowStartupDialog(false);
          }
        } 
        // Scenario 2: Object (Single Project)
        else if (json && json.id && json.name) {
          const newProject = json as Project;
          
          // Check if project exists
          const existingIndex = projects.findIndex(p => p.id === newProject.id);
          
          if (existingIndex >= 0) {
             if (confirm(`專案「${newProject.name}」已存在。\n\n要更新此專案的資料嗎？\n其他專案將不會受到影響。`)) {
               const newProjects = [...projects];
               newProjects[existingIndex] = newProject;
               setProjects(newProjects);
               alert(`專案「${newProject.name}」已更新。`);
               updateChangesState(true); // Marked as dirty because we modified the list locally
               setShowStartupDialog(false);
             }
          } else {
             // Add as new
             setProjects(prev => [newProject, ...prev]);
             alert(`已新增專案：「${newProject.name}」`);
             updateChangesState(true);
             setShowStartupDialog(false);
          }
        } else {
          alert('無效的 JSON 格式。請確認檔案是 ArchiFinance 的備份檔。');
        }
      } catch (err) {
        console.error(err);
        alert('JSON 解析失敗，檔案可能已損毀。');
      }
    };
    reader.readAsText(file);
    // Reset input value to allow re-importing same file if needed
    e.target.value = '';
  };

  const saveFile = async (filename: string, content: string) => {
     try {
      // Check for File System Access API support (Chrome, Edge, Opera)
      if ('showSaveFilePicker' in window) {
        // @ts-ignore - TypeScript might not know about this API yet
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'JSON Backup File',
            accept: { 'application/json': ['.json'] },
          }],
        });
        
        // Create a writable stream to the file
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        
        alert('檔案已成功儲存至指定路徑！');
      } else {
        // Fallback for browsers not supporting the API (Firefox, Safari)
        throw new Error('Not supported');
      }
    } catch (err: any) {
      // If user cancelled the picker, do nothing
      if (err.name === 'AbortError') return;

      // Use traditional download method as fallback
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(content);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", filename);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };

  const handleExport = async () => {
    // Feature 1: Auto-numbered filename based on date/time
    const now = new Date();
    // Format: YYYYMMDD_HHmmss
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') + '_' +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    const filename = `ArchiFinance_FullBackup_${timestamp}.json`;
    const jsonString = JSON.stringify(projects, null, 2);

    await saveFile(filename, jsonString);
    updateChangesState(false); // Reset dirty state after export
  };

  const handleExportSingleProject = async (project: Project) => {
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');
    
    // Sanitize filename
    const safeName = project.name.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
    const filename = `${safeName}_${timestamp}.json`;
    const jsonString = JSON.stringify(project, null, 2);

    await saveFile(filename, jsonString);
    // Note: Exporting a single project does NOT clear the dirty state for the whole app
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
      {/* Feature 2: Startup Force/Prompt Dialog */}
      {showStartupDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm print:hidden">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal-900/30 rounded-full flex items-center justify-center mb-4 mx-auto border border-teal-700/50">
                <ShieldCheck size={32} className="text-teal-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">系統啟動檢查</h2>
              <p className="text-zinc-400">
                為了確保資料一致性，請選擇您的資料來源。<br/>
                系統偵測到您上次有 {projects.length} 個專案儲存於瀏覽器中。
              </p>
            </div>

            <div className="space-y-4">
              {/* Option A: Import Backup (Primary Action) */}
              <label className="flex items-center gap-4 p-4 rounded-lg border border-teal-800 bg-teal-900/20 hover:bg-teal-900/30 cursor-pointer transition-colors group">
                <div className="bg-teal-600 p-3 rounded-lg text-white group-hover:bg-teal-500 transition-colors">
                  <Upload size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">匯入備份檔案 (推薦)</h3>
                  <p className="text-zinc-400 text-xs">選擇上次匯出的 JSON 檔案以還原進度</p>
                </div>
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>

              {/* Option B: Continue Local (Secondary Action) */}
              <button 
                onClick={() => setShowStartupDialog(false)}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors group text-left"
              >
                <div className="bg-zinc-800 p-3 rounded-lg text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-zinc-300 font-bold group-hover:text-white transition-colors">繼續使用現有資料</h3>
                  <p className="text-zinc-500 text-xs">使用瀏覽器快取中的資料 (上次修改時間)</p>
                </div>
                <ArrowRight size={20} className="text-zinc-600 group-hover:text-zinc-400" />
              </button>

              <div className="mt-6 pt-6 border-t border-zinc-800 flex items-start gap-2 text-yellow-600/80 text-xs">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p>提醒：本系統為離線單機版，若更換電腦或清除瀏覽器快取，請務必先執行匯出備份。</p>
              </div>
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
          onUpdateProject={handleUpdateProject}
        />
      )}

      {/* Warning Banner for Unsaved Changes */}
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
