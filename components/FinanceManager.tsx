
import React, { useState, useMemo } from 'react';
import { GeneralTransaction, Project, Cost, AppSettings } from '../types';
import { Plus, Trash2, Wallet, Briefcase, Building2, Edit2, Check, X, Calendar } from 'lucide-react';

interface FinanceManagerProps {
  generalTransactions: GeneralTransaction[];
  projects: Project[];
  onUpdateGeneral: (transactions: GeneralTransaction[]) => void;
  onUpdateProject: (project: Project) => void;
  settings: AppSettings;
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({
  generalTransactions,
  projects,
  onUpdateGeneral,
  onUpdateProject,
  settings
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'general' | 'project'>('all');
  
  // --- Form State ---
  const [entryType, setEntryType] = useState<'general' | 'project'>('general');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const [generalForm, setGeneralForm] = useState<Partial<GeneralTransaction>>({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: 'Misc',
    description: '',
    amount: 0
  });

  const [projectCostForm, setProjectCostForm] = useState<Partial<Cost>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Misc',
    description: '',
    amount: 0
  });

  // --- Inline Edit State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null); // Holds temp data for the row being edited

  // --- Helper: Get Category Name ---
  const getCategoryName = (id: string, type?: 'income' | 'expense') => {
    // Special case handling for legacy "Misc" income
    if (id === 'Misc' && type === 'income') return '其他收入';
    
    const cat = settings.transactionCategories.find(c => c.id === id);
    return cat ? cat.name : id; // Fallback to ID if not found
  };

  // --- Calculations ---
  const stats = useMemo(() => {
    // General Fund Stats
    const income = generalTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = generalTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    // Consolidated Project Costs
    let totalProjectCost = 0;
    projects.forEach(p => {
      p.costs.forEach(c => totalProjectCost += c.amount);
    });

    return { income, expense, balance, totalProjectCost };
  }, [generalTransactions, projects]);

  // --- Handlers ---

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalForm.amount || !generalForm.description) return;

    const newTx: GeneralTransaction = {
      id: crypto.randomUUID(),
      date: generalForm.date!,
      type: generalForm.type as 'income' | 'expense',
      category: generalForm.category as string,
      description: generalForm.description!,
      amount: Number(generalForm.amount),
      note: generalForm.note
    };

    onUpdateGeneral([newTx, ...generalTransactions]);
    setGeneralForm({ ...generalForm, description: '', amount: 0, note: '' });
  };

  const handleProjectCostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('請選擇專案');
      return;
    }
    if (!projectCostForm.amount || !projectCostForm.description) return;

    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return;

    const newCost: Cost = {
      id: crypto.randomUUID(),
      date: projectCostForm.date!,
      category: projectCostForm.category as string,
      description: projectCostForm.description!,
      amount: Number(projectCostForm.amount)
    };

    onUpdateProject({
      ...project,
      costs: [newCost, ...project.costs]
    });

    setProjectCostForm({ ...projectCostForm, description: '', amount: 0 });
  };

  const deleteGeneralTx = (id: string) => {
    if(confirm('確定要刪除此紀錄？')) {
      onUpdateGeneral(generalTransactions.filter(t => t.id !== id));
    }
  };

  const deleteProjectCost = (projectId: string, costId: string) => {
    if(confirm('確定要刪除此專案支出紀錄？')) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        onUpdateProject({
          ...project,
          costs: project.costs.filter(c => c.id !== costId)
        });
      }
    }
  };

  // --- Edit Handlers ---
  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveEdit = () => {
    if (!editData) return;

    if (editData.kind === 'general') {
      // Update General Transaction
      const updatedList = generalTransactions.map(t => 
        t.id === editData.id 
          ? { 
              ...t, 
              date: editData.date, 
              category: editData.category, 
              description: editData.description, 
              amount: Number(editData.amount),
              type: editData.type // Allow changing income/expense type
            } 
          : t
      );
      onUpdateGeneral(updatedList);
    } else {
      // Update Project Cost
      const project = projects.find(p => p.id === editData.project?.id);
      if (project) {
        const updatedCosts = project.costs.map(c => 
          c.id === editData.id
            ? {
                ...c,
                date: editData.date,
                category: editData.category,
                description: editData.description,
                amount: Number(editData.amount)
              }
            : c
        );
        onUpdateProject({ ...project, costs: updatedCosts });
      }
    }
    setEditingId(null);
    setEditData(null);
  };

  // --- Unified List ---
  const unifiedList = useMemo(() => {
    interface UnifiedItem {
      id: string;
      date: string;
      kind: 'general' | 'project';
      type: 'income' | 'expense';
      category: string;
      description: string;
      amount: number;
      project: Project | null;
    }

    const list: UnifiedItem[] = [];
    
    // 1. General Transactions
    if (activeTab === 'all' || activeTab === 'general') {
      generalTransactions.forEach(t => {
        list.push({
          id: t.id,
          date: t.date,
          kind: 'general',
          type: t.type,
          category: t.category,
          description: t.description,
          amount: t.amount,
          project: null
        });
      });
    }

    // 2. Project Costs
    if (activeTab === 'all' || activeTab === 'project') {
      projects.forEach(p => {
        p.costs.forEach(c => {
          list.push({
            id: c.id,
            date: c.date,
            kind: 'project',
            type: 'expense', // Project costs are always expenses
            category: c.category,
            description: c.description,
            amount: c.amount,
            project: p
          });
        });
      });
    }

    // Sort by date desc
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [generalTransactions, projects, activeTab]);

  return (
    <div className="flex h-full bg-zinc-950 text-white overflow-hidden">
      {/* Left Panel: Stats & Form */}
      <div className="w-1/3 min-w-[360px] border-r border-zinc-800 flex flex-col overflow-y-auto print:hidden">
        <div className="p-6 border-b border-zinc-800">
           <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Wallet /> 財務概況</h2>
           <div className="grid grid-cols-2 gap-3 mb-4">
             <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
               <div className="text-xs text-zinc-500 uppercase">公基金結餘</div>
               <div className={`text-xl font-mono font-bold ${stats.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                 ${stats.balance.toLocaleString()}
               </div>
             </div>
              <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
               <div className="text-xs text-zinc-500 uppercase">專案總支出</div>
               <div className="text-xl font-mono font-bold text-red-400">
                 ${stats.totalProjectCost.toLocaleString()}
               </div>
             </div>
           </div>
        </div>

        <div className="p-6 flex-1">
          <div className="mb-4 bg-zinc-900 p-1 rounded-lg flex border border-zinc-800">
            <button 
              onClick={() => setEntryType('general')}
              className={`flex-1 py-2 text-sm font-medium rounded transition-colors ${entryType === 'general' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              公司收支登錄
            </button>
            <button 
              onClick={() => setEntryType('project')}
              className={`flex-1 py-2 text-sm font-medium rounded transition-colors ${entryType === 'project' ? 'bg-teal-600 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              專案支出登錄
            </button>
          </div>

          {entryType === 'general' ? (
            <form onSubmit={handleGeneralSubmit} className="space-y-4 animate-in fade-in">
              <div className="flex gap-2">
                <select 
                  className="w-1/3 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white cursor-pointer"
                  value={generalForm.type}
                  onChange={e => setGeneralForm({...generalForm, type: e.target.value as any})}
                >
                  <option value="expense">支出</option>
                  <option value="income">收入</option>
                </select>
                <div className="flex-1 relative">
                  <input 
                    type="date"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white cursor-pointer"
                    value={generalForm.date}
                    onChange={e => setGeneralForm({...generalForm, date: e.target.value})}
                  />
                  {/* Calendar icon hint, though browser provides one usually */}
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">類別</label>
                <select 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white cursor-pointer"
                  value={generalForm.category}
                  onChange={e => setGeneralForm({...generalForm, category: e.target.value as string})}
                >
                   {settings.transactionCategories
                      .filter(c => c.type === generalForm.type)
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                   ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">說明</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white"
                  placeholder="費用說明..."
                  value={generalForm.description}
                  onChange={e => setGeneralForm({...generalForm, description: e.target.value})}
                />
              </div>

               <div>
                <label className="block text-xs text-zinc-500 mb-1">金額</label>
                <input 
                  type="number"
                  required
                  min="0"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white font-mono"
                  placeholder="0.00"
                  value={generalForm.amount || ''}
                  onChange={e => setGeneralForm({...generalForm, amount: parseFloat(e.target.value)})}
                />
              </div>

              <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium flex items-center justify-center gap-2">
                <Plus size={18} /> 新增公司收支
              </button>
            </form>
          ) : (
            <form onSubmit={handleProjectCostSubmit} className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">選擇專案</label>
                <select 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white cursor-pointer"
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- 選擇專案 --</option>
                  {projects.filter(p => p.status === 'active').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

               <div>
                <label className="block text-xs text-zinc-500 mb-1">日期</label>
                 <input 
                  type="date"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white cursor-pointer"
                  value={projectCostForm.date}
                  onChange={e => setProjectCostForm({...projectCostForm, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">類別</label>
                <select 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white cursor-pointer"
                  value={projectCostForm.category}
                  onChange={e => setProjectCostForm({...projectCostForm, category: e.target.value as string})}
                >
                  {settings.transactionCategories
                      .filter(c => c.type === 'expense') // Projects are always expenses
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                   ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">說明</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white"
                  placeholder="費用說明..."
                  value={projectCostForm.description}
                  onChange={e => setProjectCostForm({...projectCostForm, description: e.target.value})}
                />
              </div>

               <div>
                <label className="block text-xs text-zinc-500 mb-1">金額</label>
                <input 
                  type="number"
                  required
                  min="0"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white font-mono"
                  placeholder="0.00"
                  value={projectCostForm.amount || ''}
                  onChange={e => setProjectCostForm({...projectCostForm, amount: parseFloat(e.target.value)})}
                />
              </div>

              <button className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded font-medium flex items-center justify-center gap-2">
                <Plus size={18} /> 新增專案支出
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right Panel: List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-sm">
          <div>
             <h1 className="text-xl font-bold">收支紀錄總表</h1>
             <p className="text-zinc-400 text-sm">可直接編輯列表修改紀錄</p>
          </div>
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button onClick={() => setActiveTab('all')} className={`px-3 py-1 text-sm rounded ${activeTab === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>全部</button>
            <button onClick={() => setActiveTab('general')} className={`px-3 py-1 text-sm rounded ${activeTab === 'general' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>公基金</button>
            <button onClick={() => setActiveTab('project')} className={`px-3 py-1 text-sm rounded ${activeTab === 'project' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>專案支出</button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
           <table className="w-full text-sm text-left">
             <thead className="bg-zinc-900 text-zinc-500 uppercase text-xs sticky top-0">
               <tr>
                 <th className="px-4 py-3 rounded-l-lg w-32">日期</th>
                 <th className="px-4 py-3 w-28">類型/類別</th>
                 <th className="px-4 py-3">項目/專案</th>
                 <th className="px-4 py-3">說明</th>
                 <th className="px-4 py-3 text-right w-28">金額</th>
                 <th className="px-4 py-3 rounded-r-lg w-24 text-right">操作</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-zinc-800">
               {unifiedList.map((item, idx) => (
                 <tr key={item.id + idx} className="hover:bg-zinc-900/50 group">
                   
                   {/* Date Column */}
                   <td className="px-4 py-3 font-mono text-zinc-400">
                     {editingId === item.id ? (
                       <input 
                         type="date"
                         className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-full"
                         value={editData.date}
                         onChange={(e) => setEditData({...editData, date: e.target.value})}
                       />
                     ) : (
                       item.date
                     )}
                   </td>

                   {/* Type/Category Column */}
                   <td className="px-4 py-3">
                     {editingId === item.id && item.kind === 'general' ? (
                       <select
                         className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-full"
                         value={editData.category}
                         onChange={(e) => setEditData({...editData, category: e.target.value})}
                       >
                           {settings.transactionCategories
                              .filter(c => c.type === editData.type)
                              .map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                           ))}
                       </select>
                     ) : editingId === item.id && item.kind === 'project' ? (
                       <select
                         className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-full"
                         value={editData.category}
                         onChange={(e) => setEditData({...editData, category: e.target.value})}
                       >
                         {settings.transactionCategories
                              .filter(c => c.type === 'expense')
                              .map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                         ))}
                       </select>
                     ) : (
                       // Display Mode
                       item.kind === 'general' ? (
                         <span className={`px-2 py-0.5 rounded text-xs border ${
                           item.type === 'income' 
                             ? 'bg-emerald-900/20 border-emerald-900 text-emerald-400' 
                             : 'bg-indigo-900/20 border-indigo-900 text-indigo-400'
                         }`}>
                           {item.type === 'income' ? '公司收入' : '公司支出'}
                         </span>
                       ) : (
                         <span className="px-2 py-0.5 rounded text-xs bg-teal-900/20 border border-teal-900 text-teal-400">
                           專案支出
                         </span>
                       )
                     )}
                   </td>

                   {/* Project/Category Text Column */}
                   <td className="px-4 py-3 text-zinc-300">
                     {item.kind === 'general' ? (
                       <div className="flex items-center gap-2">
                         <Building2 size={14} className="text-zinc-500"/>
                         {getCategoryName(item.category, item.type)}
                       </div>
                     ) : (
                        <div className="flex items-center gap-2" title={item.project?.name}>
                         <Briefcase size={14} className="text-zinc-500"/>
                         <span className="truncate max-w-[120px]">{item.project?.name}</span>
                         <span className="text-zinc-500 text-xs">
                            ({getCategoryName(item.category, 'expense')})
                         </span>
                       </div>
                     )}
                   </td>

                   {/* Description Column */}
                   <td className="px-4 py-3 text-zinc-400">
                      {editingId === item.id ? (
                       <input 
                         type="text"
                         className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-full"
                         value={editData.description}
                         onChange={(e) => setEditData({...editData, description: e.target.value})}
                       />
                     ) : (
                       item.description
                     )}
                   </td>

                   {/* Amount Column */}
                   <td className={`px-4 py-3 text-right font-mono font-medium ${
                     item.type === 'income' ? 'text-emerald-400' : 'text-zinc-300'
                   }`}>
                      {editingId === item.id ? (
                       <input 
                         type="number"
                         className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-full text-right"
                         value={editData.amount}
                         onChange={(e) => setEditData({...editData, amount: parseFloat(e.target.value)})}
                       />
                     ) : (
                       <>
                         {item.type === 'expense' && '-'}${item.amount.toLocaleString()}
                       </>
                     )}
                   </td>

                   {/* Actions Column */}
                   <td className="px-4 py-3 text-right">
                     {editingId === item.id ? (
                       <div className="flex justify-end gap-2">
                         <button onClick={saveEdit} className="text-teal-400 hover:text-teal-300 p-1 bg-teal-900/30 rounded">
                           <Check size={14} />
                         </button>
                         <button onClick={cancelEdit} className="text-zinc-500 hover:text-zinc-300 p-1 bg-zinc-800 rounded">
                           <X size={14} />
                         </button>
                       </div>
                     ) : (
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => startEdit(item)}
                           className="text-zinc-500 hover:text-teal-400"
                           title="編輯"
                         >
                           <Edit2 size={14} />
                         </button>
                         <button 
                           onClick={() => item.kind === 'general' 
                             ? deleteGeneralTx(item.id) 
                             : item.project && deleteProjectCost(item.project.id, item.id)
                           }
                           className="text-zinc-500 hover:text-red-400"
                           title="刪除"
                         >
                           <Trash2 size={14} />
                         </button>
                       </div>
                     )}
                   </td>
                 </tr>
               ))}
               {unifiedList.length === 0 && (
                 <tr>
                   <td colSpan={6} className="px-4 py-8 text-center text-zinc-600 italic">尚無任何收支紀錄。</td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};
