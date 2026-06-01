import React from 'react';
import { PickSlot } from '../types';
import { cn } from '../lib/utils';
import { SlotBox } from './SlotBox';
import { TEAMS } from '../data/teams';

export const MiniPlayoffsBracket: React.FC<{
    slots: (PickSlot & { resultStatus?: 'correct'|'incorrect'|'unknown' })[];
    compact?: boolean;
    showTeamNames?: boolean;
    isExport?: boolean;
}> = ({ slots, compact, showTeamNames, isExport = false }) => {
    
    const renderSlot = (s: PickSlot & { resultStatus?: 'correct'|'incorrect'|'unknown' }, i: number) => (
        <div key={s.id || i} className={`flex items-center gap-1.5 flex-col ${isExport ? 'w-[44px]' : 'w-[36px] sm:w-[44px]'}`}>
            <SlotBox slot={s} border="border-white/10" readOnly={true} size={compact ? "xs" : "sm"} />
            {showTeamNames && s.teamId && (
                <div className="text-[9px] text-center font-bold text-zinc-400 break-words leading-[1.1] max-w-full truncate">{TEAMS.find(t => t.id === s.teamId)?.shortName}</div>
            )}
        </div>
    );

    const sfSlots = slots.filter(s => s.id.includes('sf-'));
    const finalSlots = slots.filter(s => s.id.includes('final-'));
    const champSlot = slots.filter(s => s.id.includes('champion'));

    return (
        <div className="w-full overflow-x-auto pt-2 pr-2 pb-2 custom-scrollbar">
            <div className={`flex w-max ${compact ? (isExport ? 'gap-2 items-start flex-nowrap' : 'gap-2 sm:gap-3 items-start flex-nowrap') : (isExport ? 'gap-4 items-start flex-nowrap justify-start' : 'gap-3 sm:gap-4 items-start flex-nowrap justify-start')}`}>
            {/* 1/4决赛胜者 (4 Slots) */}
            <div className={`flex flex-col shrink-0 ${compact ? (isExport ? 'gap-1' : 'gap-0.5 sm:gap-1') : (isExport ? 'gap-2' : 'gap-1.5 sm:gap-2')}`}>
                {sfSlots.some(p => p.teamId || p.resultStatus === 'unknown') ? (
                    <>
                        {!compact && <span className={`font-bold text-zinc-400 whitespace-nowrap ${isExport ? 'text-[10px] text-left' : 'text-[9px] sm:text-[10px] text-center sm:text-left'}`}>1/4 决赛胜者</span>}
                        <div className={`flex flex-wrap ${isExport ? 'justify-start' : 'justify-center sm:justify-start'} ${compact ? (isExport ? 'gap-1' : 'gap-1') : (isExport ? 'gap-1.5' : 'gap-1.5')}`}>
                            {sfSlots.map(renderSlot)}
                        </div>
                    </>
                ) : (
                    <span className="text-[10px] text-zinc-600 font-bold py-2 italic opacity-60">暂无</span>
                )}
            </div>

            <div className={`${isExport ? 'block' : 'hidden sm:block'} w-px bg-white/5 self-stretch ${compact ? 'my-1' : ''}`}></div>

            {/* 半决赛胜者 (2 Slots) */}
            <div className={`flex flex-col shrink-0 ${compact ? (isExport ? 'gap-1' : 'gap-0.5 sm:gap-1') : (isExport ? 'gap-2' : 'gap-1.5 sm:gap-2')}`}>
                {finalSlots.some(p => p.teamId || p.resultStatus === 'unknown') ? (
                    <>
                        {!compact && <span className={`font-bold text-blue-400 whitespace-nowrap ${isExport ? 'text-[10px] text-left' : 'text-[9px] sm:text-[10px] text-center sm:text-left'}`}>半决赛胜者</span>}
                        <div className={`flex flex-wrap ${isExport ? 'justify-start' : 'justify-center sm:justify-start'} ${compact ? (isExport ? 'gap-1' : 'gap-1') : (isExport ? 'gap-1.5' : 'gap-1.5')}`}>
                            {finalSlots.map(renderSlot)}
                        </div>
                    </>
                ) : (
                    <span className="text-[10px] text-zinc-600 font-bold py-2 italic opacity-60">暂无</span>
                )}
            </div>

            <div className={`${isExport ? 'block' : 'hidden sm:block'} w-px bg-white/5 self-stretch ${compact ? 'my-1' : ''}`}></div>

            {/* 冠军 (1 Slot) */}
            <div className={`flex shrink-0 flex-col ${compact ? (isExport ? 'gap-1' : 'gap-0.5 sm:gap-1') : (isExport ? 'gap-2' : 'gap-1.5 sm:gap-2')}`}>
                {champSlot.some(p => p.teamId || p.resultStatus === 'unknown') ? (
                    <>
                        {!compact && <span className={`font-bold text-yellow-500 whitespace-nowrap ${isExport ? 'text-[10px] text-left' : 'text-[9px] sm:text-[10px] text-center sm:text-left'}`}>冠军</span>}
                        <div className={`flex flex-wrap ${isExport ? 'justify-start' : 'justify-center sm:justify-start'} ${compact ? (isExport ? 'gap-1' : 'gap-1') : (isExport ? 'gap-1.5' : 'gap-1.5')}`}>
                            {champSlot.map(renderSlot)}
                        </div>
                    </>
                ) : (
                    <span className="text-[10px] text-zinc-600 font-bold py-2 italic opacity-60">暂无</span>
                )}
            </div>
            </div>
        </div>
    );
};
