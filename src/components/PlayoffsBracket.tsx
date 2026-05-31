import React from 'react';
import { PickSlot } from '../types';
import { cn } from '../lib/utils';
import { SlotBox } from './SlotBox';
import { TEAMS } from '../data/teams';

export const PlayoffsBracket: React.FC<{ 
  slots: PickSlot[], 
  readOnly?: boolean, 
  onDrop?: (e: React.DragEvent, slotId: string) => void,
  onClick?: (slotId: string, teamId: string | null) => void,
}> = ({ slots, readOnly = false, onDrop, onClick }) => {
  const getSlot = (id: string) => slots.find(s => s.id.includes(id)) || { id, type: 'qf', teamId: null } as PickSlot;

  const renderMatch = (slot1Id: string, slot2Id: string, border: string) => (
    <div className="flex flex-col gap-1 w-full relative z-10 p-4 border border-transparent shadow shadow-black/20 rounded-xl bg-zinc-950/60 backdrop-blur-sm shadow-inner transition-transform hover:scale-105">
        <SlotBox slot={getSlot(slot1Id)} readOnly={readOnly} border={border} onDrop={onDrop} onClick={onClick} />
        <SlotBox slot={getSlot(slot2Id)} readOnly={readOnly} border={border} onDrop={onDrop} onClick={onClick} />
    </div>
  );

  return (
    <div className="w-full mx-auto p-8 overflow-x-auto custom-scrollbar flex justify-center">
        <div className="flex items-stretch min-w-[800px] h-[640px] relative pointer-events-auto select-none">
            
            {/* Quarterfinals Area */}
            <div className="flex flex-col w-32 relative">
                <div className="absolute -top-8 w-full text-center font-black text-xs text-zinc-500 uppercase tracking-widest pb-2 border-b border-white/10">1/4 决赛</div>
                {[1, 3, 5, 7].map((num) => (
                    <div key={`qf-${num}`} className="flex-1 flex flex-col justify-center relative">
                        {renderMatch(`qf-${num}`, `qf-${num+1}`, 'border-white/10')}
                    </div>
                ))}
            </div>

            {/* QF to SF Connector */}
            <div className="w-10 xl:w-16 h-full relative pointer-events-none">
                <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
                    <line x1="0" y1="12.5%" x2="50%" y2="12.5%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                    <line x1="0" y1="37.5%" x2="50%" y2="37.5%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                    <line x1="50%" y1="12.5%" x2="50%" y2="37.5%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                    <line x1="50%" y1="25%" x2="100%" y2="25%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

                    <line x1="0" y1="62.5%" x2="50%" y2="62.5%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                    <line x1="0" y1="87.5%" x2="50%" y2="87.5%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                    <line x1="50%" y1="62.5%" x2="50%" y2="87.5%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                    <line x1="50%" y1="75%" x2="100%" y2="75%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                </svg>
            </div>

            {/* Semifinals Area */}
            <div className="flex flex-col w-32 relative">
                <div className="absolute -top-8 w-full text-center font-black text-xs text-blue-500/80 uppercase tracking-widest pb-2 border-b border-blue-500/20">半决赛</div>
                {[1, 3].map((num) => (
                    <div key={`sf-${num}`} className="flex-1 flex flex-col justify-center relative">
                        {renderMatch(`sf-${num}`, `sf-${num+1}`, 'border-blue-500/30')}
                    </div>
                ))}
            </div>

            {/* SF to Final Connector */}
            <div className="w-10 xl:w-16 h-full relative pointer-events-none">
                <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
                    <line x1="0" y1="25%" x2="50%" y2="25%" stroke="rgba(59,130,246,0.3)" strokeWidth="2" />
                    <line x1="0" y1="75%" x2="50%" y2="75%" stroke="rgba(59,130,246,0.3)" strokeWidth="2" />
                    <line x1="50%" y1="25%" x2="50%" y2="75%" stroke="rgba(59,130,246,0.3)" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="100%" y2="50%" stroke="rgba(59,130,246,0.3)" strokeWidth="2" />
                </svg>
            </div>

            {/* Final Area */}
            <div className="flex flex-col justify-center w-32 relative">
                <div className="absolute -top-8 w-full text-center font-black text-xs text-purple-500/80 uppercase tracking-widest pb-2 border-b border-purple-500/20">总决赛</div>
                {renderMatch('final-1', 'final-2', 'border-purple-500/50')}
            </div>

            {/* Final to Champion Connector */}
            <div className="w-10 xl:w-16 h-full relative pointer-events-none">
                <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(168,85,247,0.5)" strokeWidth="2" />
                </svg>
            </div>

            {/* Champion Area */}
            <div className="flex flex-col justify-center w-36 relative">
                <div className="absolute -top-8 w-full text-center font-black text-xs text-yellow-500/80 uppercase tracking-widest pb-2 border-b border-yellow-500/20">竞猜冠军</div>
                <div className="absolute top-[260px] w-full transform flex flex-col items-center gap-1 z-20">
                     <span className="text-yellow-500 font-black tracking-widest text-sm drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">CHAMPION</span>
                </div>
                <div className="scale-[1.3] transform origin-center z-10 mx-auto">
                    <SlotBox slot={getSlot('champion')} readOnly={readOnly} border="border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] bg-yellow-500/10" onDrop={onDrop} onClick={onClick} />
                </div>
            </div>

        </div>
    </div>
  );
};
