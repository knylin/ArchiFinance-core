import React, { useState } from 'react';
import { Project, ProjectTab, TaxMode, AppSettings } from '../types';
import { QuoteEditor } from './QuoteEditor';
import { InvoiceEditor } from './InvoiceEditor';
import { CostTracker } from './CostTracker';
import { ArrowLeft, Edit2, MapPin, User, Save, Tag } from 'lucide-react';

interface ProjectDetailProps {
  project: Project;
  onUpdate: (updatedProject: Project) => void;
  onBack: () => void;
  settings: AppSettings;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onUpdate, onBack, settings }) => {
  const [activeTab, setActiveTab] = useState<ProjectTab>('quote');
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editForm, setEditForm] = useState({
    name: project.name,
    client: project.client,
    location: project.location,
    taxMode: project.taxMode,
    status: project.status,
    projectType: project.projectType || settings.projectTypes[0]
  });

  const saveHeader = () => {
    onUpdate({
      ...project,
      ...editForm,
      lastModified: Date.now()
    });
    setIsEditingHeader(false);
  };

  const TabButton = ({ id, label }: { id: ProjectTab; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        activeTab === id
          ? 'border-teal-500 text-teal-400 bg-zinc-900/50'
          : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-zinc-950 print:bg-white print:h-auto print:block">
      {/* Header - Hidden on Print */}
      <div className="bg-zinc-900 border-b border-zinc-800 shrink-0 print:hidden">
        <div className="px-6 py-4">
          <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> 返回儀表板
          </button>
          
          {isEditingHeader ? (
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs text-zinc-500 mb-1">專案名稱</label>
                <input 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} 
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-zinc-500 mb-1">業主</label>
                <input 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
                  value={editForm.client} 
                  onChange={e => setEditForm({...editForm, client: e.target.value})} 
                />
              </div>
               <div className="col-span-1">
                <label className="block text-xs text-zinc-500 mb-1">地點</label>
                <input 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
                  value={editForm.location} 
                  onChange={e => setEditForm({...editForm, location: e.target.value})} 
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-zinc-500 mb-1">案件類型</label>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
                  value={editForm.projectType}
                  onChange={e => setEditForm({...editForm, projectType: e.target.value})}
                >
                  {settings.projectTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-zinc-500 mb-1">稅制模式</label>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
                  value={editForm.taxMode}
                  onChange={e => setEditForm({...editForm, taxMode: e.target.value as TaxMode})}
                >
                  <option value="none">不計稅 (未稅)</option>
                  <option value="vat5">營業稅 5% (內含)</option>
                  <option value="wht10">代扣稅 10% (內扣)</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-zinc-500 mb-1">專案狀態</label>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
                  value={editForm.status}
                  onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                >
                  <option value="active">進行中</option>
                  <option value="completed">已結案 (手動/終止)</option>
                  <option value="archived">封存</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-2 flex justify-end gap-2 mt-auto">
                 <button onClick={() => setIsEditingHeader(false)} className="px-3 py-1 text-sm text-zinc-400 hover:text-white">取消</button>
                 <button onClick={saveHeader} className="px-4 py-1 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded flex items-center gap-2">
                   <Save size={14} /> 儲存
                 </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  {project.name}
                  <button onClick={() => setIsEditingHeader(true)} className="text-zinc-600 hover:text-teal-400 transition-colors">
                    <Edit2 size={16} />
                  </button>
                </h1>
                <div className="flex items-center gap-6 mt-2 text-sm text-zinc-400">
                  <span className="flex items-center gap-2"><User size={14} /> {project.client}</span>
                  <span className="flex items-center gap-2"><MapPin size={14} /> {project.location}</span>
                  <span className="flex items-center gap-2 text-zinc-500"><Tag size={14} /> {project.projectType || '未分類'}</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs uppercase tracking-wide">
                    {project.taxMode === 'vat5' ? '營業稅 5% (內含)' : project.taxMode === 'wht10' ? '扣繳 10%' : '不計稅'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wide border ${
                    project.status === 'archived' 
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-500' 
                      : project.status === 'completed' 
                        ? 'bg-blue-900/30 border-blue-900 text-blue-400'
                        : 'bg-teal-900/30 border-teal-900 text-teal-400'
                  }`}>
                    {project.status === 'archived' ? '已封存' : project.status === 'completed' ? '已結案' : '進行中'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 flex gap-1 mt-2">
          <TabButton id="quote" label="報價與合約" />
          <TabButton id="invoice" label="請款管理" />
          <TabButton id="costs" label="成本與損益" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-zinc-950 print:bg-white print:overflow-visible print:h-auto print:block">
        {activeTab === 'quote' && (
          <QuoteEditor 
            project={project} 
            onUpdate={onUpdate} 
            settings={settings}
          />
        )}
        {activeTab === 'invoice' && (
          <InvoiceEditor 
            project={project}
            onUpdate={onUpdate}
            settings={settings}
          />
        )}
        {activeTab === 'costs' && (
          <CostTracker 
            project={project}
            onUpdate={onUpdate}
          />
        )}
      </div>
    </div>
  );
};