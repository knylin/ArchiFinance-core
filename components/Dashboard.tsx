
import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { Plus, Download, Upload, Search, ChevronRight, FileText, Trash2, Archive, RefreshCcw, Tag, Filter, Share } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  projectTypes: string[]; // List of available types for filtering
  onCreateProject: () => void;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onExportSingle: (project: Project) => void; // New prop
  onUpdateProject: (project: Project) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  projectTypes,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
  onImport,
  onExport,
  onExportSingle,
  onUpdateProject
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active');
  const [selectedType, setSelectedType] = useState('all');

  // Calculations
  const calculateFinancials = (p: Project) => {
    // 1. Contract Total
    let contractBase = 0;
    p.quote.categories.forEach(cat => {
      cat.items.forEach(item => contractBase += item.amount);
    });
    
    // Override if custom total is set
    const finalContractAmount = p.quote.customRealTotal ?? contractBase;

    // 2. Revenue (Invoiced)
    const revenue = p.invoices.reduce((sum, inv) => sum + inv.totalService + inv.totalExpense, 0);

    // 3. Costs
    const cost = p.costs.reduce((sum, c) => sum + c.amount, 0);

    // 4. Progress
    const progress = finalContractAmount > 0 ? (revenue / finalContractAmount) * 100 : 0;

    return {
      contract: finalContractAmount,
      revenue,
      cost,
      profit: revenue - cost,
      progress: Math.min(progress, 100)
    };
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Tab Filter
      const isArchived = p.status === 'archived';
      if (viewTab === 'active' && isArchived) return false;
      if (viewTab === 'archived' && !isArchived) return false;

      // Project Type Filter (Multi-select support: checks if array includes selected type)
      if (selectedType !== 'all') {
        const types = p.projectTypes || [];
        if (!types.includes(selectedType)) return false;
      }

      // Search Filter
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.client.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [projects, searchTerm, viewTab, selectedType]);

  const toggleArchive = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const newStatus = project.status === 'archived' ? 'active' : 'archived';
    onUpdateProject({ ...project, status: newStatus });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* Header */}
      <header className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">專案列表</h1>
          <p className="text-zinc-400 text-sm mt-1">管理您的建築專案投資與收益</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors" title="匯入 JSON (Download Icon)">
            <Download size={18} />
            <input type="file" className="hidden" accept=".json" onChange={onImport} />
          </label>
          <button onClick={onExport} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors" title="備份全部專案 (Upload Icon)">
            <Upload size={18} />
          </button>
          <button 
            onClick={onCreateProject}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-teal-900/20"
          >
            <Plus size={18} />
            <span>新增專案</span>
          </button>
        </div>
      </header>

      {/* Main Table Area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Tabs & Search Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewTab('active')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewTab === 'active' 
                  ? 'bg-zinc-800 text-teal-400 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              進行中專案
            </button>
            <button
              onClick={() => setViewTab('archived')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewTab === 'archived' 
                  ? 'bg-zinc-800 text-zinc-200 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              已封存專案
            </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                 <Filter size={16} />
               </div>
               <select 
                 className="h-full pl-9 pr-8 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-teal-600/50 appearance-none"
                 value={selectedType}
                 onChange={(e) => setSelectedType(e.target.value)}
               >
                 <option value="all">所有類型</option>
                 {projectTypes.map(type => (
                   <option key={type} value={type}>{type}</option>
                 ))}
               </select>
            </div>

            <div className="relative flex-1 md:w-auto md:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text" 
                placeholder="搜尋專案名稱或業主..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-600/50"
              />
            </div>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
            {viewTab === 'active' ? (
              <>
                <FileText size={48} className="mx-auto text-zinc-700 mb-4" />
                <h3 className="text-zinc-400 font-medium">沒有符合條件的專案</h3>
                <p className="text-zinc-600 text-sm mt-1">嘗試更換篩選條件或新增專案</p>
              </>
            ) : (
              <>
                <Archive size={48} className="mx-auto text-zinc-700 mb-4" />
                <h3 className="text-zinc-400 font-medium">沒有封存的專案</h3>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProjects.map(project => {
              const fin = calculateFinancials(project);
              // Smart Status Logic:
              // 1. If manually archived -> '已封存' (Handled by Tab view usually, but good for label)
              // 2. If progress >= 100 -> '已完成' (Auto)
              // 3. If manually completed -> '已結案' (Manual)
              // 4. Else -> '進行中'
              
              let statusLabel = '進行中';
              let statusColor = 'border-teal-900 bg-teal-900/30 text-teal-400';

              if (project.status === 'archived') {
                statusLabel = '已封存';
                statusColor = 'border-zinc-700 bg-zinc-800 text-zinc-500';
              } else if (fin.progress >= 99.9 || project.status === 'completed') {
                statusLabel = project.status === 'completed' ? '已結案 (手動)' : '已完成';
                statusColor = 'border-blue-900 bg-blue-900/30 text-blue-400';
              }

              // Handle backward compatibility for display
              const types = project.projectTypes || (project.projectType ? [project.projectType] : []);

              return (
                <div 
                  key={project.id} 
                  className={`group bg-zinc-900 border hover:border-zinc-700 rounded-xl p-5 transition-all cursor-pointer relative overflow-hidden ${
                    project.status === 'archived' ? 'border-zinc-800 opacity-75' : 'border-zinc-800'
                  }`}
                  onClick={() => onSelectProject(project.id)}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full transition-opacity ${
                    statusLabel.includes('完成') || statusLabel.includes('結案') ? 'bg-blue-600' : 'bg-teal-600'
                  } ${project.status === 'archived' ? 'bg-zinc-600' : ''} opacity-0 group-hover:opacity-100`} />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-teal-400 transition-colors">{project.name}</h3>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="text-zinc-400 text-sm flex items-center gap-4 flex-wrap">
                        <span>{project.client}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                        <span>{project.location}</span>
                        
                        {types.length > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                            <div className="flex gap-1 flex-wrap">
                              {types.map(t => (
                                <span key={t} className="flex items-center gap-1 text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">
                                  <Tag size={12} /> {t}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary Cards (Mini) */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="px-4 py-2 bg-zinc-950 rounded-lg border border-zinc-800 min-w-[120px]">
                        <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">合約總額</div>
                        <div className="font-mono text-zinc-200">${fin.contract.toLocaleString()}</div>
                      </div>
                      <div className="px-4 py-2 bg-zinc-950 rounded-lg border border-zinc-800 min-w-[120px]">
                        <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">已請款</div>
                        <div className="font-mono text-teal-400">${fin.revenue.toLocaleString()}</div>
                      </div>
                      <div className="px-4 py-2 bg-zinc-950 rounded-lg border border-zinc-800 min-w-[120px]">
                        <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">損益</div>
                        <div className={`font-mono ${fin.profit >= 0 ? 'text-zinc-200' : 'text-red-400'}`}>
                          ${fin.profit.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2 pl-4 border-l border-zinc-800/50">
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportSingle(project);
                        }}
                        className="p-2 text-zinc-600 hover:text-teal-400 hover:bg-zinc-800 rounded-full transition-colors"
                        title="匯出單一專案 JSON"
                      >
                        <Share size={18} />
                      </button>
                       <button 
                        onClick={(e) => toggleArchive(e, project)}
                        className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                        title={project.status === 'archived' ? '還原專案' : '封存專案'}
                      >
                        {project.status === 'archived' ? <RefreshCcw size={18} /> : <Archive size={18} />}
                      </button>
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if(confirm('確定要刪除此專案嗎？此動作無法復原。')) onDeleteProject(project.id);
                        }}
                        className="p-2 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-full transition-colors"
                        title="刪除專案"
                      >
                        <Trash2 size={18} />
                      </button>
                      <ChevronRight className="text-zinc-600 group-hover:text-zinc-300 transition-colors ml-2" />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${
                        project.status === 'archived' ? 'bg-zinc-600' :
                        (fin.progress >= 100 || project.status === 'completed') ? 'bg-blue-500' : 'bg-teal-600/80'
                      }`}
                      style={{ width: `${fin.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
