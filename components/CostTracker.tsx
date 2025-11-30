import React, { useState } from 'react';
import { Project, Cost } from '../types';
import { Plus, Trash2, DollarSign } from 'lucide-react';

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
    onUpdate({
      ...project,
      costs: project.costs.filter(c => c.id !== id)
    });
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300"
                  value={newCost.date}
                  onChange={e => setNewCost({...newCost, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">類別</label>
                <select 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300"
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
                <th className="px-6 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {project.costs.map(cost => (
                <tr key={cost.id} className="hover:bg-zinc-800/30">
                  <td className="px-6 py-3 text-zinc-400 font-mono text-xs">{cost.date}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-400">
                      {cost.category === 'Subcontractor' ? '複委託' : 
                       cost.category === 'GovFee' ? '規費' :
                       cost.category === 'Printing' ? '印製' :
                       cost.category === 'Travel' ? '差旅' : '雜支'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-zinc-300">{cost.description}</td>
                  <td className="px-6 py-3 text-right font-mono text-zinc-300">${cost.amount.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => removeCost(cost.id)} className="text-zinc-600 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
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