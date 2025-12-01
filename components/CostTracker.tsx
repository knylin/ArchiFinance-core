
import React, { useState } from 'react';
import { Project, Cost } from '../types';
import { Plus, Trash2, DollarSign, Edit2, Check, X } from 'lucide-react';

interface CostTrackerProps {
  project: Project;
  onUpdate: (p: Project) => void;
}

export const CostTracker: React.FC<CostTrackerProps> = ({ project, onUpdate }) => {
  const [newCost, setNewCost] = useState<Partial<Cost>>({
    category: 'Misc',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: ''
  });

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Cost | null>(null);

  const addCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCost.amount || !newCost.description) return;
    
    const cost: Cost = {
      id: crypto.randomUUID(),
      date: newCost.date!,
      category: newCost.category as any,
      description: newCost.description!,
      amount: Number(newCost.amount)
    };

    onUpdate({
      ...project,
      costs: [cost, ...project.costs] // Newest first
    });

    setNewCost({ ...newCost, amount: 0, description: '' });
  };

  const removeCost = (id: string) => {
    if(confirm('確定要刪除此紀錄？')) {
      onUpdate({
        ...project,
        costs: project.costs.filter(c => c.id !== id)
      });
    }
  };

  // Edit Handlers
  const startEdit = (cost: Cost) => {
    setEditingId(cost.id);
    setEditData({ ...cost });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveEdit = () => {
    if (!editData) return;
    
    const updatedCosts = project.costs.map(c => 
      c.id === editData.id ? editData : c
    );

    onUpdate({
      ...project,
      costs: updatedCosts
    });

    setEditingId(null);
    setEditData(null);
  };


  const totalCost = project.costs.reduce((sum, c) => sum + c.amount, 0);
  // Calculate approximate revenue (simple sum of invoices for now)
  const totalRevenue = project.invoices.reduce((sum, i) => sum + i.totalService + i.totalExpense, 0);
  const profit = totalRevenue - totalCost;

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
           <div className="text-zinc-500 text-sm uppercase tracking-wider mb-2">總成本</div>
           <div className="text-3xl font-mono text-red-400">${totalCost.toLocaleString()}</div>
        </div>
         <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
           <div className="text-zinc-500 text-sm uppercase tracking-wider mb-2">已請款收入</div>
           <div className="text-3xl font-mono text-teal-400">${totalRevenue.toLocaleString()}</div>
        </div>
         <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
           <div className={`absolute top-0 right-0 p-2 opacity-10 ${profit >= 0 ? 'text-teal-500' : 'text-red-500'}`}>
             <DollarSign size={100} />
           </div>
           <div className="text-zinc-500 text-sm uppercase tracking-wider mb-2">專案淨利</div>
           <div className={`text-3xl font-mono font-bold ${profit >= 0 ? 'text-white' : 'text-red-500'}`}>
             ${profit.toLocaleString()}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <form onSubmit={addCost} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Plus size={18} /> 登錄支出</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">日期</label>
                <input 
                  type="date" 
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 cursor-pointer"
                  value={newCost.date}
                  onChange={e => setNewCost({...newCost, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">類別</label>
                <select 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 cursor-pointer"
                  value={newCost.category}
                  onChange={e => setNewCost({...newCost, category: e.target.value as any})}
                >
                  <option value="Subcontractor">複委託/外包</option>
                  <option value="GovFee">規費</option>
                  <option value="Printing">圖說印製</option>
                  <option value="Travel">差旅費</option>
                  <option value="Misc">雜支</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">說明</label>
                <input 
                  type="text" 
                  required
                  placeholder="例如：結構技師第一期款"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300"
                  value={newCost.description}
                  onChange={e => setNewCost({...newCost, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">金額</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  placeholder="0.00"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 font-mono"
                  value={newCost.amount || ''}
                  onChange={e => setNewCost({...newCost, amount: parseFloat(e.target.value)})}
                />
              </div>
              <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-medium transition-colors">
                新增紀錄
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-950 text-zinc-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">日期</th>
                <th className="px-6 py-3">類別</th>
                <th className="px-6 py-3">說明</th>
                <th className="px-6 py-3 text-right">金額</th>
                <th className="px-6 py-3 w-20 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {project.costs.map(cost => (
                <tr key={cost.id} className="hover:bg-zinc-800/30 group">
                  <td className="px-6 py-3 text-zinc-400 font-mono text-xs w-32">
                     {editingId === cost.id && editData ? (
                       <input 
                         type="date"
                         className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-full"
                         value={editData.date}
                         onChange={(e) => setEditData({...editData, date: e.target.value})}
                       />
                     ) : cost.date}
                  </td>
                  <td className="px-6 py-3 w-32">
                    {editingId === cost.id && editData ? (
                       <select 
                         className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-full"
                         value={editData.category}
                         onChange={(e) => setEditData({...editData, category: e.target.value as any})}
                       >
                         <option value="Subcontractor">複委託</option>
                         <option value="GovFee">規費</option>
                         <option value="Printing">印製</option>
                         <option value="Travel">差旅</option>
                         <option value="Misc">雜支</option>
                       </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-400">
                        {cost.category === 'Subcontractor' ? '複委託' : 
                         cost.category === 'GovFee' ? '規費' :
                         cost.category === 'Printing' ? '印製' :
                         cost.category === 'Travel' ? '差旅' : '雜支'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-zinc-300">
                     {editingId === cost.id && editData ? (
                       <input 
                         className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-full"
                         value={editData.description}
                         onChange={(e) => setEditData({...editData, description: e.target.value})}
                       />
                     ) : cost.description}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-zinc-300 w-32">
                     {editingId === cost.id && editData ? (
                       <input 
                         type="number"
                         className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-full text-right"
                         value={editData.amount}
                         onChange={(e) => setEditData({...editData, amount: parseFloat(e.target.value)})}
                       />
                     ) : `$${cost.amount.toLocaleString()}`}
                  </td>
                  <td className="px-6 py-3 text-right">
                     {editingId === cost.id ? (
                       <div className="flex justify-end gap-2">
                         <button onClick={saveEdit} className="text-teal-400 hover:text-teal-300 p-1 bg-teal-900/30 rounded"><Check size={14}/></button>
                         <button onClick={cancelEdit} className="text-zinc-500 hover:text-zinc-300 p-1 bg-zinc-800 rounded"><X size={14}/></button>
                       </div>
                     ) : (
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => startEdit(cost)} className="text-zinc-500 hover:text-teal-400"><Edit2 size={14} /></button>
                         <button onClick={() => removeCost(cost.id)} className="text-zinc-600 hover:text-red-400"><Trash2 size={14} /></button>
                       </div>
                     )}
                  </td>
                </tr>
              ))}
              {project.costs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-600 italic">尚無支出紀錄。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
