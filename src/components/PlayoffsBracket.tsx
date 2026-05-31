import React from 'react';
import { PickSlot } from '../types';
import { cn } from '../lib/utils';
import { useFitScale } from '../utils/hooks';
import { TEAMS } from '../data/teams';
import { TeamLogo } from './TeamLogo';

const W = 180;
const H = 40;

const nodes: Record<string, { x: number, y: number }> = {
  'qf-1': { x: 0, y: 20 },
  'qf-2': { x: 0, y: 70 },
  'qf-3': { x: 0, y: 170 },
  'qf-4': { x: 0, y: 220 },
  'qf-5': { x: 0, y: 370 },
  'qf-6': { x: 0, y: 420 },
  'qf-7': { x: 0, y: 520 },
  'qf-8': { x: 0, y: 570 },
  'sf-1': { x: 260, y: 45 },
  'sf-2': { x: 260, y: 195 },
  'sf-3': { x: 260, y: 395 },
  'sf-4': { x: 260, y: 545 },
  'final-1': { x: 520, y: 120 },
  'final-2': { x: 520, y: 470 },
  'champion': { x: 780, y: 295 },
};

const edges = [
  ['qf-1', 'sf-1'], ['qf-2', 'sf-1'],
  ['qf-3', 'sf-2'], ['qf-4', 'sf-2'],
  ['qf-5', 'sf-3'], ['qf-6', 'sf-3'],
  ['qf-7', 'sf-4'], ['qf-8', 'sf-4'],
  ['sf-1', 'final-1'], ['sf-2', 'final-1'],
  ['sf-3', 'final-2'], ['sf-4', 'final-2'],
  ['final-1', 'champion'], ['final-2', 'champion']
];

const DrawPath: React.FC<{ fromId: string, toId: string }> = ({ fromId, toId }) => {
    const p1 = nodes[fromId];
    const p2 = nodes[toId];
    if (!p1 || !p2) return null;
    
    const sx = p1.x + W;
    const sy = p1.y + H / 2;
    const ex = p2.x;
    const ey = p2.y + H / 2;
    const midX = sx + (ex - sx) / 2;
    
    const R = 16;
    const dirY = Math.sign(ey - sy);
    const r = Math.min(R, Math.abs(ey - sy) / 2);

    let d = "";
    if (Math.abs(ey - sy) < 1) {
        d = `M ${sx} ${sy} L ${ex} ${ey}`;
    } else {
        d = `M ${sx} ${sy} L ${midX - r} ${sy} Q ${midX} ${sy} ${midX} ${sy + r * dirY} L ${midX} ${ey - r * dirY} Q ${midX} ${ey} ${midX + r} ${ey} L ${ex} ${ey}`;
    }
    
    return (
        <path 
            d={d} 
            stroke="rgba(255,255,255,0.15)" 
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
};

const BracketSlot: React.FC<{ 
    slot: PickSlot | undefined, 
    readOnly: boolean, 
    onDrop: any, 
    onClick: any, 
    emptyTitle: string 
}> = ({ slot, readOnly, onDrop, onClick, emptyTitle }) => {
    const team = TEAMS.find(t => t.id === slot?.teamId);
    
    return (
        <div 
            draggable={!readOnly && !!team}
            onDragStart={(e) => {
                if (readOnly || !team || !slot) return e.preventDefault();
                e.dataTransfer.setData('teamId', team.id);
                e.dataTransfer.setData('sourceSlotId', slot.id);
                e.dataTransfer.effectAllowed = 'copyMove';
            }}
            onDrop={readOnly ? undefined : (e) => slot && onDrop && onDrop(e, slot.id)}
            onDragOver={readOnly ? undefined : e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
            onClick={readOnly ? undefined : () => slot && onClick && onClick(slot.id, slot.teamId)}
            className={cn(
                "w-[180px] h-[40px] rounded-[6px] flex items-center px-3 gap-3 border transition-colors cursor-pointer relative overflow-hidden",
                team ? "bg-zinc-900 border-white/20 hover:border-white/40" : "bg-zinc-950/40 border-white/10 border-dashed hover:border-zinc-500",
                readOnly && !team && "opacity-60 cursor-default"
            )}
        >
            {team ? (
                <>
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                        <TeamLogo team={team} fallbackClasses="text-[10px]" />
                    </div>
                    <span className="font-bold text-zinc-200 text-sm">{team.name}</span>
                </>
            ) : (
                <span className="text-xs font-semibold mx-auto tracking-widest text-zinc-500" style={{ letterSpacing: '0.1em' }}>{emptyTitle}</span>
            )}
        </div>
    );
};

export const PlayoffsBracket: React.FC<{ 
  slots: PickSlot[], 
  readOnly?: boolean,
  onDrop?: (e: React.DragEvent, slotId: string) => void,
  onClick?: (slotId: string, teamId: string | null) => void,
}> = ({ slots, readOnly = false, onDrop, onClick }) => {
  const { containerRef, scale } = useFitScale(960, 640);

  const getSlot = (id: string) => slots.find(s => s.id === id || s.id === `playoffs-${id}`);

  return (
      <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center overflow-visible select-none z-10 min-w-0 min-h-0 relative py-8">
          <div 
             style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }} 
             className="w-[960px] h-[640px] relative pointer-events-none transition-transform duration-75 flex-shrink-0"
          >
              <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ left: 0, top: 0 }}>
                  {edges.map(([from, to], i) => <DrawPath key={i} fromId={from} toId={to} />)}
              </svg>

              {Object.entries(nodes).map(([id, pos]) => {
                  const isCol1 = id.startsWith('qf-');
                  const emptyTitle = isCol1 ? '待定' : '作出您的选择';
                  
                  return (
                      <div 
                          key={id} 
                          style={{ left: pos.x, top: pos.y }} 
                          className="absolute pointer-events-auto shadow-sm"
                      >
                          <BracketSlot 
                              slot={getSlot(id) || { id, type: id.split('-')[0] as any, teamId: null }} 
                              readOnly={readOnly} 
                              onDrop={onDrop} 
                              onClick={onClick} 
                              emptyTitle={emptyTitle} 
                          />
                      </div>
                  );
              })}
          </div>
      </div>
  );
};