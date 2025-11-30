import React, { useMemo } from 'react';
import { Project } from '../types';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface ReportsProps {
  projects: Project[];
}

export const Reports: React.FC<ReportsProps> = ({ projects }) => {
  // --- Data Calculations ---

  const summary = useMemo(() => {
    let totalContract = 0;
    let totalRevenue = 0;
    let totalCost = 0;
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
      const base = p.quote.categories.reduce((sum, c) => sum + c.items.reduce((s, i) => s + (i.amount||0), 0), 0);
      totalContract += (p.quote.customRealTotal ?? base);

      // Revenue (Invoices)
      p.invoices.forEach(inv => {
        const amount = inv.totalService + inv.totalExpense;
        totalRevenue += amount;
        
        // Monthly breakdown
        const monthKey = inv.date.substring(0, 7); // YYYY-MM
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + amount;
      });

      // Costs
      p.costs.forEach(c => {
        totalCost += c.amount;
        if (costDistribution[c.category] !== undefined) {
          costDistribution[c.category] += c.amount;
        }
      });
    });

    // Sort months
    const sortedMonths = Object.keys(monthlyRevenue).sort().slice(-12); // Last 12 months active
    const chartData = sortedMonths.map(m => ({ month: m, amount: monthlyRevenue[m] }));

    return {
      totalContract,
      totalRevenue,
      totalCost,
      netProfit: totalRevenue - totalCost,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
      chartData,
      costDistribution
    };
  }, [projects]);

  const maxChartValue = Math.max(...summary.chartData.map(d => d.amount), 1);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white overflow-hidden">
      <header className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold tracking-tight">財務報表</h1>
        <p className="text-zinc-400 text-sm mt-1">事務所營運績效總覽</p>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
               <div className="absolute right-4 top-4 p-2 bg-zinc-800 rounded-lg text-zinc-500">
                 <Wallet size={20} />
               </div>
               <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">總簽約金額</div>
               <div className="text-2xl font-mono text-white font-bold">${summary.totalContract.toLocaleString()}</div>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
               <div className="absolute right-4 top-4 p-2 bg-zinc-800 rounded-lg text-teal-500">
                 <DollarSign size={20} />
               </div>
               <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">總實收營收</div>
               <div className="text-2xl font-mono text-teal-400 font-bold">${summary.totalRevenue.toLocaleString()}</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
               <div className="absolute right-4 top-4 p-2 bg-zinc-800 rounded-lg text-red-500">
                 <TrendingDown size={20} />
               </div>
               <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">總支出成本</div>
               <div className="text-2xl font-mono text-red-400 font-bold">${summary.totalCost.toLocaleString()}</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
               <div className="absolute right-4 top-4 p-2 bg-zinc-800 rounded-lg text-indigo-500">
                 <TrendingUp size={20} />
               </div>
               <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">淨利潤</div>
               <div className={`text-2xl font-mono font-bold ${summary.netProfit >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                 ${summary.netProfit.toLocaleString()}
               </div>
               <div className="text-xs text-zinc-500 mt-1 font-mono">Margin: {summary.profitMargin.toFixed(1)}%</div>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-6">月度營收趨勢 (近12個月有請款紀錄)</h3>
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

          {/* Cost Breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
             <h3 className="text-lg font-semibold mb-6">成本結構分析</h3>
             <div className="space-y-4">
               {Object.entries(summary.costDistribution).map(([cat, amount]) => {
                 const percentage = summary.totalCost > 0 ? (amount / summary.totalCost) * 100 : 0;
                 const label = cat === 'Subcontractor' ? '複委託/外包' : 
                               cat === 'GovFee' ? '規費' :
                               cat === 'Printing' ? '圖說印製' :
                               cat === 'Travel' ? '差旅費' : '雜支';
                 return (
                   <div key={cat}>
                     <div className="flex justify-between text-sm mb-1">
                       <span className="text-zinc-400">{label}</span>
                       <span className="font-mono text-zinc-200">${amount.toLocaleString()} ({percentage.toFixed(1)}%)</span>
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