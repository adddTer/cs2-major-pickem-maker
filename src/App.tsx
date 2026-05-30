import React, { useState } from 'react';
import { TEAMS, INITIAL_SLOTS } from './data/teams';
import { PickSlot, Team, SlotType } from './types';
import { cn } from './lib/utils';
import { Check, Trophy, CalendarDays, RefreshCw, Clock } from 'lucide-react';

const TeamLogo = ({ team, fallbackClasses = "" }: { team: Team, fallbackClasses?: string }) => {
  const [imgFailed, setImgFailed] = useState(false);
  if (!team.logo || imgFailed) {
    return (
      <div 
        className={cn("flex flex-col items-center justify-center font-bold tracking-tighter w-full h-full text-center overflow-hidden rounded-[2px]", fallbackClasses)}
        style={{ backgroundColor: team.color, color: team.textColor }}
      >
        <span className="text-[9px] leading-tight px-0.5 break-all">{team.shortName}</span>
      </div>
    );
  }
  return <img src={team.logo} alt={team.name} className="max-w-full max-h-full object-contain filter drop-shadow-md p-[2px]" onError={() => setImgFailed(true)} />;
};

const MissionItem = ({ active = false, completed = false, text, icon: Icon = Check }: any) => {
  return (
     <div className={cn("flex items-start gap-3 py-2 px-3 transition-colors", active ? "bg-[#1f2b23] rounded-sm" : "")}>
        <div className={cn(
            "w-5 h-5 mt-0.5 flex items-center justify-center rounded-[3px] shrink-0", 
            completed ? "bg-[#2da350] text-[#0d1712]" : "bg-[#18231c] border border-gray-600 border-dashed text-gray-500"
        )}>
            {completed ? <Check className="w-3.5 h-3.5 font-bold" strokeWidth={3} /> : <Icon className="w-3 h-3" />}
        </div>
        <span className={cn("text-[11px] font-medium leading-[1.4]", completed || active ? "text-gray-200" : "text-gray-500")}>
           {text}
        </span>
     </div>
  );
}

const SwissBracket = () => {
  const BoxGroup = ({ score, count }: { score: string, count: number }) => (
    <div className="flex flex-col gap-1.5 relative items-center">
      <span className="absolute -top-4 right-0 text-[9px] text-gray-500 italic font-mono opacity-80">{score}</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[48px] h-[20px] bg-[#121c16] border border-white/5 rounded-[2px] flex items-center justify-center text-[7px] text-gray-500/40 shadow-inner">
          ? 对阵 ?
        </div>
      ))}
    </div>
  );

  return (
     <div className="flex-1 flex flex-col justify-center px-4 w-full h-full max-h-[500px] overflow-hidden my-auto pointer-events-none opacity-60">
       <div className="flex items-center justify-center gap-10 opacity-80 h-full w-full">
          <div className="flex flex-col justify-around h-[90%]"><BoxGroup score="0:0" count={8} /></div>
          <div className="flex flex-col justify-around h-[65%]"><BoxGroup score="1:0" count={4} /><BoxGroup score="0:1" count={4} /></div>
          <div className="flex flex-col justify-around h-[85%]"><BoxGroup score="2:0" count={2} /><BoxGroup score="1:1" count={4} /><BoxGroup score="0:2" count={2} /></div>
          <div className="flex flex-col justify-around h-[65%]"><BoxGroup score="2:1" count={3} /><BoxGroup score="1:2" count={3} /></div>
          <div className="flex flex-col justify-around h-[40%]"><BoxGroup score="2:2" count={3} /></div>
       </div>
     </div>
  );
};

export default function App() {
  type StageKey = 'stage1' | 'stage2' | 'stage3' | 'playoffs';
  const [activeStage, setActiveStage] = useState<StageKey>('stage1');
  const [picks, setPicks] = useState<Record<string, PickSlot[]>>({
    stage1: INITIAL_SLOTS.map(s => ({ ...s, id: `s1-${s.id}` })),
    stage2: INITIAL_SLOTS.map(s => ({ ...s, id: `s2-${s.id}` })),
    stage3: INITIAL_SLOTS.map(s => ({ ...s, id: `s3-${s.id}` })),
  });

  const getAvailableTeams = (stage: string) => {
    if (stage === 'playoffs') return [];

    if (stage === 'stage1') {
      return TEAMS.filter(t => t.startStage === 1);
    }
    if (stage === 'stage2') {
      const s1AdvancedIds = picks.stage1.filter(s => (s.type === '3-0' || s.type === 'advance') && s.teamId).map(s => s.teamId);
      const s1Advanced = TEAMS.filter(t => s1AdvancedIds.includes(t.id));
      const s2Direct = TEAMS.filter(t => t.startStage === 2);
      return [...s1Advanced, ...s2Direct];
    }
    if (stage === 'stage3') {
      const s2AdvancedIds = picks.stage2.filter(s => (s.type === '3-0' || s.type === 'advance') && s.teamId).map(s => s.teamId);
      const s2Advanced = TEAMS.filter(t => s2AdvancedIds.includes(t.id));
      const s3Direct = TEAMS.filter(t => t.startStage === 3);
      return [...s2Advanced, ...s3Direct];
    }
    return [];
  };

  const currentPoolTeams = getAvailableTeams(activeStage);
  const currentSlots = picks[activeStage] || [];
  
  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    if (activeStage === 'playoffs') return;
    const teamId = e.dataTransfer.getData('teamId');
    if (!teamId) return;
    
    if (!currentPoolTeams.find(t => t.id === teamId)) return;

    setPicks(prev => {
        const nextStage = [...prev[activeStage]];
        const existingIdx = nextStage.findIndex(s => s.teamId === teamId);
        const targetIdx = nextStage.findIndex(s => s.id === slotId);
        
        if (existingIdx !== -1) {
            nextStage[existingIdx] = { ...nextStage[existingIdx], teamId: nextStage[targetIdx].teamId };
        }
        
        nextStage[targetIdx] = { ...nextStage[targetIdx], teamId };
        return { ...prev, [activeStage]: nextStage };
    });
  };

  const handleClear = (slotId: string) => {
      if (activeStage === 'playoffs') return;
      setPicks(prev => {
          const nextStage = prev[activeStage].map(s => s.id === slotId ? { ...s, teamId: null } : s);
          return { ...prev, [activeStage]: nextStage };
      });
  };

  const SlotBox: React.FC<{ slot: PickSlot, border: string }> = ({ slot, border }) => {
    const team = TEAMS.find(t => t.id === slot.teamId);
    return (
       <div 
          onDrop={(e) => handleDrop(e, slot.id)} 
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onClick={() => team && handleClear(slot.id)}
          className={cn(
             "w-10 h-10 bg-black/40 border rounded-[3px] flex items-center justify-center hover:bg-white/5 cursor-pointer transition-colors shadow-inner", 
             team ? cn("border-transparent", border) : "border-white/10"
          )}
       >
          {team ? (
             <div className="w-8 h-8 flex items-center justify-center animate-in zoom-in duration-200">
                <TeamLogo team={team} fallbackClasses="rounded-[2px]" />
             </div>
          ) : (
             <span className="text-[9px] text-gray-600 font-bold opacity-30">?</span>
          )}
       </div>
    );
  };

  const SlotGroup: React.FC<{ title: string, type: SlotType, color: string, border: string }> = ({ title, type, color, border }) => {
    const groupSlots = currentSlots.filter(s => s.type === type);
    return (
      <div className="flex flex-col items-end gap-1.5 mb-2 w-full">
         <div className={cn("text-[9px] font-bold tracking-wider py-1 px-3 rounded-md min-w-[70px] text-center shadow-lg", color)}>
            {title}
         </div>
         <div className="flex gap-1.5 flex-wrap justify-end w-[140px]">
            {groupSlots.map(s => <SlotBox key={s.id} slot={s} border={border} />)}
         </div>
      </div>
    );
  };

  const MockGroup: React.FC<{ title: string, count: number }> = ({ title, count }) => (
    <div className="flex flex-col items-end gap-1.5 mb-2 w-full opacity-60">
       <div className="text-[9px] font-bold tracking-wider py-1 px-3 rounded-md min-w-[70px] text-center bg-black/60 text-gray-500 shadow-md">
          {title}
       </div>
       <div className="flex gap-1.5 flex-wrap justify-end w-[140px]">
          {Array.from({length: count}).map((_, i) => (
             <div key={i} className="w-10 h-10 bg-[#121c16]/50 border border-white/5 rounded-[3px] flex items-center justify-center cursor-not-allowed shadow-inner">
               <span className="text-[9px] text-gray-700 font-bold opacity-30">?</span>
             </div>
          ))}
       </div>
    </div>
  );

  return (
    <>
      <style>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
      
      <div className="min-h-screen bg-[#070b09] text-gray-200 font-sans flex flex-col items-center justify-center relative overflow-hidden select-none">
        {/* CS2 Background Aesthetics */}
        <div className="fixed inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#2a4030 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#070b09]/60 to-[#070b09] pointer-events-none"></div>

        {/* Outer App Container */}
        <div className="w-full max-w-[1400px] h-screen lg:h-[800px] max-h-screen relative z-10 flex flex-col lg:flex-row gap-6 p-4">
          
          {/* Left Sidebar */}
          <div className="w-full lg:w-[320px] flex flex-col bg-[#111a14]/90 border border-[#24352a]/60 rounded-[4px] shrink-0 shadow-2xl relative backdrop-blur-md">
             <div className="p-6 bg-gradient-to-b from-[#18281e] to-transparent shrink-0">
                <h2 className="text-[17px] font-bold tracking-wide mb-6 text-gray-100 flex items-center gap-2">
                  赛事竞猜挑战
                </h2>
                <div className="flex flex-col items-center justify-center py-2 relative">
                   <div className="w-40 h-40 rounded-full border-4 border-yellow-600/30 bg-gradient-to-br from-yellow-500/20 to-[#422e0a]/80 shadow-[0_0_40px_rgba(202,138,4,0.1)] flex flex-col items-center justify-center relative z-10">
                       <Trophy className="w-16 h-16 text-yellow-500 opacity-90 drop-shadow-md mb-2" />
                       <div className="absolute -bottom-3 bg-[#0a120e] text-orange-200 px-3 py-1 text-[10px] font-black tracking-widest border border-yellow-600/30 rounded shadow-md">
                          CS2 MAJOR
                       </div>
                   </div>
                </div>
                <div className="mt-8 flex items-center gap-3">
                   <div className="w-7 h-7 rounded bg-[#a26824] flex items-center justify-center font-bold text-[#0d120f] shadow-inner text-sm shrink-0">
                     3
                   </div>
                   <p className="text-[11px] text-gray-300 font-medium leading-tight">
                     个挑战完成后升级硬币并获得 +300 代币。
                   </p>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-1 z-10">
                {/* 留空，以待未来其它UI */}
             </div>
          </div>

          {/* Right Main Pick'Em Board */}
          <div className="flex-1 flex flex-col bg-[#111a14]/90 border border-[#24352a]/60 rounded-[4px] shadow-2xl relative backdrop-blur-md overflow-hidden">
             
             {/* Tabs Header */}
             <div className="h-12 border-b border-white/5 flex items-center px-4 justify-between bg-black/20 shrink-0">
                <div className="flex bg-[#070b09] p-1 rounded gap-0.5">
                  {[
                     { id: 'stage1', label: '第一阶段' },
                     { id: 'stage2', label: '第二阶段' },
                     { id: 'stage3', label: '第三阶段' },
                     { id: 'playoffs', label: '决胜阶段' }
                  ].map(tab => {
                     const isActive = activeStage === tab.id;
                     return (
                       <div 
                         key={tab.id}
                         onClick={() => setActiveStage(tab.id as StageKey)}
                         className={cn(
                           "px-3 py-1.5 rounded-[2px] text-[11px] font-bold cursor-pointer transition-colors flex items-center",
                           isActive ? "bg-[#425a4c]/50 text-emerald-100" : "text-gray-400 hover:text-gray-200"
                         )}
                       >
                         {isActive ? (
                           <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full inline-block mr-1.5"></span>
                         ) : (
                           <span className="w-1 h-1 bg-gray-500 rounded-full inline-block mr-1.5"></span>
                         )}
                         {tab.label}
                       </div>
                     );
                  })}
                </div>
                <button className="p-1.5 border border-white/10 hover:bg-white/10 rounded-[3px] transition-colors opacity-70">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
             </div>
             
             {/* Content Area */}
             {activeStage === 'playoffs' ? (
                <div className="flex-1 flex flex-col items-center justify-center relative bg-black/40 h-full">
                  <Trophy className="w-16 h-16 text-yellow-500/30 mb-4" />
                  <p className="text-sm text-gray-500 font-bold tracking-widest">决胜阶段暂未开放</p>
                </div>
             ) : (
                <div className="flex-1 flex overflow-hidden relative">
                   
                   {/* Team Drag Source Pool */}
                   <div className="w-[180px] p-5 flex flex-col border-r border-[#24352a]/30 bg-[#0c120e]/60 shrink-0 z-10 shadow-[5px_0_15px_rgba(0,0,0,0.2)]">
                       <div className="text-[11px] font-bold text-gray-300 mb-6 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 opacity-60"/> 还剩 3 天 可以竞猜
                       </div>
                       
                       <div className="flex items-center gap-2 mb-4">
                          <div className="w-[20px] h-[20px] bg-[#1a231f] flex items-center justify-center rounded-full opacity-60">
                            <div className="w-[12px] h-[12px] border-2 border-dashed border-gray-400 rounded-full"></div>
                          </div>
                          <p className="text-[10px] text-gray-500/80 font-medium">拖动队伍做出选择</p>
                       </div>

                       {activeStage !== 'stage1' && currentPoolTeams.length < 16 && (
                          <div className="text-[10px] text-amber-500/80 mb-3 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                             请先在上一阶段选择8支晋级队伍。
                          </div>
                       )}

                       <div className="grid grid-cols-2 gap-2 flex-1 content-start overflow-y-auto">
                          {currentPoolTeams.map(team => {
                             const isPlaced = currentSlots.some(s => s.teamId === team.id);
                             return (
                                <div 
                                   key={team.id}
                                   draggable={!isPlaced}
                                   onDragStart={(e) => { e.dataTransfer.setData('teamId', team.id); e.dataTransfer.effectAllowed = 'move'; }}
                                   className={cn(
                                      "w-[60px] h-[60px] mx-auto flex items-center justify-center rounded-[4px] transition-all bg-black/10 hover:bg-white/5",
                                      isPlaced ? "opacity-15 grayscale pointer-events-none" : "cursor-grab active:cursor-grabbing hover:border-white/20 hover:shadow-md"
                                   )}
                                >
                                   <div className="w-10 h-10 filter sepia-[0.3] brightness-110">
                                      <TeamLogo team={team} fallbackClasses="rounded-[3px]" />
                                   </div>
                                </div>
                             );
                          })}
                       </div>
                   </div>
                   
                   {/* Mock Background Swiss Bracket */}
                   <div className="flex-1 min-w-[300px] flex items-center justify-center relative">
                      <SwissBracket />
                   </div>
                   
                   {/* Final Drop Target Slots */}
                   <div className="w-[220px] shrink-0 bg-[#0c120e]/40 p-4 pt-6 flex flex-col items-end overflow-y-auto z-10 shadow-[-5px_0_15px_rgba(0,0,0,0.2)]">
                      
                      <SlotGroup title="3:0 - 晋级" type="3-0" color="bg-[#112a1d] text-emerald-400" border="border-[#1b4430]" />
                      
                      <SlotGroup title="3:1 3:2 晋级" type="advance" color="bg-[#193d2b] text-emerald-200" border="border-emerald-700/50" />
                      
                      <MockGroup title="2:3 - 淘汰" count={3} />
                      
                      <MockGroup title="1:3 - 淘汰" count={3} />
                      
                      <SlotGroup title="0:3 - 淘汰" type="0-3" color="bg-[#4d131b] text-red-400" border="border-[#7a1e2b]" />
                      
                      {/* Bottom Spacer for floating button */}
                      <div className="h-20 w-full shrink-0"></div>
                   </div>

                   {/* Floating Save Button */}
                   <div className="absolute bottom-6 right-6 z-20">
                       <button className="px-5 py-2 border-2 border-[#22974b] text-[#34d16b] font-bold text-xs bg-[#0c130f]/90 hover:bg-[#22974b] hover:text-white transition-all shadow-[0_0_20px_rgba(34,151,75,0.2)] rounded-[3px] flex items-center gap-2 backdrop-blur-sm group">
                          <Check className="w-3.5 h-3.5" strokeWidth={3} /> 选择已保存
                       </button>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </>
  );
}
