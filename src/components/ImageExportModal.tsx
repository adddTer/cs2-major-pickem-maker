import React from "react";
import { PickSet, StageKey, SlotType } from "../types";
import { Modal } from "./Modal";
import { ExportContext } from "../lib/ExportContext";
import { RefreshCw, Copy, Download, CheckSquare, Square } from "lucide-react";
import { dialog } from "./DialogManager";
import { MiniPlayoffsBracket } from "./MiniPlayoffsBracket";
import { MiniPicksDisplay } from "./MiniPicksDisplay";
import { PickSetStatusText, getStatusStyles } from "./PickSetStatus";
import { SwissBracket } from "./SwissBracket";
import { simulateSwiss } from "../utils/simulateSwiss";
import { MATCHES } from "../data/matches";
import { TEAMS } from "../data/teams";

interface ImageExportModalProps {
  showImageExportModal: boolean;
  setShowImageExportModal: (val: boolean) => void;
  exportPreviewUrl: string | null;
  setExportPreviewUrl: (val: string | null) => void;
  imageExportShowPrevStage: boolean;
  setImageExportShowPrevStage: (val: boolean) => void;
  imageExportShowProbabilities: boolean;
  setImageExportShowProbabilities: (val: boolean) => void;
  imageExportShowTeamNames: boolean;
  setImageExportShowTeamNames: (val: boolean) => void;
  imageExportStyle: "standard" | "compact";
  setImageExportStyle: (val: "standard" | "compact") => void;
  imageExportSimCount: number;
  setImageExportSimCount: (val: number) => void;
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
  checkPrediction: (
    teamId: string | null,
    type: SlotType,
    stage: string,
  ) => "correct" | "incorrect" | "unknown";
  simulatedFutures: any[];
  isSimulatingProbability?: boolean;
  simulationProgress?: number;
  exportContainerRef: React.RefObject<HTMLDivElement>;
}

export const ImageExportModal: React.FC<ImageExportModalProps> = ({
  showImageExportModal,
  setShowImageExportModal,
  exportPreviewUrl,
  setExportPreviewUrl,
  imageExportShowPrevStage,
  setImageExportShowPrevStage,
  imageExportShowProbabilities,
  setImageExportShowProbabilities,
  imageExportShowTeamNames,
  setImageExportShowTeamNames,
  imageExportStyle,
  setImageExportStyle,
  imageExportSimCount,
  setImageExportSimCount,
  imageExportIds,
  setImageExportIds,
  communityPicks,
  sortedCommunityPicks,
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
  exportContainerRef,
}) => {
  const [exportSession, setExportSession] = React.useState<number>(1);
  const [animFrame, setAnimFrame] = React.useState<Record<string, any> | null>(null);
  const [localSimulating, setLocalSimulating] = React.useState(false);
  const isSimRef = React.useRef(isSimulatingProbability);

  React.useEffect(() => {
    isSimRef.current = isSimulatingProbability;
    if (isSimulatingProbability) {
      setLocalSimulating(true);
    }
  }, [isSimulatingProbability]);

  React.useEffect(() => {
    if (isExportingImage) setExportSession(Date.now());
  }, [isExportingImage]);

  React.useEffect(() => {
    if (localSimulating && activeStage !== "playoffs") {
      const stageMatchesMap = MATCHES[activeStage];
      if (!stageMatchesMap) return;

      const pastMatches: { t1: string; t2: string; winner: string }[] = [];
      const scheduledMatches: { t1: string; t2: string }[] = [];

      const r0 = stageMatchesMap["0:0"] || [];
      const orderedTeams = new Array(16).fill("");
      r0.forEach((m, idx) => {
        if (m.team1Id && m.team1Id !== "tbd") orderedTeams[idx] = m.team1Id;
        if (m.team2Id && m.team2Id !== "tbd")
          orderedTeams[15 - idx] = m.team2Id;
      });
      const allTeams = orderedTeams.filter((t) => t !== "");

      Object.values(stageMatchesMap).forEach((batch) => {
        batch.forEach((m) => {
          if (m.team1Id && m.team2Id && m.team1Id !== "tbd" && m.team2Id !== "tbd") {
            if (m.score1 !== undefined && m.score2 !== undefined && m.status === "past") {
              const t1Wins = m.score1! > m.score2!;
              pastMatches.push({ t1: m.team1Id, t2: m.team2Id, winner: t1Wins ? m.team1Id : m.team2Id });
            } else {
              scheduledMatches.push({ t1: m.team1Id, t2: m.team2Id });
            }
          }
        });
      });

      const teamStrengths: Record<string, number> = {};
      TEAMS.forEach((t) => { if (t.strength) teamStrengths[t.id] = t.strength; });

      let cancel = false;

      const runAnimationLoop = async () => {
        while (!cancel) {
          const results = simulateSwiss(allTeams, pastMatches, scheduledMatches, 1, teamStrengths, activeStage);
          if (results && results.length > 0 && results[0].simPredictionsByRound) {
            const rounds = results[0].simPredictionsByRound;
            for (let i = 0; i < rounds.length; i++) {
              if (cancel) break;
              setAnimFrame(rounds[i]);
              await new Promise((r) => setTimeout(r, 600));
            }
            if (!cancel) {
              await new Promise((r) => setTimeout(r, 1500));
            }
          } else {
            await new Promise((r) => setTimeout(r, 1000));
          }

          if (!cancel && !isSimRef.current) {
             setLocalSimulating(false);
             break;
          }
        }
      };

      runAnimationLoop();

      return () => {
        cancel = true;
      };
    } else {
      setAnimFrame(null);
    }
  }, [localSimulating, activeStage]);

  if (localSimulating && activeStage !== "playoffs") {
    return (
      <div className="fixed inset-0 z-[100000] bg-[#0A0A0A]/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="absolute top-12 flex flex-col items-center z-50 pointer-events-none w-full px-8">
          <h2 className="text-[15px] font-medium text-zinc-100 mb-2 tracking-wide flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
            正在生成概率分布...
          </h2>
          <div className="flex items-center gap-3 w-[320px] max-w-[80vw] mt-1">
             <span className="text-[10px] font-mono text-zinc-500 w-10 text-right">
               {Math.floor((simulationProgress / 100) * imageExportSimCount).toLocaleString()}
             </span>
             <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden relative">
               <div
                  className="absolute left-0 top-0 h-full bg-zinc-300 transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(1, simulationProgress)}%` }}
               />
             </div>
             <span className="text-[10px] font-mono text-zinc-500 w-10 text-left">
               {imageExportSimCount.toLocaleString()}
             </span>
          </div>
        </div>
        <div className="w-full h-full opacity-75 pointer-events-none mt-4 flex-1 mix-blend-screen">
          <SwissBracket activeStage={activeStage} externalPredictions={animFrame || undefined} isAnimating={true} />
        </div>
      </div>
    );
  }

  return (
    <>
      <Modal
        isOpen={showImageExportModal}
        onClose={() => {
          setShowImageExportModal(false);
          setExportPreviewUrl(null);
        }}
        title={exportPreviewUrl ? "预览" : "导出为图片"}
      >
        {exportPreviewUrl ? (
          <div className="flex flex-col gap-4">
            <div className="bg-black/40 rounded-lg overflow-auto max-h-[60vh] border border-white/10 p-2 relative custom-scrollbar">
              <img
                src={exportPreviewUrl}
                alt="Preview"
                className="w-full h-auto rounded"
              />
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
                      new ClipboardItem({ [blob.type]: blob }),
                    ]);
                    dialog.alert("图片已复制到剪贴板！");
                  } catch (err) {
                    console.error(err);
                    dialog.alert("复制失败，请尝试直接下载。");
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
        ) : isSimulatingProbability || isExportingImage ? (
          <div className="flex flex-col items-center justify-center py-12 gap-5">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin opacity-80" />
            <div className="text-zinc-200 font-bold text-lg text-center whitespace-pre-line leading-relaxed">
              {isSimulatingProbability ? "模拟中……" : "渲染高清长图中..."}
            </div>
            {isSimulatingProbability && (
              <div className="w-full max-w-xs bg-zinc-800/80 rounded-full h-1.5 mt-2 overflow-hidden shadow-inner border border-white/5 relative">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${simulationProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeStage !== "stage1" && (
              <div
                className="flex items-center justify-between p-3 bg-zinc-800/50 rounded cursor-pointer border border-white/5"
                onClick={() =>
                  setImageExportShowPrevStage(!imageExportShowPrevStage)
                }
              >
                <span className="text-sm font-bold text-zinc-200">
                  显示上阶段成绩
                </span>
                {imageExportShowPrevStage ? (
                  <CheckSquare className="w-5 h-5 text-blue-400" />
                ) : (
                  <Square className="w-5 h-5 text-zinc-500" />
                )}
              </div>
            )}
            <div className="flex flex-col bg-zinc-800/50 rounded border border-white/5 overflow-hidden">
              <div
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() =>
                  setImageExportShowProbabilities(!imageExportShowProbabilities)
                }
              >
                <span className="text-sm font-bold text-zinc-200">
                  显示概率而非对错
                </span>
                {imageExportShowProbabilities ? (
                  <CheckSquare className="w-5 h-5 text-blue-400" />
                ) : (
                  <Square className="w-5 h-5 text-zinc-500" />
                )}
              </div>
              
              <div
                className={`transition-all duration-300 ease-in-out grid ${
                  imageExportShowProbabilities
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden bg-black/20">
                  <div className="flex flex-col gap-3 p-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400">模拟次数精度</span>
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded shadow-sm border border-blue-500/20">
                        {imageExportSimCount >= 1000000 
                          ? `${(imageExportSimCount / 1000000).toFixed(1)}M` 
                          : `${imageExportSimCount / 1000}K`}
                      </span>
                    </div>
                    <div className="relative flex flex-col gap-2">
                       <input
                         type="range"
                         min="10000"
                         max="5000000"
                         step="10000"
                         value={imageExportSimCount}
                         onChange={(e) => setImageExportSimCount(Number(e.target.value))}
                         className="w-full h-1.5 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                       />
                       <div className="flex justify-between text-[10px] text-zinc-500 px-1 font-mono font-bold">
                         <span>10K (极速)</span>
                         <span>5M (精确)</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="flex items-center justify-between p-3 bg-zinc-800/50 rounded cursor-pointer border border-white/5"
              onClick={() =>
                setImageExportShowTeamNames(!imageExportShowTeamNames)
              }
            >
              <span className="text-sm font-bold text-zinc-200">
                显示队伍名称
              </span>
              {imageExportShowTeamNames ? (
                <CheckSquare className="w-5 h-5 text-blue-400" />
              ) : (
                <Square className="w-5 h-5 text-zinc-500" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
                展示样式
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setImageExportStyle("standard")}
                  className={`flex-1 py-2 text-sm font-bold rounded border transition-colors ${imageExportStyle === "standard" ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "bg-zinc-800/50 text-zinc-400 border-white/5 hover:bg-zinc-800"}`}
                >
                  标准
                </button>
                <button
                  onClick={() => setImageExportStyle("compact")}
                  className={`flex-1 py-2 text-sm font-bold rounded border transition-colors ${imageExportStyle === "compact" ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "bg-zinc-800/50 text-zinc-400 border-white/5 hover:bg-zinc-800"}`}
                >
                  紧凑
                </button>
              </div>
            </div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2 px-1">
              选择包含的社区竞猜
            </div>
            <div className="flex flex-col gap-2">
              <div
                className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded cursor-pointer hover:bg-zinc-800 transition-colors border border-white/5"
                onClick={() => {
                  const validIds = communityPicks
                    .filter((p) => {
                      const stagePicks = p.picks[activeStage] || [];
                      if (activeStage === "playoffs") {
                        const userPicks = stagePicks.filter(
                          (s) => !s.id.startsWith("qf-"),
                        );
                        return (
                          userPicks.length === 7 &&
                          userPicks.every((s) => !!s.teamId)
                        );
                      } else {
                        return (
                          stagePicks.length === 10 &&
                          stagePicks.every((s) => !!s.teamId)
                        );
                      }
                    })
                    .map((p) => p.id);
                  setImageExportIds(
                    imageExportIds.length === validIds.length ? [] : validIds,
                  );
                }}
              >
                {(() => {
                  const validIdsCount = communityPicks.filter((p) => {
                    const stagePicks = p.picks[activeStage] || [];
                    if (activeStage === "playoffs") {
                      const userPicks = stagePicks.filter(
                        (s) => !s.id.startsWith("qf-"),
                      );
                      return (
                        userPicks.length === 7 &&
                        userPicks.every((s) => !!s.teamId)
                      );
                    } else {
                      return (
                        stagePicks.length === 10 &&
                        stagePicks.every((s) => !!s.teamId)
                      );
                    }
                  }).length;
                  return (
                    <>
                      {imageExportIds.length === validIdsCount &&
                      validIdsCount > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-500" />
                      )}
                      <span className="font-bold text-sm text-zinc-200">
                        全选完整预测 ({imageExportIds.length}/{validIdsCount})
                      </span>
                    </>
                  );
                })()}
              </div>
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[160px] custom-scrollbar">
                {sortedCommunityPicks.map((item) => {
                  const isSelected = imageExportIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors border ${isSelected ? "bg-blue-500/10 border-blue-500/30" : "bg-black/20 border-white/5 hover:bg-black/40"}`}
                      onClick={() =>
                        setImageExportIds((prev) =>
                          prev.includes(item.id)
                            ? prev.filter((x) => x !== item.id)
                            : [...prev, item.id],
                        )
                      }
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-500" />
                      )}
                      <span className="font-bold text-sm text-zinc-200 truncate">
                        {item.name}
                      </span>
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
                {isExportingImage ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : null}
                生成预览
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden container for image export */}
      {!isSimulatingProbability &&
        (showImageExportModal || isExportingImage) && (
          <ExportContext.Provider
            value={isExportingImage ? exportSession : false}
          >
            <div className="absolute left-[-9999px] top-[-9999px]">
              <div
                ref={exportContainerRef}
                className="bg-[#070b09] p-8 w-max min-w-[500px] max-w-[1200px] flex flex-col gap-6"
                style={{
                  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                }}
              >
                <div className="flex flex-col items-center justify-center border-b border-white/10 pb-6 mb-2">
                  <h1 className="text-2xl font-black text-white tracking-widest flex items-center gap-2">
                    IEM Cologne 2026 -{" "}
                    {activeStage === "stage1"
                      ? "第一阶段"
                      : activeStage === "stage2"
                        ? "第二阶段"
                        : activeStage === "stage3"
                          ? "第三阶段"
                          : "决胜阶段"}
                  </h1>
                </div>
                <div
                  className={`grid ${imageExportStyle === "compact" ? "grid-cols-1 gap-0 bg-zinc-900/80 border border-white/5 rounded-lg shadow-sm overflow-hidden" : "grid-cols-1 gap-6"}`}
                >
                  {sortedCommunityPicks
                    .filter((p) => imageExportIds.includes(p.id))
                    .map((participant, index) => {
                      const theirPicks = participant.picks[activeStage] || [];

                      if (activeStage === "playoffs") {
                        return (
                          <div
                            key={participant.id}
                            className={
                              imageExportStyle === "compact"
                                ? `flex items-center gap-4 py-3 px-5 ${index !== 0 ? "border-t border-white/5" : ""}`
                                : "bg-zinc-900/80 border border-white/5 p-5 rounded-lg shadow-sm flex flex-col gap-4"
                            }
                          >
                            {imageExportStyle === "compact" ? (
                              <div className="font-bold text-sm text-zinc-200 w-32 shrink-0 break-words line-clamp-2 leading-snug">
                                {participant.name}
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                                <div className="font-bold text-base text-zinc-200">
                                  {participant.name}
                                </div>
                              </div>
                            )}
                            <div
                              className={
                                imageExportStyle === "compact" ? "flex-1" : ""
                              }
                            >
                              <MiniPlayoffsBracket
                                slots={PLAYOFFS_SLOTS.map((s) => {
                                  const pick = theirPicks.find(
                                    (p) =>
                                      p.id === s.id ||
                                      p.id === `playoffs-${s.id}`,
                                  );
                                  let teamId = pick?.teamId || null;
                                  if (s.type === "qf" && !teamId) {
                                    const qfActuals =
                                      ACTUAL_RESULTS[activeStage]?.filter(
                                        (x: any) => x.type === "qf",
                                      ) || [];
                                    const sTypeIdx = PLAYOFFS_SLOTS.filter(
                                      (x) => x.type === "qf",
                                    ).findIndex((x) => x.id === s.id);
                                    teamId =
                                      qfActuals[sTypeIdx]?.teamId || null;
                                  }
                                  return {
                                    ...s,
                                    teamId,
                                    resultStatus: checkPrediction(
                                      teamId,
                                      s.type as SlotType,
                                      activeStage,
                                    ),
                                  };
                                })}
                                compact={imageExportStyle === "compact"}
                                showTeamNames={imageExportShowTeamNames}
                                isExport={true}
                              />
                            </div>
                          </div>
                        );
                      }

                      const statusData = getSetStatus(
                        theirPicks,
                        activeStage,
                        simulatedFutures,
                      );
                      const statusStyles = getStatusStyles(statusData);

                      let prevStageStatusData = null;
                      if (
                        imageExportShowPrevStage &&
                        activeStage !== "stage1"
                      ) {
                        const prevStage =
                          activeStage === "stage2"
                            ? "stage1"
                            : activeStage === "stage3"
                              ? "stage2"
                              : activeStage === "playoffs"
                                ? "stage3"
                                : null;
                        if (prevStage) {
                          const theirPrevPicks =
                            participant.picks[prevStage] || [];
                          prevStageStatusData = getSetStatus(
                            theirPrevPicks,
                            prevStage,
                          );
                        }
                      }

                      const decorateSlot = (s: any, type: SlotType) => {
                        const clash = statusData?.clashes?.find(
                          (c: any) => c.slotId === s.id,
                        );
                        return {
                          ...s,
                          resultStatus: checkPrediction(
                            s.teamId,
                            type,
                            activeStage,
                          ),
                          clashType: clash?.type,
                        };
                      };

                      const picks30 = theirPicks.filter(
                        (s) => s.type === "3-0",
                      );
                      const sorted30Picks = [...picks30]
                        .sort((a, b) => {
                          const aKey = a.teamId ? `3-0-${a.teamId}` : null;
                          const bKey = b.teamId ? `3-0-${b.teamId}` : null;
                          if (!aKey && !bKey) return 0;
                          if (!aKey) return 1;
                          if (!bKey) return -1;
                          return (
                            (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0) ||
                            a.teamId!.localeCompare(b.teamId!)
                          );
                        })
                        .map((s) => decorateSlot(s, "3-0"));

                      const picksAdvance = theirPicks.filter(
                        (s) => s.type === "advance",
                      );
                      const sortedAdvancePicks = [...picksAdvance]
                        .sort((a, b) => {
                          const aKey = a.teamId ? `advance-${a.teamId}` : null;
                          const bKey = b.teamId ? `advance-${b.teamId}` : null;
                          if (!aKey && !bKey) return 0;
                          if (!aKey) return 1;
                          if (!bKey) return -1;
                          return (
                            (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0) ||
                            a.teamId!.localeCompare(b.teamId!)
                          );
                        })
                        .map((s) => decorateSlot(s, "advance"));

                      const elimPicks = theirPicks.filter(
                        (s) => s.type === "0-3",
                      );
                      const sortedElimPicks = [...elimPicks]
                        .sort((a, b) => {
                          const aKey = a.teamId ? `0-3-${a.teamId}` : null;
                          const bKey = b.teamId ? `0-3-${b.teamId}` : null;
                          if (!aKey && !bKey) return 0;
                          if (!aKey) return 1;
                          if (!bKey) return -1;
                          return (
                            (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0) ||
                            a.teamId!.localeCompare(b.teamId!)
                          );
                        })
                        .map((s) => decorateSlot(s, "0-3"));

                      if (imageExportStyle === "compact") {
                        return (
                          <div
                            key={participant.id}
                            className={`flex items-center gap-4 py-3 px-5 ${index !== 0 ? "border-t" : ""} ${statusStyles.border} ${statusStyles.bg}`}
                          >
                            <div className="font-bold text-sm text-zinc-200 w-32 shrink-0 break-words line-clamp-2 leading-snug flex flex-col gap-1.5">
                              {participant.name}
                              {imageExportShowPrevStage &&
                              activeStage !== "stage1" ? (
                                <div className="flex items-center w-[120px] overflow-hidden whitespace-nowrap">
                                  <span className="text-[10px] text-zinc-400 font-bold bg-zinc-800/80 px-1 py-0.5 rounded leading-none shrink-0 border border-zinc-700 mr-1 shadow-sm">
                                    上阶段
                                  </span>
                                  <PickSetStatusText
                                    statusData={prevStageStatusData}
                                    showProbability={false}
                                  />
                                </div>
                              ) : (
                                <PickSetStatusText
                                  statusData={statusData}
                                  showProbability={imageExportShowProbabilities}
                                />
                              )}
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
                        <div
                          key={participant.id}
                          className={`border p-5 rounded-lg flex flex-col gap-4 ${statusStyles.bg} ${statusStyles.border}`}
                        >
                          <div
                            className={`flex items-center justify-between border-b pb-3 ${statusStyles.border}`}
                          >
                            <div className="font-bold text-base text-zinc-200">
                              {participant.name}
                            </div>
                            {imageExportShowPrevStage &&
                            activeStage !== "stage1" ? (
                              <div className="flex items-center max-w-[200px] overflow-hidden whitespace-nowrap">
                                <span className="text-[10px] text-zinc-400 font-bold bg-zinc-800/80 px-1 py-0.5 rounded leading-none shrink-0 border border-zinc-700 mr-1 shadow-sm opacity-90">
                                  上阶段
                                </span>
                                <PickSetStatusText
                                  statusData={prevStageStatusData}
                                  showProbability={false}
                                />
                              </div>
                            ) : (
                              <PickSetStatusText
                                statusData={statusData}
                                showProbability={imageExportShowProbabilities}
                              />
                            )}
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
                      );
                    })}
                </div>
              </div>
            </div>
          </ExportContext.Provider>
        )}
    </>
  );
};
