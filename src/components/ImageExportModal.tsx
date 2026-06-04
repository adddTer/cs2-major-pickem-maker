import React from 'react';
import { PickSet, StageKey, SlotType } from '../types';
import { Modal } from './Modal';
import { ExportContext } from '../lib/ExportContext';
import { RefreshCw, Copy, Download, CheckSquare, Square } from 'lucide-react';
import { dialog } from './DialogManager';
import { MiniPlayoffsBracket } from './MiniPlayoffsBracket';
import { MiniPicksDisplay } from './MiniPicksDisplay';
import { PickSetStatusText, getStatusStyles } from './PickSetStatus';

interface ImageExportModalProps {
  showImageExportModal: boolean;
  setShowImageExportModal: (val: boolean) => void;
  exportPreviewUrl: string | null;
  setExportPreviewUrl: (val: string | null) => void;
  imageExportIncludeResults: boolean;
  setImageExportIncludeResults: (val: boolean) => void;
  imageExportShowProbabilities: boolean;
  setImageExportShowProbabilities: (val: boolean) => void;
  imageExportShowTeamNames: boolean;
  setImageExportShowTeamNames: (val: boolean) => void;
  imageExportStyle: 'standard' | 'compact';
  setImageExportStyle: (val: 'standard' | 'compact') => void;
  imageExportIds: string[];
  setImageExportIds: React.Dispatch<React.SetStateAction<string[]>>;
  communityPicks: PickSet[];
  sortedCommunityPicks: PickSet[];
  isExportingImage: boolean;
  handleGeneratePreview: () => void;
  handleDownloadImage: () => void;
  activeStage: StageKey;
  PLAYOFFS_SLOTS: any[];
  ACTUAL_RESULTS: any;
  getSetStatus: (picks: any[], stage: string, customFutures?: any[]) => any;
  itemFreq: Record<string, number>;
  checkPrediction: (teamId: string | null, type: SlotType, stage: string) => 'correct' | 'incorrect' | 'unknown';
  simulatedFutures: any[];
  isSimulatingProbability?: boolean;
  simulationProgress?: number;
  exportContainerRef: React.RefObject<HTMLDivElement>;
}

export const ImageExportModal: React.FC<ImageExportModalProps> = ({
  showImageExportModal, setShowImageExportModal,
  exportPreviewUrl, setExportPreviewUrl,
  imageExportIncludeResults, setImageExportIncludeResults,
  imageExportShowProbabilities, setImageExportShowProbabilities,
  imageExportShowTeamNames, setImageExportShowTeamNames,
  imageExportStyle, setImageExportStyle,
  imageExportIds, setImageExportIds,
  communityPicks, sortedCommunityPicks,
  isExportingImage,
  handleGeneratePreview,
  handleDownloadImage,
  activeStage,
  PLAYOFFS_SLOTS,
  ACTUAL_RESULTS,
  getSetStatus,
  itemFreq,
  checkPrediction,
  simulatedFutures,
  isSimulatingProbability,
  simulationProgress = 0,
  exportContainerRef
}) => {
  return (
    <>
      <Modal isOpen={showImageExportModal} onClose={() => { setShowImageExportModal(false); setExportPreviewUrl(null); }} title={exportPreviewUrl ? "预览" : "导出为图片"}>
          {exportPreviewUrl ? (
              <div className="flex flex-col gap-4">
                  <div className="bg-black/40 rounded-lg overflow-auto max-h-[60vh] border border-white/10 p-2 relative custom-scrollbar">
                       <img src={exportPreviewUrl} alt="Preview" className="w-full h-auto rounded" />
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                      <button 
                          onClick={() => setExportPreviewUrl(null)}
                          className="px-4 py-2 border border-white/10 hover:bg-white/5 text-zinc-300 font-bold text-sm transition-colors rounded-md"
                      >
                          返回修改
                      </button>
                      <button 
                          onClick={async () => {
                              try {
                                  const response = await fetch(exportPreviewUrl);
                                  const blob = await response.blob();
                                  await navigator.clipboard.write([
                                      new ClipboardItem({ [blob.type]: blob })
                                  ]);
                                  dialog.alert('图片已复制到剪贴板！');
                              } catch (err) {
                                  console.error(err);
                                  dialog.alert('复制失败，请尝试直接下载。');
                              }
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors rounded-md shadow-lg shadow-blue-900/20 flex items-center gap-2"
                      >
                          <Copy className="w-4 h-4" /> 复制图片
                      </button>
                      <button 
                          onClick={handleDownloadImage}
                          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors rounded-md shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                      >
                          <Download className="w-4 h-4" /> 下载图片
                      </button>
                  </div>
              </div>
          ) : (isSimulatingProbability || isExportingImage) ? (
              <div className="flex flex-col items-center justify-center py-12 gap-5">
                  <RefreshCw className="w-10 h-10 text-blue-500 animate-spin opacity-80" />
                  <div className="text-zinc-200 font-bold text-lg text-center whitespace-pre-line leading-relaxed">
                       {isSimulatingProbability ? `正在运行 100,000 次蒙特卡洛模拟... (${simulationProgress}%)\n计算精确概率，请稍候` : '渲染高清长图中...'}
                  </div>
                  {isSimulatingProbability && (
                       <div className="w-full max-w-xs bg-zinc-800/80 rounded-full h-1.5 mt-2 overflow-hidden shadow-inner border border-white/5 relative">
                           <div className="bg-blue-500 h-full transition-all duration-300 ease-out" style={{ width: `${simulationProgress}%` }}></div>
                       </div>
                  )}
              </div>
          ) : (
          <div className="flex flex-col gap-4">
              <div 
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded cursor-pointer border border-white/5"
                  onClick={() => setImageExportIncludeResults(!imageExportIncludeResults)}
              >
                  <span className="text-sm font-bold text-zinc-200">包含实际比赛结果</span>
                  {imageExportIncludeResults ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-zinc-500" />}
              </div>
              <div 
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded cursor-pointer border border-white/5"
                  onClick={() => setImageExportShowProbabilities(!imageExportShowProbabilities)}
              >
                  <span className="text-sm font-bold text-zinc-200">显示概率而非对错</span>
                  {imageExportShowProbabilities ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-zinc-500" />}
              </div>
              <div 
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded cursor-pointer border border-white/5"
                  onClick={() => setImageExportShowTeamNames(!imageExportShowTeamNames)}
              >
                  <span className="text-sm font-bold text-zinc-200">显示队伍名称</span>
                  {imageExportShowTeamNames ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-zinc-500" />}
              </div>
              <div className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">展示样式</div>
                  <div className="flex gap-2">
                      <button 
                          onClick={() => setImageExportStyle('standard')}
                          className={`flex-1 py-2 text-sm font-bold rounded border transition-colors ${imageExportStyle === 'standard' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-zinc-800/50 text-zinc-400 border-white/5 hover:bg-zinc-800'}`}
                      >标准</button>
                      <button 
                          onClick={() => setImageExportStyle('compact')}
                          className={`flex-1 py-2 text-sm font-bold rounded border transition-colors ${imageExportStyle === 'compact' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-zinc-800/50 text-zinc-400 border-white/5 hover:bg-zinc-800'}`}
                      >紧凑</button>
                  </div>
              </div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2 px-1">选择包含的社区竞猜</div>
              <div className="flex flex-col gap-2">
                  <div 
                      className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded cursor-pointer hover:bg-zinc-800 transition-colors border border-white/5"
                      onClick={() => setImageExportIds(imageExportIds.length === communityPicks.length ? [] : communityPicks.map(p => p.id))}
                  >
                      {imageExportIds.length === communityPicks.length && communityPicks.length > 0 ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-zinc-500" />}
                      <span className="font-bold text-sm text-zinc-200">全选 ({imageExportIds.length}/{communityPicks.length})</span>
                  </div>
                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[160px] custom-scrollbar">
                      {sortedCommunityPicks.map(item => {
                          const isSelected = imageExportIds.includes(item.id);
                          return (
                              <div 
                                  key={item.id}
                                  className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors border ${isSelected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-black/20 border-white/5 hover:bg-black/40'}`}
                                  onClick={() => setImageExportIds(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id])}
                              >
                                  {isSelected ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-zinc-500" />}
                                  <span className="font-bold text-sm text-zinc-200 truncate">{item.name}</span>
                              </div>
                          );
                      })}
                  </div>
              </div>
              <div className="mt-4 flex justify-end">
                  <button 
                      onClick={handleGeneratePreview}
                      disabled={isExportingImage || imageExportIds.length === 0}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors rounded-md shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                      {isExportingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                      生成预览
                  </button>
              </div>
          </div>
          )}
      </Modal>

      {/* Hidden container for image export */}
      {(showImageExportModal || isExportingImage) && (
          <ExportContext.Provider value={true}>
              <div className="absolute left-[-9999px] top-[-9999px]">
                  <div 
                      ref={exportContainerRef} 
                      className="bg-[#070b09] p-8 w-max min-w-[500px] max-w-[1200px] flex flex-col gap-6"
                      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
                  >
                  <div className="flex flex-col items-center justify-center border-b border-white/10 pb-6 mb-2">
                       <h1 className="text-2xl font-black text-white tracking-widest flex items-center gap-2">IEM Cologne 2026 - {activeStage === 'stage1' ? '第一阶段' : activeStage === 'stage2' ? '第二阶段' : activeStage === 'stage3' ? '第三阶段' : '决胜阶段'}</h1>
                  </div>
                  {imageExportIncludeResults && imageExportStyle !== 'compact' && (
                      <div className="bg-zinc-900/80 border border-emerald-500/20 p-5 rounded-lg flex flex-col gap-4">
                          <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3">
                              <h3 className="text-base font-bold text-emerald-400 tracking-wider">实际比赛结果</h3>
                          </div>
                    {activeStage === 'playoffs' ? (
                        <MiniPlayoffsBracket 
                            slots={PLAYOFFS_SLOTS.map((s, i) => ({ ...s, teamId: ACTUAL_RESULTS[activeStage]?.filter((x: any) => x.type === s.type)[i]?.teamId || undefined, resultStatus: 'unknown' }))}
                            showTeamNames={imageExportShowTeamNames}
                            isExport={true}
                        />
                    ) : (
                        <MiniPicksDisplay 
                            title30="3:0 晋级"
                            slots30={Array(2).fill(null).map((_, i) => ({ id: `r30-${i}`, type: '3-0' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter((s: any) => s.type === '3-0')[i]?.teamId || undefined, resultStatus: 'unknown' }))}
                            titleAdvance="3:1 3:2 晋级"
                            slotsAdvance={Array(6).fill(null).map((_, i) => ({ id: `ra-${i}`, type: 'advance' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter((s: any) => s.type === 'advance')[i]?.teamId || undefined, resultStatus: 'unknown' }))}
                            title03="0:3 淘汰"
                            slots03={Array(2).fill(null).map((_, i) => ({ id: `r03-${i}`, type: '0-3' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter((s: any) => s.type === '0-3')[i]?.teamId || undefined, resultStatus: 'unknown' }))}
                            compact={false}
                            showTeamNames={imageExportShowTeamNames}
                            isExport={true}
                        />
                    )}
                      </div>
                  )}
                  <div className={`grid ${imageExportStyle === 'compact' ? 'grid-cols-1 gap-0 bg-zinc-900/80 border border-white/5 rounded-lg shadow-sm overflow-hidden' : 'grid-cols-1 gap-6'}`}>
                      {imageExportIncludeResults && imageExportStyle === 'compact' && (
                           <div className={`flex items-center gap-4 py-3 px-5 bg-emerald-900/20`}>
                               <div className="font-bold text-sm text-emerald-400 w-32 shrink-0 break-words line-clamp-2 leading-snug">实际比赛结果</div>
                               <div className="flex-1">
                                   {activeStage === 'playoffs' ? (
                                       <MiniPlayoffsBracket 
                                           slots={PLAYOFFS_SLOTS.map((s, i) => ({ ...s, teamId: ACTUAL_RESULTS[activeStage]?.filter((x: any) => x.type === s.type)[i]?.teamId || undefined, resultStatus: 'unknown' }))}
                                           compact={true}
                                           showTeamNames={imageExportShowTeamNames}
                                           isExport={true}
                                       />
                                   ) : (
                                       <MiniPicksDisplay 
                                           title30="3:0 晋级"
                                           slots30={Array(2).fill(null).map((_, i) => ({ id: `r30-${i}`, type: '3-0' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter((s: any) => s.type === '3-0')[i]?.teamId || undefined, resultStatus: 'unknown' }))}
                                           titleAdvance="3:1 3:2 晋级"
                                           slotsAdvance={Array(6).fill(null).map((_, i) => ({ id: `ra-${i}`, type: 'advance' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter((s: any) => s.type === 'advance')[i]?.teamId || undefined, resultStatus: 'unknown' }))}
                                           title03="0:3 淘汰"
                                           slots03={Array(2).fill(null).map((_, i) => ({ id: `r03-${i}`, type: '0-3' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter((s: any) => s.type === '0-3')[i]?.teamId || undefined, resultStatus: 'unknown' }))}
                                           compact={true}
                                           showTeamNames={imageExportShowTeamNames}
                                           isExport={true}
                                       />
                                   )}
                               </div>
                           </div>
                      )}
                      {sortedCommunityPicks.filter(p => imageExportIds.includes(p.id)).map((participant, index) => {
                          const theirPicks = participant.picks[activeStage] || [];
                          
                          if (activeStage === 'playoffs') {
                              return (
                                   <div key={participant.id} className={imageExportStyle === 'compact' ? `flex items-center gap-4 py-3 px-5 ${(index !== 0 || imageExportIncludeResults) ? 'border-t border-white/5' : ''}` : "bg-zinc-900/80 border border-white/5 p-5 rounded-lg shadow-sm flex flex-col gap-4"}>
                                       {imageExportStyle === 'compact' ? (
                                           <div className="font-bold text-sm text-zinc-200 w-32 shrink-0 break-words line-clamp-2 leading-snug">{participant.name}</div>
                                       ) : (
                                           <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                                               <div className="font-bold text-base text-zinc-200">{participant.name}</div>
                                           </div>
                                       )}
                                       <div className={imageExportStyle === 'compact' ? "flex-1" : ""}>
                                           <MiniPlayoffsBracket 
                                               slots={PLAYOFFS_SLOTS.map((s) => {
                                                   const pick = theirPicks.find(p => p.id === s.id || p.id === `playoffs-${s.id}`);
                                                   return { ...s, teamId: pick?.teamId || null, resultStatus: 'unknown' };
                                               })}
                                               compact={imageExportStyle === 'compact'}
                                               showTeamNames={imageExportShowTeamNames}
                                               isExport={true}
                                           />
                                       </div>
                                   </div>
                              );
                          }

                          const statusData = getSetStatus(theirPicks, activeStage, simulatedFutures);
                          const statusStyles = getStatusStyles(statusData);

                          const decorateSlot = (s: any, type: SlotType) => {
                              const clash = statusData?.clashes?.find((c: any) => c.slotId === s.id);
                              let resultStatus = imageExportIncludeResults ? checkPrediction(s.teamId, type, activeStage) : undefined;
                              return { ...s, resultStatus, clashType: clash?.type };
                          };

                          const picks30 = theirPicks.filter(s => s.type === '3-0');
                          const sorted30Picks = [...picks30].sort((a, b) => {
                            const aKey = a.teamId ? `adv-${a.teamId}` : null;
                            const bKey = b.teamId ? `adv-${b.teamId}` : null;
                            if (!aKey && !bKey) return 0;
                            if (!aKey) return 1;
                            if (!bKey) return -1;
                            return (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0) || a.teamId!.localeCompare(b.teamId!);
                          }).map(s => decorateSlot(s, '3-0'));

                          const picksAdvance = theirPicks.filter(s => s.type === 'advance');
                          const sortedAdvancePicks = [...picksAdvance].sort((a, b) => {
                            const aKey = a.teamId ? `adv-${a.teamId}` : null;
                            const bKey = b.teamId ? `adv-${b.teamId}` : null;
                            if (!aKey && !bKey) return 0;
                            if (!aKey) return 1;
                            if (!bKey) return -1;
                            return (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0) || a.teamId!.localeCompare(b.teamId!);
                          }).map(s => decorateSlot(s, 'advance'));

                          const elimPicks = theirPicks.filter(s => s.type === '0-3');
                          const sortedElimPicks = [...elimPicks].sort((a, b) => {
                            const aKey = a.teamId ? `elim-${a.teamId}` : null;
                            const bKey = b.teamId ? `elim-${b.teamId}` : null;
                            if (!aKey && !bKey) return 0;
                            if (!aKey) return 1;
                            if (!bKey) return -1;
                            return (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0) || a.teamId!.localeCompare(b.teamId!);
                          }).map(s => decorateSlot(s, '0-3'));
                          
                          if (imageExportStyle === 'compact') {
                              return (
                                  <div key={participant.id} className={`flex items-center gap-4 py-3 px-5 ${(index !== 0 || imageExportIncludeResults) ? 'border-t' : ''} ${statusStyles.border} ${statusStyles.bg}`}>
                                      <div className="font-bold text-sm text-zinc-200 w-32 shrink-0 break-words line-clamp-2 leading-snug flex flex-col gap-1.5">
                                          {participant.name}
                                          <PickSetStatusText statusData={statusData} showProbability={imageExportShowProbabilities} />
                                      </div>
                                      <div className="flex-1">
                                          <MiniPicksDisplay 
                                              title30="3:0 晋级"
                                              slots30={sorted30Picks}
                                              titleAdvance="3:1 3:2 晋级"
                                              slotsAdvance={sortedAdvancePicks}
                                              title03="0:3 淘汰"
                                              slots03={sortedElimPicks}
                                              compact={true}
                                              showTeamNames={imageExportShowTeamNames}
                                              isExport={true}
                                          />
                                      </div>
                                  </div>
                              );
                          }
                          
                          return (
                              <div key={participant.id} className={`border p-5 rounded-lg flex flex-col gap-4 ${statusStyles.bg} ${statusStyles.border}`}>
                                <div className={`flex items-center justify-between border-b pb-3 ${statusStyles.border}`}>
                                    <div className="font-bold text-base text-zinc-200">{participant.name}</div>
                                    <PickSetStatusText statusData={statusData} showProbability={imageExportShowProbabilities} />
                                </div>
                                <MiniPicksDisplay 
                                    title30="3:0 晋级"
                                    slots30={sorted30Picks}
                                    titleAdvance="3:1 3:2 晋级"
                                    slotsAdvance={sortedAdvancePicks}
                                    title03="0:3 淘汰"
                                    slots03={sortedElimPicks}
                                    showTeamNames={imageExportShowTeamNames}
                                    isExport={true}
                                />
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
          </ExportContext.Provider>
      )}
    </>
  );
};
