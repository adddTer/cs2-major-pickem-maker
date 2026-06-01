import React from 'react';
import { PickSlot } from '../types';
import { SlotBox } from './SlotBox';
import { TEAMS } from '../data/teams';

export const MiniPicksDisplay: React.FC<{
    title30: string;
    slots30: (PickSlot & { resultStatus?: 'correct'|'incorrect'|'unknown' })[];
    titleAdvance: string;
    slotsAdvance: (PickSlot & { resultStatus?: 'correct'|'incorrect'|'unknown' })[];
    title03: string;
    slots03: (PickSlot & { resultStatus?: 'correct'|'incorrect'|'unknown' })[];
    onSlotClick?: (slotId: string, teamId: string | null) => void;
    readOnly?: boolean;
    compact?: boolean;
    showTeamNames?: boolean;
    isExport?: boolean;
}> = ({ title30, slots30, titleAdvance, slotsAdvance, title03, slots03, onSlotClick, readOnly = true, compact = false, showTeamNames = false, isExport = false }) => {
    
    const renderSlot = (s: PickSlot & { resultStatus?: 'correct'|'incorrect'|'unknown' }, i: number) => (
        <div key={s.id || i} className={`flex items-center gap-1.5 flex-col ${isExport ? 'w-[44px]' : 'w-[36px] sm:w-[44px]'}`}>
            <SlotBox slot={s} border="border-white/10" readOnly={readOnly} size={compact ? "xs" : "sm"} onClick={onSlotClick} />
            {showTeamNames && s.teamId && (
                <div className="text-[9px] text-center font-bold text-zinc-400 break-words leading-[1.1] max-w-full truncate">{TEAMS.find(t => t.id === s.teamId)?.shortName}</div>
            )}
        </div>
    );

    return (
    <div className="w-full overflow-x-auto pt-3 pr-3 pb-2 pl-1 custom-scrollbar">
        <div className={`flex w-max ${compact ? (isExport ? 'gap-2 items-start flex-nowrap' : 'gap-2 sm:gap-3 items-start flex-nowrap') : (isExport ? 'gap-4 items-start flex-nowrap justify-start' : 'gap-3 sm:gap-4 items-start flex-nowrap justify-start')}`}>
            <div className={`flex flex-col shrink-0 ${compact ? (isExport ? 'gap-1' : 'gap-0.5 sm:gap-1') : (isExport ? 'gap-2' : 'gap-1.5 sm:gap-2')}`}>
            {slots30.some(p => p.teamId || p.resultStatus === 'unknown') ? (
                <>
                    {!compact && <span className={`font-bold text-emerald-400 whitespace-nowrap ${isExport ? 'text-[10px] text-left' : 'text-[9px] sm:text-[10px] text-center sm:text-left'}`}>{title30}</span>}
                    <div className={`flex flex-wrap ${isExport ? 'justify-start' : 'justify-center sm:justify-start'} ${compact ? (isExport ? 'gap-1' : 'gap-1') : (isExport ? 'gap-1.5' : 'gap-1.5')}`}>
                        {slots30.map(renderSlot)}
                    </div>
                </>
            ) : (
                <span className="text-[10px] text-zinc-600 font-bold py-2 italic opacity-60">暂无</span>
            )}
        </div>
        <div className={`${isExport ? 'block' : 'hidden sm:block'} w-px bg-white/5 self-stretch ${compact ? 'my-1' : ''}`}></div>
        <div className={`flex flex-col ${compact ? (isExport ? 'gap-1' : 'gap-0.5 sm:gap-1') : (isExport ? 'gap-2' : 'gap-1.5 sm:gap-2')}`}>
            {slotsAdvance.some(p => p.teamId || p.resultStatus === 'unknown') ? (
                <>
                    {!compact && <span className={`font-bold text-blue-400 whitespace-nowrap ${isExport ? 'text-[10px] text-left' : 'text-[9px] sm:text-[10px] text-center sm:text-left'}`}>{titleAdvance}</span>}
                    <div className={`flex flex-wrap ${isExport ? 'justify-start' : 'justify-center sm:justify-start'} ${compact ? (isExport ? 'gap-1' : 'gap-1') : (isExport ? 'gap-1.5' : 'gap-1.5')}`}>
                        {slotsAdvance.map(renderSlot)}
                    </div>
                </>
            ) : (
                <span className="text-[10px] text-zinc-600 font-bold py-2 italic opacity-60">暂无</span>
            )}
        </div>
        <div className={`${isExport ? 'block' : 'hidden sm:block'} w-px bg-white/5 self-stretch ${compact ? 'my-1' : ''}`}></div>
        <div className={`flex shrink-0 flex-col ${compact ? (isExport ? 'gap-1' : 'gap-0.5 sm:gap-1') : (isExport ? 'gap-2' : 'gap-1.5 sm:gap-2')}`}>
            {slots03.some(p => p.teamId || p.resultStatus === 'unknown') ? (
                <>
                    {!compact && <span className={`font-bold text-rose-400 whitespace-nowrap ${isExport ? 'text-[10px] text-left' : 'text-[9px] sm:text-[10px] text-center sm:text-left'}`}>{title03}</span>}
                    <div className={`flex flex-wrap ${isExport ? 'justify-start' : 'justify-center sm:justify-start'} ${compact ? (isExport ? 'gap-1' : 'gap-1') : (isExport ? 'gap-1.5' : 'gap-1.5')}`}>
                        {slots03.map(renderSlot)}
                    </div>
                </>
            ) : (
                <span className="text-[10px] text-zinc-600 font-bold py-2 italic opacity-60">暂无</span>
            )}
        </div>
        </div>
    </div>
)};
