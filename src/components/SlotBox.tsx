import React from 'react';
import { PickSlot } from '../types';
import { cn } from '../lib/utils';
import { TEAMS } from '../data/teams';
import { TeamLogo } from './TeamLogo';
import { CheckCircle2, XCircle, Swords, AlertCircle } from 'lucide-react';

export const SlotBox: React.FC<{ 
  slot: PickSlot & { resultStatus?: 'correct'|'incorrect'|'unknown', clashType?: 'x-one' | 'x-fail' | 'x-pass' }, 
  border: string, 
  readOnly?: boolean, 
  size?: 'xs' | 'sm' | 'md',
  onDrop?: (e: React.DragEvent, slotId: string) => void,
  onClick?: (slotId: string, teamId: string | null) => void,
}> = ({ slot, border, readOnly = false, size = 'md', onDrop, onClick }) => {
  const team = TEAMS.find(t => t.id === slot.teamId);
  const isSm = size === 'sm';
  const isXs = size === 'xs';
  return (
     <div 
        draggable={!readOnly && !!team}
        onDragStart={(e) => {
            if (readOnly || !team) return e.preventDefault();
            e.dataTransfer.setData('teamId', team.id);
            e.dataTransfer.setData('sourceSlotId', slot.id);
            e.dataTransfer.effectAllowed = 'copyMove';
        }}
        onDrop={readOnly ? undefined : (e) => onDrop && onDrop(e, slot.id)} 
        onDragOver={readOnly ? undefined : e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onClick={readOnly ? undefined : () => onClick && onClick(slot.id, slot.teamId)}
         className={cn(
           "rounded-[12px] bg-zinc-900/60 backdrop-blur-md shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-300 group relative border shrink-0", 
           isXs ? "w-7 h-7 sm:w-8 sm:h-8 rounded-md" : isSm ? "w-9 h-9 sm:w-11 sm:h-11" : "w-[3.25rem] h-[3.25rem] md:w-[68px] md:h-[68px] z-10",
           readOnly && !slot.resultStatus ? "" : !readOnly ? "hover:bg-zinc-800/80 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)]" : "",
           slot.resultStatus === 'correct' ? "border-emerald-500/60 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : 
           slot.resultStatus === 'incorrect' ? "border-rose-500/40 bg-rose-500/10" : 
           team ? cn("border-white/15 bg-zinc-800 shadow-md hover:bg-zinc-700/80", border) : "border-white/20 hover:border-white/40 border-dashed bg-zinc-800/40 shadow-inner",
           slot.clashType === 'x-one' && slot.resultStatus === 'unknown' && "border-amber-500/30 bg-amber-500/5",
           slot.clashType === 'x-fail' && slot.resultStatus === 'unknown' && "border-rose-500/30 bg-rose-500/5",
           slot.clashType === 'x-pass' && slot.resultStatus === 'unknown' && "border-emerald-500/30 bg-emerald-500/5"
        )}
     >
        {slot.resultStatus === 'correct' && <CheckCircle2 className="absolute -top-1.5 -right-1.5 text-emerald-400 w-3 h-3 sm:w-4 sm:h-4 bg-black rounded-full z-20" />}
        {slot.resultStatus === 'incorrect' && <XCircle className="absolute -top-1.5 -right-1.5 text-rose-500 w-3 h-3 sm:w-4 sm:h-4 bg-black rounded-full z-20" />}
        
        {slot.resultStatus === 'unknown' && slot.clashType === 'x-one' && (
            <Swords className="absolute -top-1.5 -right-1.5 text-amber-500 w-3 h-3 sm:w-4 sm:h-4 bg-black rounded-full z-20 p-[1px] sm:p-[2px]" title="内战：这两支选择队伍中必定有一支正确，一支错误" />
        )}
        {slot.resultStatus === 'unknown' && slot.clashType === 'x-fail' && (
            <AlertCircle className="absolute -top-1.5 -right-1.5 text-rose-500 w-3 h-3 sm:w-4 sm:h-4 bg-black rounded-full z-20" title="内战：这两支选择队伍中必定有一支会错误，仅可能存活一支" />
        )}
        {slot.resultStatus === 'unknown' && slot.clashType === 'x-pass' && (
            <CheckCircle2 className="absolute -top-1.5 -right-1.5 text-emerald-500 w-3 h-3 sm:w-4 sm:h-4 bg-black rounded-full z-20 opacity-80" title="内战：这两支选择队伍中必定有一支会正确晋级" />
        )}

        {team ? (
           <div className={cn("flex flex-col items-center justify-center animate-in zoom-in-95 duration-200 overflow-hidden", isXs ? "w-5 h-5 sm:w-6 sm:h-6" : isSm ? "w-7 h-7 sm:w-8 sm:h-8" : "w-[2.375rem] h-[2.375rem] md:w-[46px] md:h-[46px]")}>
              <TeamLogo team={team} fallbackClasses={cn("rounded-[8px]", isXs ? "text-[5px] sm:text-[6px]" : "text-[8px] sm:text-[10px]")} />
           </div>
        ) : slot.resultStatus === 'unknown' ? (
           <span className={cn("font-black tracking-widest transition-opacity opacity-50 group-hover:opacity-60 text-zinc-500", isXs ? "text-sm sm:text-lg" : isSm ? "text-lg sm:text-xl" : "text-2xl md:text-3xl")}>?</span>
        ) : (
           <span className={cn("font-medium transition-opacity opacity-20 group-hover:opacity-40 text-zinc-400 cursor-copy", isXs ? "text-[6px] sm:text-[8px]" : isSm ? "text-[10px] sm:text-xs" : "text-sm")}>
               <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
           </span>
        )}
     </div>
  );
};
