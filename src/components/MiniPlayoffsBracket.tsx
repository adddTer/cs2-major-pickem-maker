import React from 'react';
import { PickSlot } from '../types';
import { cn } from '../lib/utils';
import { TeamLogo } from './TeamLogo';
import { TEAMS } from '../data/teams';
import { CheckCircle2, XCircle } from 'lucide-react';

const MiniSlotBox = ({ slot, compact, showTeamNames }: { slot: PickSlot & { resultStatus?: 'correct'|'incorrect'|'unknown' }, compact?: boolean, showTeamNames?: boolean }) => {
    const team = TEAMS.find(t => t.id === slot.teamId);
    const showName = !compact || showTeamNames;
    return (
        <div className={cn(
            "flex items-center gap-1.5 border border-white/5 rounded mx-auto relative overflow-hidden bg-black/40",
            showName && team ? (compact ? "p-1 h-6 w-20" : "p-1.5 h-8 w-24") : (compact ? "p-1 h-6 w-12" : "p-1.5 h-8 w-16")
        )}>
            {slot.resultStatus === 'correct' && <CheckCircle2 className="absolute -top-1 -right-1 text-emerald-400 w-3 h-3 bg-black rounded-full z-20" />}
            {slot.resultStatus === 'incorrect' && <XCircle className="absolute -top-1 -right-1 text-rose-500 w-3 h-3 bg-black rounded-full z-20" />}
            
            {team ? (
                <>
                   <div className={cn("flex items-center justify-center shrink-0 pointer-events-none rounded-sm overflow-hidden", compact ? "w-4 h-4 ml-0.5" : "w-5 h-5 ml-1")}>
                       <TeamLogo team={team} fallbackClasses={compact ? "text-[6px]" : "text-[8px]"} />
                   </div>
                   {showName && <span className="text-[9px] font-bold text-zinc-300 truncate leading-tight tracking-widest">{team.shortName}</span>}
                </>
            ) : slot.resultStatus === 'unknown' ? (
                <span className={cn("m-auto font-black tracking-widest opacity-30 text-zinc-500", compact ? "text-[10px]" : "text-xs")}>?</span>
            ) : (
                <span className={cn("m-auto opacity-10 text-zinc-400", compact ? "text-[6px]" : "text-[10px]")}>
                    <div className="w-1 h-1 rounded-full bg-current"></div>
                </span>
            )}
        </div>
    );
};

export const MiniPlayoffsBracket: React.FC<{
    slots: (PickSlot & { resultStatus?: 'correct'|'incorrect'|'unknown' })[];
    compact?: boolean;
    showTeamNames?: boolean;
}> = ({ slots, compact, showTeamNames }) => {
    const getSlot = (id: string) => slots.find(s => s.id.includes(id)) || { id, type: 'qf', teamId: null } as PickSlot;

    const renderMatch = (slot1Id: string, slot2Id: string) => (
        <div className="flex flex-col gap-1 w-full shrink-0">
            <MiniSlotBox slot={getSlot(slot1Id)} compact={compact} showTeamNames={showTeamNames} />
            <MiniSlotBox slot={getSlot(slot2Id)} compact={compact} showTeamNames={showTeamNames} />
        </div>
    );

    return (
        <div className="w-full overflow-x-auto custom-scrollbar pb-1">
            <div className={cn("flex flex-1 items-center justify-between pointer-events-none pb-2 bg-black/20 rounded-lg inset-shadow-sm min-w-[320px]", compact ? "min-h-[140px] px-2" : "min-h-[220px] px-4")}>
                 {/* QF */}
                 <div className={cn("flex flex-col justify-around h-full z-10 w-[70px] sm:w-[70px] xl:w-24 shrink-0", compact ? "gap-2" : "gap-4")}>
                 {renderMatch('qf-1', 'qf-2')}
                 {renderMatch('qf-3', 'qf-4')}
                 {renderMatch('qf-5', 'qf-6')}
                 {renderMatch('qf-7', 'qf-8')}
             </div>
             
             {/* connector */}
             <div className="w-4 h-full relative xl:w-8 shrink-0">
                  <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
                      <path d="M 0 12.5 L 50 12.5 L 50 37.5 L 100 37.5" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
                      <path d="M 0 87.5 L 50 87.5 L 50 62.5 L 100 62.5" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
                  </svg>
             </div>

             {/* SF */}
             <div className={cn("flex flex-col justify-around h-full z-10 w-[70px] xl:w-24 shrink-0 px-2", compact ? "py-[20px]" : "py-[40px]")}>
                 {renderMatch('sf-1', 'sf-2')}
                 {renderMatch('sf-3', 'sf-4')}
             </div>

               {/* connector */}
             <div className="w-4 h-full relative xl:w-8 shrink-0">
                  <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
                      <path d="M 0 25 L 50 25 L 50 50 L 100 50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
                      <path d="M 0 75 L 50 75 L 50 50 L 100 50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
                  </svg>
             </div>

             {/* FINAL */}
             <div className={cn("flex flex-col justify-center h-full z-10 w-[70px] xl:w-24 shrink-0 px-2", compact ? "" : "")}>
                 {renderMatch('final-1', 'final-2')}
             </div>

              {/* connector */}
             <div className="w-4 h-full relative xl:w-8 shrink-0">
                  <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
                      <path d="M 0 50 L 100 50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
                  </svg>
             </div>

             {/* CHAMPION */}
             <div className={cn("flex flex-col justify-center h-full z-10 w-[80px] xl:w-28 shrink-0 relative", compact ? "scale-[1.1] ml-2" : "scale-125 ml-4")}>
                 <div className={cn("absolute text-yellow-500/80 font-black tracking-widest text-center w-full", compact ? "-top-2 text-[8px]" : "-top-5 text-[10px]")}>CHAMPION</div>
                 <MiniSlotBox slot={getSlot('champion')} compact={compact} showTeamNames={showTeamNames} />
             </div>
        </div>
        </div>
    );
};
