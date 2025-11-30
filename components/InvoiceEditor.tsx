
import React, { useState } from 'react';
import { Project, Invoice, InvoiceItem, AppSettings, BankAccount } from '../types';
import { Plus, Trash2, Printer, Save, History } from 'lucide-react';
import { A4Paper } from './A4Paper';

interface InvoiceEditorProps {
  project: Project;
  onUpdate: (p: Project) => void;
  settings: AppSettings;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ project, onUpdate, settings }) => {
  const { quote, invoices } = project;
  const contractTotal = quote.customRealTotal ?? quote.categories.reduce((s, c) => s + c.items.reduce((i, it) => i + (it.amount||0), 0), 0);

  // --- Editor State ---
  const [draft, setDraft] = useState<Invoice>({
    id: crypto.randomUUID(),
    invoiceNo: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    items: [],
    totalService: 0,
    totalExpense: 0,
    taxAmount: 0
  });

  // --- Actions ---
  const handleTermSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const termId = e.target.value;
    const term = quote.paymentTerms.find(t => t.id === termId);
    if (!term) return;

    const amount = Math.round(contractTotal * (term.percentage / 100));
    
    // Add or update the service fee item
    const newItems = draft.items.filter(i => i.isReimbursable);
    newItems.unshift({
      description: `專業服務費: ${term.description} (${term.percentage}%)`,
      amount: amount,
      isReimbursable: false
    });

    updateDraft({ ...draft, termId, items: newItems });
  };

  const addExpense = () => {
    updateDraft({
      ...draft,
      items: [...draft.items, { description: '代墊費用', amount: 0, isReimbursable: true }]
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...draft.items];
    newItems[index] = { ...newItems[index], [field]: value };
    updateDraft({ ...draft, items: newItems });
  };

  const removeItem = (index: number) => {
    updateDraft({ ...draft, items: draft.items.filter((_, i) => i !== index) });
  };

  const updateDraft = (newDraft: Invoice) => {
    // Recalculate totals
    const service = newDraft.items.filter(i => !i.isReimbursable).reduce((s, i) => s + (Number(i.amount)||0), 0);
    const expense = newDraft.items.filter(i => i.isReimbursable).reduce((s, i) => s + (Number(i.amount)||0), 0);
    
    setDraft({
      ...newDraft,
      totalService: service,
      totalExpense: expense,
      taxAmount: 0 // For inclusive tax modes, we don't store separate tax
    });
  };

  const saveInvoice = () => {
    const newInvoices = [...invoices, { ...draft, id: crypto.randomUUID() }];
    onUpdate({ ...project, invoices: newInvoices });
    // Reset draft
    setDraft({
      ...draft,
      id: crypto.randomUUID(),
      invoiceNo: `INV-${new Date().getFullYear()}-${String(newInvoices.length + 1).padStart(3, '0')}`,
      termId: undefined,
      items: [],
      totalService: 0,
      totalExpense: 0,
      taxAmount: 0
    });
    alert('單據已儲存！');
  };

  const previousBilled = invoices.reduce((sum, inv) => sum + inv.totalService, 0);
  const remainingContract = contractTotal - previousBilled - draft.totalService;

  // Resolve Bank Account
  const getSelectedBankAccount = (): BankAccount | undefined => {
    const legacyMap: Record<string, string> = { 'company': 'default-company', 'personal': 'default-personal' };
    const idToFind = legacyMap[quote.bankAccount || ''] || quote.bankAccount;
    return settings.bankAccounts.find(acc => acc.id === idToFind) || settings.bankAccounts[0];
  };

  const selectedBank = getSelectedBankAccount();

  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="w-1/2 min-w-[400px] border-r border-zinc-800 p-6 overflow-y-auto print:hidden">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white font-sans">請款單製作</h2>
          <div className="text-xs text-zinc-500 font-sans">
            已請款金額: <span className="text-zinc-300 font-mono">${previousBilled.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2 font-sans">單據資訊</label>
            <div className="grid grid-cols-2 gap-4">
              <input 
                className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 font-mono"
                value={draft.invoiceNo}
                onChange={e => updateDraft({...draft, invoiceNo: e.target.value})}
                placeholder="單號"
              />
              <input 
                type="date"
                className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 font-sans"
                value={draft.date}
                onChange={e => updateDraft({...draft, date: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2 font-sans">載入合約階段</label>
            <select 
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 mb-2 font-sans"
              onChange={handleTermSelect}
              value={draft.termId || ''}
            >
              <option value="" disabled>選擇付款階段...</option>
              {quote.paymentTerms.map(term => (
                <option key={term.id} value={term.id}>
                  {term.description} ({term.percentage}%) - ${Math.round(contractTotal * (term.percentage/100)).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-sans">收費項目</label>
              <button onClick={addExpense} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-sans">
                <Plus size={12} /> 新增代墊費用
              </button>
            </div>
            
            {draft.items.map((item, idx) => (
              <div key={idx} className={`flex gap-2 items-center p-2 rounded ${item.isReimbursable ? 'bg-zinc-900 border border-zinc-800' : 'bg-teal-900/10 border border-teal-900/30'}`}>
                <div className="flex-1">
                   <input 
                    className="w-full bg-transparent text-sm text-zinc-300 focus:outline-none mb-1 font-sans"
                    value={item.description}
                    onChange={e => updateItem(idx, 'description', e.target.value)}
                  />
                  {item.isReimbursable && <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1 rounded font-sans">代墊</span>}
                </div>
                <input 
                  type="number"
                  className="w-24 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-right text-zinc-300 font-mono"
                  value={item.amount}
                  onChange={e => updateItem(idx, 'amount', parseFloat(e.target.value))}
                />
                <button onClick={() => removeItem(idx)} className="text-zinc-600 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={saveInvoice}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2 mt-8 font-sans"
          >
            <Save size={18} /> 儲存單據至紀錄
          </button>
        </div>
        
        {/* History List */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h3 className="text-zinc-400 font-medium mb-4 flex items-center gap-2 font-sans"><History size={16}/> 請款紀錄</h3>
          <div className="space-y-2">
            {invoices.map(inv => (
               <div key={inv.id} className="flex justify-between items-center p-3 bg-zinc-900 rounded border border-zinc-800 text-sm">
                 <div>
                   <div className="text-white font-mono">{inv.invoiceNo}</div>
                   <div className="text-zinc-500 text-xs font-sans">{inv.date}</div>
                 </div>
                 <div className="text-right">
                   <div className="text-zinc-300 font-mono">${(inv.totalService + inv.totalExpense + inv.taxAmount).toLocaleString()}</div>
                 </div>
               </div>
            ))}
            {invoices.length === 0 && <p className="text-zinc-600 text-sm italic font-sans">尚無紀錄。</p>}
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 bg-zinc-900 p-8 overflow-y-auto flex flex-col items-center relative print:bg-white print:p-0 print:block">
        <div className="absolute top-4 right-8 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded shadow transition-all font-medium font-sans"
          >
            <Printer size={16} /> 列印
          </button>
        </div>

        <A4Paper>
           {/* Main Content Group */}
           <div className="flex-1 flex flex-col">
             {/* Header - Matching Quote Style */}
             <div className="flex justify-between items-start mb-0">
              <div className="w-2/3 pr-8">
                <div className="text-[10px] tracking-[0.2em] text-gray-700 uppercase mb-1 font-sans font-bold">Payment Application</div>
                <h1 className="text-3xl font-serif font-bold text-black leading-tight mb-1">
                  {project.name}
                </h1>
                <div className="text-sm text-gray-700 font-sans leading-relaxed">
                  {project.location}
                </div>
              </div>
              <div className="w-1/3 text-right">
                 <div className="font-serif font-bold text-lg text-black">{settings.firmInfo.name}</div>
                 <div className="text-[10px] tracking-widest text-gray-700 uppercase mb-1 font-sans">{settings.firmInfo.englishName}</div>
                 
                 <div className="text-xs text-gray-700 font-mono">
                   <div>No: {draft.invoiceNo}</div>
                   <div>Date: {draft.date}</div>
                 </div>
              </div>
            </div>

            {/* Bill To & Provider - Matching Quote Style */}
            <div className="flex justify-between mb-2 border-t border-black my-2 pt-1 font-sans">
              <div className="w-1/2">
                <div className="text-[10px] tracking-widest text-gray-600 uppercase mb-0 font-bold">Bill To</div>
                <div className="text-base font-bold text-gray-900">{project.client}</div>
                {project.clientTaxId && (
                  <div className="text-xs text-gray-700 font-mono mt-0.5">統一編號: {project.clientTaxId}</div>
                )}
              </div>
              <div className="w-1/2 text-right">
                <div className="text-[10px] tracking-widest text-gray-600 uppercase mb-0 font-bold">Pay To</div>
                <div className="text-base font-bold text-gray-900">{settings.firmInfo.name} {settings.firmInfo.subName}</div>
                 {settings.firmInfo.taxId && (
                  <div className="text-xs text-gray-700 font-mono mt-0.5">統一編號: {settings.firmInfo.taxId}</div>
                )}
              </div>
            </div>

            {/* Table - Matching Quote Style */}
            <div className="mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t-2 border-black border-b border-black">
                    <th className="py-2 text-left font-bold text-black text-[10px] uppercase tracking-wider font-sans">Item Description</th>
                    <th className="py-2 text-right font-bold text-black text-[10px] uppercase tracking-wider w-32 font-sans">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {draft.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 text-left font-sans">
                         <div className="text-gray-900 font-medium">{item.description}</div>
                      </td>
                      <td className="py-3 text-right font-mono text-gray-900">
                        ${Number(item.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section - Matching Quote Style - Grid Layout */}
            <div className="grid grid-cols-2 gap-12 mb-4 break-inside-avoid">
               {/* Empty Left Column to align with footer left column */}
               <div></div>

               {/* Right Column: Totals */}
               <div>
                 <div className="flex justify-between py-2 border-t border-black text-sm font-bold text-gray-700 uppercase tracking-wider font-sans">
                   <span>項目合計</span>
                   <span className="font-mono">${(draft.totalService + draft.totalExpense).toLocaleString()}</span>
                 </div>
                 
                 {project.taxMode === 'vat5' && (
                   <div className="flex justify-between py-1 text-sm text-gray-700 font-sans">
                     <span>含稅 (5%)</span>
                     <span className="font-mono text-gray-600">(${Math.round(draft.totalService - (draft.totalService / 1.05)).toLocaleString()})</span>
                   </div>
                 )}

                 {project.taxMode === 'wht10' && (
                   <>
                    <div className="flex justify-between py-1 text-sm text-gray-700 font-sans">
                     <span>含代扣繳 (10%)</span>
                     <span className="font-mono">-${Math.round(draft.totalService * 0.10).toLocaleString()}</span>
                   </div>
                   <div className="text-[10px] text-gray-500 font-sans mt-0.5 text-right leading-tight">
                     (付款單位於開立票據之時應自行代扣執行業務所得10%之稅款)
                   </div>
                   </>
                 )}

                 {project.taxMode === 'none' && (
                   <div className="flex justify-between py-1 text-sm text-gray-700 font-sans">
                     <span>(未稅)</span>
                     <span className="font-mono text-gray-600">-</span>
                   </div>
                 )}

                 <div className="flex justify-between items-baseline py-4 border-t border-black mt-2">
                   <span className="font-bold text-lg text-gray-900 uppercase font-sans">本次請款</span>
                   <span className="font-bold text-3xl font-mono text-gray-900">
                     <span className="text-sm text-gray-700 font-sans font-normal mr-2">TWD</span>
                     {(() => {
                       const sub = draft.totalService + draft.totalExpense;
                       // For vat5 inclusive, Total Due is just sub.
                       if (project.taxMode === 'vat5') return sub.toLocaleString();
                       // For wht10, subtract 10%
                       if (project.taxMode === 'wht10') return Math.round(sub - (draft.totalService * 0.1)).toLocaleString();
                       return sub.toLocaleString();
                     })()}
                   </span>
                 </div>
               </div>
            </div>

            {/* Bottom Grid: Contract Status & Bank/Signature (Footer - No Auto Margin) */}
            <div className="grid grid-cols-2 gap-12 border-t border-black pt-6 mt-8 break-inside-avoid">
             {/* Left Column: Contract Status */}
             <div>
                <h4 className="text-[10px] uppercase tracking-widest text-gray-700 font-bold mb-4 font-sans">Contract Status</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-black pb-1 font-sans">
                    <span className="text-gray-800">合約總計金額</span>
                    <span className="font-mono font-medium">${contractTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-black pb-1 font-sans">
                    <span className="text-gray-800">已支付金額</span>
                    <span className="font-mono text-gray-600">${previousBilled.toLocaleString()}</span>
                  </div>
                   <div className="flex justify-between border-b border-black pb-1 font-sans">
                    <span className="text-gray-900 font-bold">本期請款金額</span>
                    <span className="font-mono font-bold text-gray-900">${draft.totalService.toLocaleString()}</span>
                  </div>
                   <div className="flex justify-between pt-1 font-sans">
                    <span className="text-gray-800">剩餘金額</span>
                    <span className="font-mono text-gray-600">${remainingContract.toLocaleString()}</span>
                  </div>
                </div>
             </div>

             {/* Right Column: Bank Info Only */}
             <div className="flex flex-col justify-between">
                <div className="mb-6">
                   <h4 className="text-[10px] uppercase tracking-widest text-gray-700 font-bold mb-2 font-sans">匯款資訊</h4>
                   {selectedBank ? (
                     <div className="text-sm text-gray-800 space-y-1 font-medium font-sans">
                       <p>{selectedBank.bankName}</p>
                       <p className="text-gray-800 font-normal">{selectedBank.branch}</p>
                       <p className="font-mono tracking-wide mt-2 text-base text-black">{selectedBank.accountNumber}</p>
                       <p className="text-xs text-gray-700 mt-1">戶名：{selectedBank.accountName}</p>
                     </div>
                   ) : (
                     <div className="text-sm text-red-500 italic">請選擇匯款帳戶</div>
                   )}
                </div>
             </div>
          </div>
          
        </div>
        </A4Paper>
      </div>
    </div>
  );
};
