import React from 'react';
import { LayoutDashboard, Settings, PieChart } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (view: ViewState) => void;
  activeView: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate, activeView }) => {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-300 font-sans print:bg-white print:h-auto print:block print:overflow-visible">
      {/* Sidebar - Hidden on Print */}
      <aside className="w-16 md:w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 print:hidden transition-all duration-300">
        <div className="p-4 md:p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-bold text-lg text-zinc-100 hidden md:block tracking-tight">ArchiFinance</span>
        </div>

        <nav className="flex-1 p-2 md:p-4 space-y-2">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
              activeView === 'dashboard'
                ? 'bg-zinc-800 text-teal-400'
                : 'hover:bg-zinc-800/50 text-zinc-400'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="hidden md:block font-medium">儀表板</span>
          </button>
          
          <div className="pt-4 pb-2 px-3 hidden md:block text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            系統功能
          </div>
          
          <button 
            onClick={() => onNavigate('reports')}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
              activeView === 'reports'
                ? 'bg-zinc-800 text-teal-400'
                : 'hover:bg-zinc-800/50 text-zinc-400'
            }`}
          >
            <PieChart size={20} />
            <span className="hidden md:block font-medium">財務報表</span>
          </button>
           <button 
             onClick={() => onNavigate('settings')}
             className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
              activeView === 'settings'
                ? 'bg-zinc-800 text-teal-400'
                : 'hover:bg-zinc-800/50 text-zinc-400'
            }`}
           >
            <Settings size={20} />
            <span className="hidden md:block font-medium">系統設定</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-zinc-800 text-xs text-zinc-600 hidden md:block">
          v1.2.0 • 本地儲存
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden h-full relative print:h-auto print:overflow-visible print:block">
        {children}
      </main>
    </div>
  );
};