import React from 'react';
import { PickSlot } from '../types';
import { cn } from '../lib/utils';
import { SlotBox } from './SlotBox';

export const PickEmDock: React.FC<{ 
  slots: PickSlot[], 
  readOnly?: boolean, 
  showResults?: boolean, 
  onToggleResults?: () => void,
  onDrop?: (e: React.DragEvent, slotId: string) => void,
  onClick?: (slotId: string, teamId: string | null) => void,
}> = ({ slots, readOnly = false, showResults = false, onToggleResults, onDrop, onClick }) => {
  let displaySlots = slots;
  if (showResults) {
    const combinedSlots: (PickSlot & { resultStatus?: 'correct' | 'incorrect' | 'unknown' })[] = [];
    let i = 0;
    for (let j = 0; j < 2; j++) combinedSlots.push({ id: `r30-${i++}`, type: '3-0', teamId: undefined, resultStatus: 'unknown' });
    for (let j = 0; j < 6; j++) combinedSlots.push({ id: `ra-${i++}`, type: 'advance', teamId: undefined, resultStatus: 'unknown' });
    for (let j = 0; j < 2; j++) combinedSlots.push({ id: `r03-${i++}`, type: '0-3', teamId: undefined, resultStatus: 'unknown' });
    displaySlots = combinedSlots;
    readOnly = true;
  }

  const slots30 = displaySlots.filter(s => s.type === '3-0');
  const slotsAdv = displaySlots.filter(s => s.type === 'advance');
  const slots03 = displaySlots.filter(s => s.type === '0-3');

  return (
      <div className="w-full relative">
          {onToggleResults && (
              <div className="flex justify-end mb-3 z-10 w-full max-w-[1400px] mx-auto">
                  <button
                    onClick={onToggleResults}
                    className={cn("px-3 py-1.5 border border-white/10 rounded-[3px] transition-colors text-[11px] font-bold", showResults ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "hover:bg-white/10 text-zinc-400")}
                  >
                    {showResults ? "隐藏实际赛果" : "展示比赛结果"}
                  </button>
              </div>
          )}
          <div className="flex flex-col xl:flex-row w-full max-w-[1400px] mx-auto gap-3 sm:gap-4">
          {/* 3:0 (2 Slots) */}
          <div className="flex-1 flex flex-col bg-zinc-900/60 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5 relative">
              <div className="px-4 py-2 sm:py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex flex-col items-center rounded-t-xl">
                  <span className="text-emerald-400 font-black tracking-widest text-[14px] sm:text-[16px] leading-tight">3:0</span>
                  <span className="text-emerald-500/70 text-[10px] sm:text-[11px] font-bold">全胜晋级</span>
              </div>
              <div className="p-3 sm:p-5 flex gap-3 sm:gap-5 justify-center flex-1 items-center bg-zinc-950/40 rounded-b-xl">
                  {slots30.map(s => <SlotBox key={s.id} slot={s} readOnly={readOnly} border="border-emerald-500/30" onDrop={onDrop} onClick={onClick} />)}
              </div>
          </div>
          
          {/* Advance (6 Slots) */}
          <div className="flex-[2.5] flex flex-col bg-zinc-900/60 rounded-xl border border-blue-500/20 shadow-lg shadow-blue-500/5 relative">
              <div className="px-4 py-2 sm:py-3 bg-blue-500/10 border-b border-blue-500/20 flex flex-col items-center rounded-t-xl">
                  <span className="text-blue-400 font-black tracking-widest text-[14px] sm:text-[16px] leading-tight">3:1 / 3:2</span>
                  <span className="text-blue-500/70 text-[10px] sm:text-[11px] font-bold">晋级</span>
              </div>
              <div className="p-3 sm:p-5 flex flex-wrap gap-3 sm:gap-5 justify-center flex-1 items-center bg-zinc-950/40 rounded-b-xl">
                  {slotsAdv.map(s => <SlotBox key={s.id} slot={s} readOnly={readOnly} border="border-blue-500/30" onDrop={onDrop} onClick={onClick} />)}
              </div>
          </div>
          
          {/* 0:3 (2 Slots) */}
          <div className="flex-1 flex flex-col bg-zinc-900/60 rounded-xl border border-rose-500/20 shadow-lg shadow-rose-500/5 relative">
              <div className="px-4 py-2 sm:py-3 bg-rose-500/10 border-b border-rose-500/20 flex flex-col items-center rounded-t-xl">
                  <span className="text-rose-400 font-black tracking-widest text-[14px] sm:text-[16px] leading-tight">0:3</span>
                  <span className="text-rose-500/70 text-[10px] sm:text-[11px] font-bold">全败淘汰</span>
              </div>
              <div className="p-3 sm:p-5 flex gap-3 sm:gap-5 justify-center flex-1 items-center bg-zinc-950/40 rounded-b-xl">
                  {slots03.map(s => <SlotBox key={s.id} slot={s} readOnly={readOnly} border="border-rose-500/30" onDrop={onDrop} onClick={onClick} />)}
              </div>
          </div>
      </div>
      </div>
  );
};
