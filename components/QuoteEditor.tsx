
import React, { useState, useEffect } from 'react';
import { Project, QuoteCategory, QuoteItem, PaymentTerm, TaxMode, AppSettings, BankAccount } from '../types';
import { Plus, Trash2, Printer, GripVertical, RefreshCw, X, CreditCard, Book, Check } from 'lucide-react';
import { A4Paper } from './A4Paper';
import { loadNoteLibrary, saveNoteLibrary } from '../services/storage';

interface QuoteEditorProps {
  project: Project;
  onUpdate: (p: Project) => void;
  settings: AppSettings;
}

export const QuoteEditor: React.FC<QuoteEditorProps> = ({ project, onUpdate, settings }) => {
  const { quote } = project;
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryNotes, setLibraryNotes] = useState<string[]>([]);
  const [newLibNote, setNewLibNote] = useState('');

  // Drag State
  const [draggedItem, setDraggedItem] = useState<{ catId: string, index: number } | null>(null);
  const [draggedNoteIndex, setDraggedNoteIndex] = useState<number | null>(null);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [draggedTermIndex, setDraggedTermIndex] = useState<number | null>(null);

  // Load library on mount
  useEffect(() => {
    setLibraryNotes(loadNoteLibrary());
  }, []);

  // --- Handlers ---
  const addCategory = () => {
    const newCat: QuoteCategory = {
      id: crypto.randomUUID(),
      name: '新增階段',
      items: [{ id: crypto.randomUUID(), description: '服務項目', amount: 0 }]
    };
    updateQuote({ ...quote, categories: [...quote.categories, newCat] });
  };

  const removeCategory = (catId: string) => {
    updateQuote({ ...quote, categories: quote.categories.filter(c => c.id !== catId) });
  };

  const updateCategoryName = (catId: string, name: string) => {
    updateQuote({
      ...quote,
      categories: quote.categories.map(c => c.id === catId ? { ...c, name } : c)
    });
  };

  // --- Category Drag and Drop ---
  const handleCategoryDragStart = (e: React.DragEvent, index: number) => {
    // Only allow drag if we are clicking the grip handle (checked via target or assume wrapper)
    // For simplicity in React, we just track the index
    setDraggedCategoryIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCategoryDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Essential to allow drop
    e.dataTransfer.dropEffect = "move";
  };

  const handleCategoryDrop = (dropIndex: number) => {
    if (draggedCategoryIndex === null) return;
    
    const newCategories = [...quote.categories];
    const [movedCat] = newCategories.splice(draggedCategoryIndex, 1);
    newCategories.splice(dropIndex, 0, movedCat);
    
    updateQuote({ ...quote, categories: newCategories });
    setDraggedCategoryIndex(null);
  };


  const addItem = (catId: string) => {
    updateQuote({
      ...quote,
      categories: quote.categories.map(c => {
        if (c.id === catId) {
          return {
            ...c,
            items: [...c.items, { id: crypto.randomUUID(), description: '', amount: 0 }]
          };
        }
        return c;
      })
    });
  };

  const updateItem = (catId: string, itemId: string, field: keyof QuoteItem, value: any) => {
    updateQuote({
      ...quote,
      categories: quote.categories.map(c => {
        if (c.id === catId) {
          return {
            ...c,
            items: c.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
          };
        }
        return c;
      })
    });
  };

  const deleteItem = (catId: string, itemId: string) => {
    updateQuote({
      ...quote,
      categories: quote.categories.map(c => {
        if (c.id === catId) {
          return { ...c, items: c.items.filter(i => i.id !== itemId) };
        }
        return c;
      })
    });
  };

  // --- Drag and Drop Handlers for Items ---
  const handleItemDragStart = (e: React.DragEvent, catId: string, index: number) => {
    e.stopPropagation(); // Prevent Category drag start
    setDraggedItem({ catId, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleItemDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); // Stop bubbling to category
    e.dataTransfer.dropEffect = "move";
  };

  const handleItemDrop = (e: React.DragEvent, targetCatId: string, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling

    if (!draggedItem) return;
    const { catId: sourceCatId, index: sourceIndex } = draggedItem;

    // Deep copy categories to handle mutation safely
    const newCategories = quote.categories.map(c => ({
      ...c,
      items: [...c.items]
    }));

    const sourceCat = newCategories.find(c => c.id === sourceCatId);
    const targetCat = newCategories.find(c => c.id === targetCatId);

    if (!sourceCat || !targetCat) return;

    // Remove from source
    const [movedItem] = sourceCat.items.splice(sourceIndex, 1);

    // Calculate insertion index
    let finalDropIndex = dropIndex;

    // If we are in the same category and moving down, the index shifts because we removed an item before the drop point
    if (sourceCatId === targetCatId && sourceIndex < dropIndex) {
      finalDropIndex -= 1;
    }

    // Insert into target
    // Ensure index doesn't exceed bounds (e.g. dropping at end)
    if (finalDropIndex >= targetCat.items.length) {
      targetCat.items.push(movedItem);
    } else {
      targetCat.items.splice(finalDropIndex, 0, movedItem);
    }

    updateQuote({ ...quote, categories: newCategories });
    setDraggedItem(null);
  };


  const updateTerm = (id: string, field: keyof PaymentTerm, value: any) => {
    updateQuote({
      ...quote,
      paymentTerms: quote.paymentTerms.map(t => t.id === id ? { ...t, [field]: value } : t)
    });
  };

  const addTerm = () => {
    updateQuote({
      ...quote,
      paymentTerms: [...quote.paymentTerms, { id: crypto.randomUUID(), description: '新付款階段', percentage: 10 }]
    });
  };

  const deleteTerm = (id: string) => {
    updateQuote({ ...quote, paymentTerms: quote.paymentTerms.filter(t => t.id !== id) });
  };

  // --- Term Drag and Drop ---
  const handleTermDragStart = (index: number) => {
    setDraggedTermIndex(index);
  };

  const handleTermDrop = (dropIndex: number) => {
    if (draggedTermIndex === null) return;
    
    const newTerms = [...quote.paymentTerms];
    const [movedTerm] = newTerms.splice(draggedTermIndex, 1);
    newTerms.splice(dropIndex, 0, movedTerm);
    
    updateQuote({ ...quote, paymentTerms: newTerms });
    setDraggedTermIndex(null);
  };


  // Note Handlers
  const addNote = (text: string = '') => {
    updateQuote({
      ...quote,
      notes: [...(quote.notes || []), text]
    });
  };

  const updateNote = (index: number, text: string) => {
    const newNotes = [...(quote.notes || [])];
    newNotes[index] = text;
    updateQuote({ ...quote, notes: newNotes });
  };

  const deleteNote = (index: number) => {
    const newNotes = [...(quote.notes || [])];
    newNotes.splice(index, 1);
    updateQuote({ ...quote, notes: newNotes });
  };

  // --- Drag and Drop Handlers for Notes ---
  const handleNoteDragStart = (index: number) => {
    setDraggedNoteIndex(index);
  };

  const handleNoteDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleNoteDrop = (dropIndex: number) => {
    if (draggedNoteIndex === null) return;
    
    const newNotes = [...(quote.notes || [])];
    const [movedNote] = newNotes.splice(draggedNoteIndex, 1);
    newNotes.splice(dropIndex, 0, movedNote);
    
    updateQuote({ ...quote, notes: newNotes });
    setDraggedNoteIndex(null);
  };

  // Library Handlers
  const addToLibrary = () => {
    if (!newLibNote.trim()) return;
    const updatedLib = [...libraryNotes, newLibNote.trim()];
    setLibraryNotes(updatedLib);
    saveNoteLibrary(updatedLib);
    setNewLibNote('');
  };

  const removeFromLibrary = (index: number) => {
    const updatedLib = libraryNotes.filter((_, i) => i !== index);
    setLibraryNotes(updatedLib);
    saveNoteLibrary(updatedLib);
  };

  const importFromLibrary = (text: string) => {
    addNote(text);
    setIsLibraryOpen(false);
  };

  const updateQuote = (newQuote: typeof quote) => {
    onUpdate({ ...project, quote: newQuote, lastModified: Date.now() });
  };

  const updateTaxMode = (mode: TaxMode) => {
    onUpdate({ ...project, taxMode: mode, lastModified: Date.now() });
  };

  const updateBankAccount = (accountId: string) => {
    updateQuote({ ...quote, bankAccount: accountId });
  };

  // --- Calculations ---
  const calculateBaseSum = () => {
    return quote.categories.reduce((sum, cat) => 
      sum + cat.items.reduce((iSum, item) => iSum + (Number(item.amount) || 0), 0)
    , 0);
  };

  const baseSum = calculateBaseSum();
  const contractAmount = quote.customRealTotal ?? baseSum;
  const termsSum = quote.paymentTerms.reduce((sum, t) => sum + Number(t.percentage), 0);
  
  const chineseNumerals = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  // Resolve Bank Account (Legacy Support + ID Match)
  const getSelectedBankAccount = (): BankAccount | undefined => {
    // Legacy mapping or direct ID match
    const legacyMap: Record<string, string> = { 'company': 'default-company', 'personal': 'default-personal' };
    const idToFind = legacyMap[quote.bankAccount || ''] || quote.bankAccount;
    
    // Find in settings, if not found, default to first available
    return settings.bankAccounts.find(acc => acc.id === idToFind) || settings.bankAccounts[0];
  };

  const selectedBank = getSelectedBankAccount();

  // --- Render ---
  return (
    <div className="flex h-full print:block print:h-auto">
      {/* Editor Panel (Left) - Hidden on Print */}
      <div className="w-1/2 min-w-[400px] border-r border-zinc-800 p-6 overflow-y-auto print:hidden bg-zinc-950 relative">
        
        {/* Tax Mode Selection */}
        <div className="mb-6 bg-zinc-900 p-4 rounded-lg border border-zinc-800">
          <label className="text-zinc-500 text-xs uppercase tracking-wider block mb-3 font-sans">稅務模式設定</label>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => updateTaxMode('none')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors border font-sans ${
                project.taxMode === 'none' 
                  ? 'bg-teal-900/30 border-teal-600 text-teal-400' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              未稅
              <span className="block text-[10px] font-normal opacity-70">顯示金額即總額</span>
            </button>
            <button 
              onClick={() => updateTaxMode('vat5')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors border font-sans ${
                project.taxMode === 'vat5' 
                  ? 'bg-teal-900/30 border-teal-600 text-teal-400' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              營業稅 5% (內含)
              <span className="block text-[10px] font-normal opacity-70">總額內含 5%</span>
            </button>
            <button 
              onClick={() => updateTaxMode('wht10')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors border font-sans ${
                project.taxMode === 'wht10' 
                  ? 'bg-teal-900/30 border-teal-600 text-teal-400' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              含代扣稅 10%
              <span className="block text-[10px] font-normal opacity-70">總額內含扣繳</span>
            </button>
          </div>
        </div>

        {/* Categories & Items */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white font-sans">服務項目明細</h2>
            <button onClick={addCategory} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-zinc-300 transition-colors flex items-center gap-1 font-sans">
              <Plus size={14} /> 新增分類
            </button>
          </div>
          
          <div className="space-y-6">
            {quote.categories.map((cat, index) => (
              <div 
                key={cat.id} 
                className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4"
                draggable
                onDragStart={(e) => handleCategoryDragStart(e, index)}
                onDragOver={handleCategoryDragOver}
                onDrop={() => handleCategoryDrop(index)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-zinc-600 cursor-move hover:text-zinc-400" title="拖曳調整分類順序">
                    <GripVertical size={18} />
                  </div>
                  <div className="text-zinc-600">
                     <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">#{index + 1}</span>
                  </div>
                  <input 
                    className="bg-transparent text-teal-400 font-medium focus:outline-none focus:border-b border-zinc-700 w-full font-sans"
                    value={cat.name}
                    onChange={e => updateCategoryName(cat.id, e.target.value)}
                    placeholder="分類名稱"
                  />
                  <button onClick={() => removeCategory(cat.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="space-y-2 pl-2">
                  {cat.items.map((item, itemIndex) => (
                    <div 
                      key={item.id} 
                      className="flex gap-2 items-start group"
                      draggable
                      onDragStart={(e) => handleItemDragStart(e, cat.id, itemIndex)}
                      onDragOver={handleItemDragOver}
                      onDrop={(e) => handleItemDrop(e, cat.id, itemIndex)}
                    >
                      <div className="pt-2 text-zinc-600 cursor-move hover:text-zinc-400" title="拖曳調整項目順序">
                        <GripVertical size={16} />
                      </div>
                      <div className="flex-1 space-y-1">
                         <input 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-300 focus:border-teal-500/50 focus:outline-none font-sans"
                          value={item.description}
                          onChange={e => updateItem(cat.id, item.id, 'description', e.target.value)}
                          placeholder="項目說明"
                        />
                         <input 
                          className="w-full bg-zinc-950/50 border-none rounded px-2 py-0.5 text-xs text-zinc-500 focus:text-zinc-300 focus:outline-none placeholder:text-zinc-700 font-sans"
                          value={item.note || ''}
                          onChange={e => updateItem(cat.id, item.id, 'note', e.target.value)}
                          placeholder="項目備註 (選填)"
                        />
                      </div>
                     
                      <input 
                        type="number"
                        className="w-24 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-300 text-right focus:border-teal-500/50 focus:outline-none font-mono"
                        value={item.amount}
                        onChange={e => updateItem(cat.id, item.id, 'amount', parseFloat(e.target.value))}
                        placeholder="0.00"
                      />
                      <button onClick={() => deleteItem(cat.id, item.id)} className="pt-1.5 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {/* Drop zone for moving items to the end of this category or into an empty category */}
                  <div 
                    className={`h-6 mt-2 rounded border-2 border-dashed border-zinc-800/50 hover:border-teal-500/50 hover:bg-teal-900/10 transition-colors flex items-center justify-center text-[10px] text-zinc-700 ${draggedItem && draggedItem.catId !== cat.id ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
                    onDragOver={handleItemDragOver}
                    onDrop={(e) => handleItemDrop(e, cat.id, cat.items.length)}
                  >
                     {draggedItem ? '拖曳至此分類底部' : '拖曳至此'}
                  </div>

                  <button onClick={() => addItem(cat.id)} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mt-2 font-sans ml-6">
                    <Plus size={12} /> 新增項目
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals & Override */}
        <div className="mb-8 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2 font-sans">
             <RefreshCw size={14}/> 合約金額設定 (實收金額)
          </h3>
          <div className="flex items-center justify-between text-sm mb-3 font-sans">
            <span className="text-zinc-500">項目自動加總:</span>
            <span className="font-mono text-zinc-400">${baseSum.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between bg-zinc-950 p-3 rounded border border-zinc-800">
            <div className="font-sans">
               <span className="text-zinc-300 font-medium block">自訂合約總額</span>
               <span className="text-xs text-zinc-500">稅金與分期將以此金額計算</span>
            </div>
           
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                className="w-36 bg-zinc-900 border border-teal-900 rounded px-2 py-1.5 text-right text-teal-400 font-bold focus:outline-none font-mono text-lg"
                value={quote.customRealTotal ?? ''}
                placeholder={baseSum.toString()}
                onChange={e => updateQuote({ ...quote, customRealTotal: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              {quote.customRealTotal !== undefined && (
                <button 
                  title="重置為自動加總"
                  onClick={() => updateQuote({ ...quote, customRealTotal: undefined })}
                  className="text-zinc-500 hover:text-red-400"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bank Account */}
        <div className="mb-8">
           <div className="flex items-center justify-between mb-2">
             <h2 className="text-lg font-semibold text-white flex items-center gap-2 font-sans"><CreditCard size={18}/> 收款帳戶</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
             {settings.bankAccounts.map(acc => (
               <div 
                  key={acc.id}
                  onClick={() => updateBankAccount(acc.id)}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    selectedBank?.id === acc.id
                    ? 'bg-teal-900/30 border-teal-500 text-teal-300' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-medium text-sm mb-1">{acc.accountName}</div>
                  <div className="text-xs text-zinc-500">{acc.bankName}</div>
                  <div className="text-xs font-mono mt-1">{acc.accountNumber}</div>
                </div>
             ))}
           </div>
        </div>

        {/* Payment Terms */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 font-sans">
             <h2 className="text-lg font-semibold text-white">付款期數</h2>
             <span className={`text-xs font-bold px-2 py-1 rounded ${termsSum === 100 ? 'bg-teal-900/30 text-teal-400' : 'bg-red-900/30 text-red-400'}`}>
               累計: {termsSum}%
             </span>
          </div>
          <div className="space-y-2">
            {quote.paymentTerms.map((term, index) => (
              <div 
                key={term.id} 
                className="flex gap-2 items-center bg-zinc-900/30 p-2 rounded border border-zinc-800/50"
                draggable
                onDragStart={() => handleTermDragStart(index)}
                onDragOver={handleNoteDragOver} // Reuse existing preventDefault
                onDrop={() => handleTermDrop(index)}
              >
                <div className="text-zinc-600 cursor-move hover:text-zinc-400" title="拖曳調整順序">
                  <GripVertical size={16} />
                </div>
                <input 
                  className="flex-1 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-teal-500 focus:outline-none px-2 py-1 text-sm text-zinc-300 font-sans"
                  value={term.description}
                  onChange={e => updateTerm(term.id, 'description', e.target.value)}
                />
                <div className="relative w-20">
                  <input 
                    type="number"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-right text-zinc-300 pr-5 focus:outline-none focus:border-teal-500 font-mono"
                    value={term.percentage}
                    onChange={e => updateTerm(term.id, 'percentage', parseFloat(e.target.value))}
                  />
                  <span className="absolute right-2 top-1.5 text-zinc-500 text-xs font-sans">%</span>
                </div>
                <div className="w-24 text-right text-xs text-zinc-500 font-mono">
                   ${Math.round(contractAmount * (term.percentage / 100)).toLocaleString()}
                </div>
                <button onClick={() => deleteTerm(term.id)} className="text-zinc-600 hover:text-red-400 px-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
             <button onClick={addTerm} className="w-full py-2 border border-dashed border-zinc-800 text-zinc-500 hover:text-zinc-300 text-sm rounded mt-2 hover:bg-zinc-900 transition-colors font-sans">
              + 新增期數
            </button>
          </div>
        </div>

        {/* Notes Section */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-4 font-sans">
            <h2 className="text-lg font-semibold text-white">備註事項</h2>
            <div className="flex gap-2">
              <button onClick={() => setIsLibraryOpen(true)} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-teal-400 border border-zinc-700/50 transition-colors flex items-center gap-1">
                <Book size={14} /> 備註資料庫
              </button>
              <button onClick={() => addNote('')} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-zinc-300 transition-colors flex items-center gap-1">
                <Plus size={14} /> 新增
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {(quote.notes || []).map((note, idx) => (
              <div 
                key={idx} 
                className="flex gap-2 items-start"
                draggable
                onDragStart={() => handleNoteDragStart(idx)}
                onDragOver={handleNoteDragOver}
                onDrop={() => handleNoteDrop(idx)}
              >
                 <div className="pt-2 text-zinc-600 cursor-move hover:text-zinc-400" title="拖曳調整順序">
                   <GripVertical size={16} />
                 </div>
                 <div className="pt-2 text-zinc-600 text-xs font-mono select-none">{idx + 1}.</div>
                 <textarea 
                   rows={2}
                   className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-teal-500 resize-none font-sans"
                   value={note}
                   onChange={e => updateNote(idx, e.target.value)}
                   placeholder="輸入備註內容..."
                 />
                 <button onClick={() => deleteNote(idx)} className="mt-2 text-zinc-600 hover:text-red-400">
                    <Trash2 size={14} />
                 </button>
              </div>
            ))}
            {(!quote.notes || quote.notes.length === 0) && (
              <div className="text-center py-4 border border-dashed border-zinc-800 rounded text-zinc-600 text-sm font-sans">
                尚無備註，請新增或從資料庫匯入
              </div>
            )}
          </div>
        </div>

        {/* Library Modal */}
        {isLibraryOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 w-full max-w-lg rounded-xl border border-zinc-800 shadow-2xl flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900 rounded-t-xl">
                 <h3 className="font-semibold text-white flex items-center gap-2"><Book size={18}/> 備註事項資料庫</h3>
                 <button onClick={() => setIsLibraryOpen(false)} className="text-zinc-500 hover:text-white">
                   <X size={20} />
                 </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 space-y-2">
                 {libraryNotes.length === 0 && (
                   <p className="text-zinc-500 text-center py-8 text-sm">資料庫是空的。</p>
                 )}
                 {libraryNotes.map((note, idx) => (
                   <div key={idx} className="group flex gap-3 items-start p-3 bg-zinc-950 border border-zinc-800 rounded hover:border-zinc-700 transition-colors">
                     <p className="flex-1 text-sm text-zinc-300 leading-relaxed font-sans">{note}</p>
                     <div className="flex flex-col gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => importFromLibrary(note)}
                         title="加入至報價單"
                         className="p-1.5 bg-teal-900/30 text-teal-400 hover:bg-teal-900/50 rounded"
                       >
                         <Check size={16} />
                       </button>
                       <button 
                         onClick={() => removeFromLibrary(idx)}
                         title="從資料庫刪除"
                         className="p-1.5 bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded"
                       >
                         <Trash2 size={16} />
                       </button>
                     </div>
                   </div>
                 ))}
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-xl">
                 <label className="text-xs text-zinc-500 mb-2 block">新增常用備註至資料庫</label>
                 <div className="flex gap-2">
                   <input 
                     className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 font-sans"
                     placeholder="輸入新的常用備註..."
                     value={newLibNote}
                     onChange={e => setNewLibNote(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && addToLibrary()}
                   />
                   <button 
                     onClick={addToLibrary}
                     disabled={!newLibNote.trim()}
                     className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors"
                   >
                     儲存
                   </button>
                 </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Preview Panel (Right) */}
      <div className="flex-1 bg-zinc-900 p-8 overflow-y-auto flex flex-col items-center relative print:p-0 print:bg-white print:block print:overflow-visible print:h-auto">
        <div className="absolute top-4 right-8 print:hidden z-10">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded shadow transition-all font-medium font-sans"
          >
            <Printer size={16} /> 列印 PDF
          </button>
        </div>

        <A4Paper>
          {/* Main Content Group - Flex Col to prevent spacing issues */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start mb-0">
              <div className="w-2/3 pr-8">
                <div className="text-[10px] tracking-[0.2em] text-gray-700 uppercase mb-1 font-sans font-bold">Quotation</div>
                <h1 className="text-3xl font-serif font-bold text-black leading-tight mb-1">
                  {project.name}
                </h1>
                <div className="text-sm text-gray-700 font-sans leading-relaxed">
                  {project.location}
                </div>
              </div>
              <div className="w-1/3 text-right">
                 <div className="font-serif font-bold text-lg text-black">{settings.firmInfo.name}</div>
                 {/* REMOVED SUB-NAME FROM HEADER */}
                 <div className="text-[10px] tracking-widest text-gray-700 uppercase mb-1 font-sans">{settings.firmInfo.englishName}</div>
                 
                 <div className="text-xs text-gray-700 font-mono">
                   <div>{new Date().toISOString().split('T')[0]}</div>
                   <div>Q-{project.id.slice(0,8).toUpperCase()}</div>
                 </div>
              </div>
            </div>

            {/* Client & Provider Info */}
            <div className="flex justify-between mb-2 border-t border-black my-2 pt-1 font-sans">
              <div className="w-1/2">
                <div className="text-[10px] tracking-widest text-gray-600 uppercase mb-0 font-bold">Prepared For</div>
                <div className="text-base font-bold text-gray-900">{project.client}</div>
              </div>
              <div className="w-1/2 text-right">
                <div className="text-[10px] tracking-widest text-gray-600 uppercase mb-0 font-bold">Provider</div>
                <div className="text-base font-bold text-gray-900">{settings.firmInfo.name} {settings.firmInfo.subName}</div>
                <div className="text-sm text-gray-800">{settings.firmInfo.phone}</div>
              </div>
            </div>

            {/* Table - Compressed margin */}
            <div className="mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t-2 border-black border-b border-black">
                    <th className="py-2 text-left font-bold text-black text-[10px] uppercase tracking-wider w-1/4 font-sans">Item</th>
                    <th className="py-2 text-left font-bold text-black text-[10px] uppercase tracking-wider w-1/2 font-sans">Details</th>
                    <th className="py-2 text-right font-bold text-black text-[10px] uppercase tracking-wider font-sans">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {quote.categories.map((cat, catIdx) => (
                    <React.Fragment key={cat.id}>
                      {/* Category Header Row */}
                      <tr>
                        <td colSpan={3} className="pt-2 pb-1 text-left">
                          <span className="font-bold text-gray-900 text-sm font-sans">
                            {chineseNumerals[catIdx] || (catIdx + 1)}、{cat.name}
                          </span>
                        </td>
                      </tr>
                      {/* Items */}
                      {cat.items.map(item => (
                        <tr key={item.id} className="group">
                          <td className="py-1 align-top text-gray-700 text-xs font-sans">
                            {/* Optional: Add item code or numbering if needed */}
                          </td>
                          <td className="py-1 align-top pr-4 text-left font-sans">
                            <div className="text-gray-900 font-medium inline">
                               {item.description}
                            </div>
                            {item.note && <span className="text-xs text-gray-700 ml-2 font-normal">({item.note})</span>}
                          </td>
                          <td className="py-1 align-top text-right font-mono text-gray-900">
                            {item.amount > 0 ? item.amount.toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="grid grid-cols-2 gap-12 mb-4 break-inside-avoid">
               <div></div>
               <div>
                 {/* 1. Subtotal Line (Always Base Sum) */}
                 <div className="flex justify-between py-2 border-t border-black text-xs font-bold text-gray-700 uppercase tracking-wider font-sans">
                   <span>項目合計</span>
                   <span className="font-mono">{baseSum.toLocaleString()}</span>
                 </div>

                 {/* 2. Contract Amount (The Big Number - "Custom Real Total") */}
                 <div className="flex justify-between items-baseline py-2 border-t border-black">
                   <span className="font-bold text-lg text-gray-900 uppercase font-sans">實收金額</span>
                   <span className="font-bold text-3xl font-mono text-gray-900">
                     <span className="text-sm text-gray-700 font-sans font-normal mr-2">TWD</span>
                     {contractAmount.toLocaleString()}
                   </span>
                 </div>

                 {/* 3. Tax Line (Informational) */}
                 {project.taxMode === 'vat5' && (
                   <div className="flex justify-between py-1 text-sm text-gray-700 font-sans">
                     <span>含稅 (5%)</span>
                     <span className="font-mono text-gray-600">({(Math.round(contractAmount - (contractAmount / 1.05))).toLocaleString()})</span>
                   </div>
                 )}
                  {project.taxMode === 'wht10' && (
                   <div className="flex justify-between py-1 text-sm text-gray-700 font-sans">
                     <span>含代扣繳 (10%)</span>
                     <span className="font-mono text-gray-600">({(Math.round(contractAmount * 0.1)).toLocaleString()})</span>
                   </div>
                 )}
                 {project.taxMode === 'none' && (
                   <div className="flex justify-between py-1 text-sm text-gray-700 font-sans">
                     <span>(未稅)</span>
                     <span className="font-mono text-gray-600">-</span>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* Bottom Grid: Terms & Bank Info (Footer - No Auto Margin) */}
          <div className="grid grid-cols-2 gap-12 border-t border-black pt-6 mt-8 break-inside-avoid">
             {/* Left Column: Terms & Notes */}
             <div>
                <div className="mb-6">
                  <h4 className="text-[10px] uppercase tracking-widest text-gray-700 font-bold mb-2 font-sans">付款辦法</h4>
                  <div className="space-y-1">
                    {quote.paymentTerms.map(term => (
                      <div key={term.id} className="flex justify-between text-xs border-b border-black pb-1 last:border-0 font-sans">
                         <span className="font-bold text-gray-900 w-12">{term.percentage}%</span>
                         <span className="text-gray-800 flex-1">{term.description}</span>
                         <span className="font-mono text-gray-700 text-right">
                           NT$ {Math.round(contractAmount * (term.percentage / 100)).toLocaleString()}
                         </span>
                      </div>
                    ))}
                  </div>
                </div>

                {quote.notes && quote.notes.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-gray-700 font-bold mb-2 font-sans">Notes</h4>
                    <ol className="list-decimal list-outside ml-3 space-y-1 text-[11px] text-gray-800 leading-relaxed font-sans">
                      {quote.notes.map((note, i) => (
                        <li key={i} className="pl-2">{note}</li>
                      ))}
                    </ol>
                  </div>
                )}
             </div>

             {/* Right Column: Bank & Signature */}
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

                <div className="mt-8 pt-8 border-t border-black">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-600 font-sans">
                    <span>Signature <span className="normal-case tracking-normal text-gray-500">(乙方簽認)</span></span>
                    <span>Date</span>
                  </div>
                </div>
             </div>
          </div>

        </A4Paper>
      </div>
    </div>
  );
};
