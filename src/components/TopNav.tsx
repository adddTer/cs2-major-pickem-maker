import React from 'react';
import { Home, Edit3, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface TopNavProps {
  viewMode: 'home' | 'edit' | 'summary';
  setViewMode: (mode: 'home' | 'edit' | 'summary') => void;
  currentPickSetId: string | null;
}

export const TopNav: React.FC<TopNavProps> = ({ viewMode, setViewMode, currentPickSetId }) => {
  return (
    <div className="h-14 border-b border-white/5 bg-zinc-900/40 backdrop-blur-md flex items-center px-2 sm:px-6 justify-between shrink-0 z-20 overflow-x-auto custom-scrollbar">
       <div className="flex items-center gap-1.5 sm:gap-2 mr-4 min-w-max">
          <img 
             src="https://wsrv.nl/?url=img-cdn.hltv.org/eventlogo/2mt5dKGFBdIcxv37gayq1X.png" 
             referrerPolicy="no-referrer" 
             className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0" 
             alt="IEM Cologne 2026"
          />
          <span className="text-[10px] sm:text-sm font-bold tracking-widest text-zinc-100 hidden sm:block">IEM Cologne Major 2026</span>
          <span className="text-[10px] sm:hidden font-bold tracking-widest text-zinc-100">Cologne 26</span>
       </div>
       
       <div className="flex bg-black/40 p-0.5 sm:p-1 rounded-md border border-white/5 shrink-0 min-w-max">
          <div 
             onClick={() => setViewMode('home')}
             className={cn("px-2 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2", viewMode === 'home' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
          >
             <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">首页</span><span className="sm:hidden">首页</span>
          </div>
          <div 
             onClick={() => {
                if (!currentPickSetId) {
                    alert("请先从首页创建或选择竞猜 ID！");
                    return;
                }
                setViewMode('edit');
             }}
             className={cn("px-2 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2", viewMode === 'edit' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
          >
             <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">编辑竞猜</span><span className="sm:hidden">竞猜</span>
          </div>
          <div 
             onClick={() => setViewMode('summary')}
             className={cn("px-2 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2", viewMode === 'summary' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
          >
             <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">社区汇总</span><span className="sm:hidden">汇总</span>
          </div>
       </div>
    </div>
  );
};
