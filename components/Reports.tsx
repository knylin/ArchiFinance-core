
import React, { useMemo } from 'react';
import { Project } from '../types';
import { DollarSign, TrendingUp, Building2, Briefcase } from 'lucide-react';
import { loadGeneralTransactions } from '../services/storage';

interface ReportsProps {
  projects: Project[];
}

export const Reports: React.FC<ReportsProps> = ({ projects }) => {
  // Load general fund data
  const generalTransactions = loadGeneralTransactions();

  // --- Data Calculations ---

  const summary = useMemo(() => {
    let totalContract = 0;
    let totalRevenue = 0; // Invoiced
    let totalProjectCost = 0;
    
    // Project Stats
    const monthlyRevenue: Record<string, number> = {};
    const costDistribution: Record<string, number> = {
      'Subcontractor': 0,
      'GovFee': 0,
      'Printing': 0,
      'Travel': 0,
      'Misc': 0
    };

    projects.forEach(p => {
      // Contract
      const base = p.quote.categories.reduce((sum, c) => sum + c.items.reduce((s, i) => s + (Number(i.amount)||0), 0), 0);
      totalContract += (p.quote.customRealTotal ?? base);

      // Revenue (Invoices)
      p.invoices.forEach(inv => {
        const amount = Number(inv.totalService) + Number(inv.totalExpense);
        totalRevenue += amount;
        
        // Monthly breakdown
        const monthKey = inv.date.substring(0, 7); // YYYY-MM
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + amount;
      });

      // Costs
      p.costs.forEach(c => {
        const amount = Number(c.amount);
        totalProjectCost += amount;
        if (costDistribution[c.category] !== undefined) {
          costDistribution[c.category] += amount;
        }
      });
    });

    // General Fund Stats (Overhead)
    const totalOverhead = generalTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const otherIncome = generalTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Profit Calculations
    const grossProfit = totalRevenue - totalProjectCost; // Project specific profit
    const netProfit = grossProfit - totalOverhead + otherIncome; // Company bottom line

    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Sort months
    const sortedMonths = Object.keys(monthlyRevenue).sort().slice(-12); // Last 12 months active
    const chartData = sortedMonths.map(m => ({ month: m, amount: monthlyRevenue[m] || 0 }));

    return {
      totalContract,
      totalRevenue,
      totalProjectCost,
      totalOverhead,
      otherIncome,
      grossProfit,
      netProfit,
      profitMargin,
      chartData,
      costDistribution
    };
  }, [projects, generalTransactions]);

  const maxChartValue = Math.max(...summary.chartData.map(d => d.amount), 1);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white overflow-hidden">
      <header className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold tracking-tight">財務報表</h1>
        <p className="text-zinc-400 text-sm mt-1">事務所營運績效總覽 (含專案與公司管銷)</p>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top Level KPI Cards (Company Wide) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
               <div className="absolute right-4 top-4 p-2 bg-zinc-800 rounded-lg text-teal-500">
                 <DollarSign size={20} />
               </div>
               <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">總實收營收</div>
               <div className="text-2xl font-mono text-teal-400 font-bold">${summary.totalRevenue.toLocaleString()}</div>
               <div className="text-[10px] text-zinc-600 mt-1">來自專案請款</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
               <div className="absolute right-4 top-4 p-2 bg-zinc-800 rounded-lg text-zinc-500">
                 <Briefcase size={20} />
               </div>
               <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">專案總毛利</div>
               <div className="text-2xl font-mono text-white font-bold">${summary.grossProfit.toLocaleString()}</div>
               <div className="text-[10px] text-zinc-600 mt-1">營收 - 專案直接成本</div>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
               <div className="absolute right-4 top-4 p-2 bg-zinc-800 rounded-lg text-orange-500">
                 <Building2 size={20} />
               </div>
               <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">公司管銷費用</div>
               <div className="text-2xl font-mono text-orange-400 font-bold">${summary.totalOverhead.toLocaleString()}</div>
               <div className="text-[10px] text-zinc-600 mt-1">租金、薪資、軟體等</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
               <div className="absolute right-4 top-4 p-2 bg-zinc-800 rounded-lg text-indigo-500">
                 <TrendingUp size={20} />
               </div>
               <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">稅後淨利 (Net Profit)</div>
               <div className={`text-2xl font-mono font-bold ${summary.netProfit >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                 ${summary.netProfit.toLocaleString()}
               </div>
               <div className="text-xs text-zinc-500 mt-1 font-mono">Margin: {summary.profitMargin.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Monthly Revenue Chart */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-6">月度營收趨勢 (近12個月)</h3>
              {summary.chartData.length > 0 ? (
                <div className="h-64 flex items-end gap-2 md:gap-4">
                  {summary.chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                      <div 
                        className="w-full bg-teal-600/20 border border-teal-600/50 rounded-t hover:bg-teal-600/40 transition-all relative"
                        style={{ height: `${(d.amount / maxChartValue) * 100}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono whitespace-nowrap z-10">
                          ${d.amount.toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-zinc-500 font-mono rotate-45 md:rotate-0 origin-left translate-y-2 md:translate-y-0">
                        {d.month}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-600">
                  尚無營收資料
                </div>
              )}
            </div>

            {/* Income Statement Summary */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
               <h3 className="text-lg font-semibold mb-6">簡易損益表</h3>
               <div className="space-y-3 font-mono text-sm">
                 <div className="flex justify-between border-b border-zinc-800 pb-2">
                   <span className="text-zinc-400">營業收入 (Revenue)</span>
                   <span className="text-white">${summary.totalRevenue.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between border-b border-zinc-800 pb-2">
                   <span className="text-zinc-500">- 專案成本 (COGS)</span>
                   <span className="text-red-400">(${summary.totalProjectCost.toLocaleString()})</span>
                 </div>
                 <div className="flex justify-between border-b border-zinc-700 pb-2">
                   <span className="text-zinc-300 font-bold">營業毛利 (Gross Profit)</span>
                   <span className="text-white font-bold">${summary.grossProfit.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between border-b border-zinc-800 pb-2">
                   <span className="text-zinc-500">- 營業費用 (Operating Exp)</span>
                   <span className="text-orange-400">(${summary.totalOverhead.toLocaleString()})</span>
                 </div>
                 <div className="flex justify-between border-b border-zinc-800 pb-2">
                   <span className="text-zinc-500">+ 營業外收入 (Other Income)</span>
                   <span className="text-emerald-400">${summary.otherIncome.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between pt-2">
                   <span className="text-indigo-400 font-bold text-base">本期淨利 (Net Income)</span>
                   <span className="text-indigo-400 font-bold text-base">${summary.netProfit.toLocaleString()}</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Project Cost Breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
             <h3 className="text-lg font-semibold mb-6">專案直接成本結構分析</h3>
             <div className="space-y-4">
               {Object.entries(summary.costDistribution).map(([cat, amount]) => {
                 const percentage = summary.totalProjectCost > 0 ? (Number(amount) / summary.totalProjectCost) * 100 : 0;
                 const label = cat === 'Subcontractor' ? '複委託/外包' : 
                               cat === 'GovFee' ? '規費' :
                               cat === 'Printing' ? '圖說印製' :
                               cat === 'Travel' ? '差旅費' : '雜支';
                 return (
                   <div key={cat}>
                     <div className="flex justify-between text-sm mb-1">
                       <span className="text-zinc-400">{label}</span>
                       <span className="font-mono text-zinc-200">${Number(amount).toLocaleString()} ({percentage.toFixed(1)}%)</span>
                     </div>
                     <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-zinc-700" 
                         style={{ width: `${percentage}%` }}
                       />
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
