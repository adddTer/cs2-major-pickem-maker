import React from 'react';
import { PickSlot } from '../types';
import { cn } from '../lib/utils';
import { TEAMS } from '../data/teams';
import { TeamLogo } from './TeamLogo';
import { CheckCircle2, XCircle } from 'lucide-react';

export const SlotBox: React.FC<{ 
  slot: PickSlot & { resultStatus?: 'correct'|'incorrect'|'unknown' }, 
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
           "rounded-[12px] bg-zinc-950/50 backdrop-blur-sm shadow-inner flex items-center justify-center transition-all duration-300 group relative border shrink-0", 
           isXs ? "w-7 h-7 sm:w-8 sm:h-8 rounded-md" : isSm ? "w-9 h-9 sm:w-11 sm:h-11" : "w-[3.25rem] h-[3.25rem] md:w-[68px] md:h-[68px] z-10",
           readOnly && !slot.resultStatus ? "" : !readOnly ? "hover:bg-zinc-800/80 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg" : "",
           slot.resultStatus === 'correct' ? "border-emerald-500/60 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : 
           slot.resultStatus === 'incorrect' ? "border-rose-500/40 bg-rose-500/10" : 
           team ? cn("border-white/10", border) : "border-white/5 hover:border-white/20 border-dashed"
        )}
     >
        {slot.resultStatus === 'correct' && <CheckCircle2 className="absolute -top-1.5 -right-1.5 text-emerald-400 w-3 h-3 sm:w-4 sm:h-4 bg-black rounded-full z-20" />}
        {slot.resultStatus === 'incorrect' && <XCircle className="absolute -top-1.5 -right-1.5 text-rose-500 w-3 h-3 sm:w-4 sm:h-4 bg-black rounded-full z-20" />}
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
