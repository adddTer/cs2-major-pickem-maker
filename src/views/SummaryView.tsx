import React from 'react';
import { PickSlot, StageKey, SlotType, PickSet } from '../types';
import { cn } from '../lib/utils';
import { MiniPlayoffsBracket } from '../components/MiniPlayoffsBracket';
import { MiniPicksDisplay } from '../components/MiniPicksDisplay';
import { PickSetStatusText, getStatusStyles } from '../components/PickSetStatus';

interface SummaryViewProps {
  communityPicks: PickSet[];
  showProbabilityInSummary: boolean;
  setShowProbabilityInSummary: (val: boolean) => void;
  setImageExportIds: (ids: string[]) => void;
  setShowImageExportModal: (val: boolean) => void;
  setShowTextExportModal: (val: boolean) => void;
  activeStage: StageKey;
  setActiveStage: (val: StageKey) => void;
  ACTUAL_RESULTS: Record<string, PickSlot[]>;
  PLAYOFFS_SLOTS: PickSlot[];
  sortedCommunityPicks: PickSet[];
  getSetStatus: (picks: PickSlot[], stage: string) => any;
  itemFreq: Record<string, number>;
  checkPrediction: (teamId: string | null, type: SlotType, stage: string) => 'correct' | 'incorrect' | 'unknown';
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  communityPicks,
  showProbabilityInSummary,
  setShowProbabilityInSummary,
  setImageExportIds,
  setShowImageExportModal,
  setShowTextExportModal,
  activeStage,
  setActiveStage,
  ACTUAL_RESULTS,
  PLAYOFFS_SLOTS,
  sortedCommunityPicks,
  getSetStatus,
  itemFreq,
  checkPrediction
}) => {
  return (
    <div className="flex-1 flex flex-col bg-zinc-900/60 border border-white/5 rounded-lg shadow-xl relative backdrop-blur-md overflow-hidden">
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 shrink-0">
              <h2 className="text-sm font-bold text-zinc-100">社区竞猜详情汇总 ({communityPicks.length})</h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <button 
                      onClick={() => setShowProbabilityInSummary(!showProbabilityInSummary)}
                      className="px-3 py-1.5 bg-zinc-600/20 hover:bg-zinc-600/40 text-zinc-300 border border-zinc-500/30 text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
                  >
                      {showProbabilityInSummary ? "显示对错数量" : "显示通过概率"}
                  </button>
                  <div className="flex gap-2">
                      <button 
                          onClick={() => {
                              setImageExportIds(communityPicks.map(p => p.id));
                              setShowImageExportModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
                      >
                          导出图片
                      </button>
                      <button 
                          onClick={() => {
                              setShowTextExportModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
                      >
                          导出文本
                      </button>
                  </div>
                  <div className="flex bg-black/40 p-1 rounded-md border border-white/5 overflow-x-auto custom-scrollbar shrink-0 max-w-full">
                      {['stage1', 'stage2', 'stage3', 'playoffs'].map(tabId => {
                          const stageLabel = tabId === 'stage1' ? '第一阶段' : tabId === 'stage2' ? '第二阶段' : tabId === 'stage3' ? '第三阶段' : '决胜阶段';
                          return (
                            <div 
                              key={`sum-${tabId}`}
                              onClick={() => setActiveStage(tabId as StageKey)}
                              className={cn(
                                "px-3 py-1 text-[11px] font-bold rounded-[2px] cursor-pointer transition-colors whitespace-nowrap shrink-0",
                                activeStage === tabId ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                              )}
                            >
                              {stageLabel}
                            </div>
                          );
                      })}
                  </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 xl:grid-cols-2 gap-4 content-start">
              <div className="bg-zinc-900/80 border border-emerald-500/20 p-4 rounded-lg shadow-sm flex flex-col gap-4 xl:col-span-2">
                  <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3">
                      <h3 className="text-sm font-bold text-emerald-400 tracking-wider">实际比赛结果</h3>
                  </div>
                  {activeStage === 'playoffs' ? (
                      <MiniPlayoffsBracket 
                          slots={PLAYOFFS_SLOTS.map((s) => {
                              const sTypeIdx = PLAYOFFS_SLOTS.filter(x => x.type === s.type).findIndex(x => x.id === s.id);
                              return { 
                                  ...s, 
                                  teamId: ACTUAL_RESULTS[activeStage]?.filter((x: any) => x.type === s.type)[sTypeIdx]?.teamId || undefined, 
                                  resultStatus: 'unknown' 
                              };
                          })}
                      />
                  ) : (
                      <MiniPicksDisplay 
                          title30="3:0 晋级"
                          slots30={Array(2).fill(null).map((_, i) => ({ id: `r30-${i}`, type: '3-0' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter((s: any) => s.type === '3-0')[i]?.teamId || undefined, resultStatus: 'unknown' }))}
                          titleAdvance="3:1 3:2 晋级"
                          slotsAdvance={Array(6).fill(null).map((_, i) => ({ id: `ra-${i}`, type: 'advance' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter((s: any) => s.type === 'advance')[i]?.teamId || undefined, resultStatus: 'unknown' }))}
                          title03="0:3 淘汰"
                          slots03={Array(2).fill(null).map((_, i) => ({ id: `r03-${i}`, type: '0-3' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter((s: any) => s.type === '0-3')[i]?.teamId || undefined, resultStatus: 'unknown' }))}
                      />
                  )}
              </div>
              
              {communityPicks.length === 0 && (
                  <div className="col-span-full py-12 text-center text-zinc-500 text-sm">
                      暂无社区竞猜数据
                  </div>
              )}

              {sortedCommunityPicks.map(participant => {
                  const theirPicks = participant.picks[activeStage] || [];

                  if (activeStage === 'playoffs') {
                      return (
                          <div key={participant.id} className="bg-zinc-900/80 border border-white/5 p-4 rounded-lg shadow-sm flex flex-col gap-4">
                              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                                  <div className="font-bold text-sm text-zinc-200">{participant.name}</div>
                              </div>
                              <MiniPlayoffsBracket 
                                  slots={PLAYOFFS_SLOTS.map((s) => {
                                      const pick = theirPicks.find(p => p.id === s.id || p.id === `playoffs-${s.id}`);
                                      let teamId = pick?.teamId || null;
                                      
                                      // Auto-fill QF slots from ACTUAL_RESULTS since users don't pick them
                                      if (s.type === 'qf' && !teamId) {
                                          const qfActuals = ACTUAL_RESULTS[activeStage]?.filter((x: any) => x.type === 'qf') || [];
                                          const sTypeIdx = PLAYOFFS_SLOTS.filter(x => x.type === 'qf').findIndex(x => x.id === s.id);
                                          teamId = qfActuals[sTypeIdx]?.teamId || null;
                                      }
                                      
                                      return { ...s, teamId: teamId, resultStatus: 'unknown' };
                                  })}
                              />
                          </div>
                      );
                  }

                  const statusData = getSetStatus(theirPicks, activeStage);
                  const statusStyles = getStatusStyles(statusData);

                  const picks30 = theirPicks.filter(s => s.type === '3-0');
                  const sorted30Picks = [...picks30].sort((a, b) => {
                    const aKey = a.teamId ? `adv-${a.teamId}` : null;
                    const bKey = b.teamId ? `adv-${b.teamId}` : null;
                    if (!aKey && !bKey) return 0;
                    if (!aKey) return 1;
                    if (!bKey) return -1;
                    const freqDiff = (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0);
                    if (freqDiff !== 0) return freqDiff;
                    return a.teamId!.localeCompare(b.teamId!);
                  }).map(s => {
                      const clash = statusData?.clashes?.find((c: any) => c.slotId === s.id);
                      return { ...s, resultStatus: checkPrediction(s.teamId, '3-0', activeStage), clashType: clash?.type };
                  });

                  const picksAdvance = theirPicks.filter(s => s.type === 'advance');
                  const sortedAdvancePicks = [...picksAdvance].sort((a, b) => {
                    const aKey = a.teamId ? `adv-${a.teamId}` : null;
                    const bKey = b.teamId ? `adv-${b.teamId}` : null;
                    if (!aKey && !bKey) return 0;
                    if (!aKey) return 1;
                    if (!bKey) return -1;
                    const freqDiff = (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0);
                    if (freqDiff !== 0) return freqDiff;
                    return a.teamId!.localeCompare(b.teamId!);
                  }).map(s => {
                      const clash = statusData?.clashes?.find((c: any) => c.slotId === s.id);
                      return { ...s, resultStatus: checkPrediction(s.teamId, 'advance', activeStage), clashType: clash?.type };
                  });

                  const elimPicks = theirPicks.filter(s => s.type === '0-3');
                  const sortedElimPicks = [...elimPicks].sort((a, b) => {
                    const aKey = a.teamId ? `elim-${a.teamId}` : null;
                    const bKey = b.teamId ? `elim-${b.teamId}` : null;
                    if (!aKey && !bKey) return 0;
                    if (!aKey) return 1;
                    if (!bKey) return -1;
                    const freqDiff = (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0);
                    if (freqDiff !== 0) return freqDiff;
                    return a.teamId!.localeCompare(b.teamId!);
                  }).map(s => {
                      const clash = statusData?.clashes?.find((c: any) => c.slotId === s.id);
                      return { ...s, resultStatus: checkPrediction(s.teamId, '0-3', activeStage), clashType: clash?.type };
                  });
                  
                  return (
                      <div key={participant.id} className={cn("p-4 rounded-lg flex flex-col gap-4 border", statusStyles.bg, statusStyles.border)}>
                        <div className={cn("flex items-center justify-between border-b pb-3", statusStyles.border)}>
                            <div className="font-bold text-sm text-zinc-200">{participant.name}</div>
                            <PickSetStatusText statusData={statusData} showProbability={showProbabilityInSummary} />
                        </div>
                        <MiniPicksDisplay 
                            title30="3:0 晋级"
                            slots30={sorted30Picks}
                            titleAdvance="3:1 3:2 晋级"
                            slotsAdvance={sortedAdvancePicks}
                            title03="0:3 淘汰"
                            slots03={sortedElimPicks}
                        />
                      </div>
                  )
              })}
            </div>
        </div>
    </div>
  );
}
