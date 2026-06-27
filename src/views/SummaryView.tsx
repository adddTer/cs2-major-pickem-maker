import React, { useState } from "react";
import { PickSlot, StageKey, SlotType, PickSet } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { MiniPlayoffsBracket } from "../components/MiniPlayoffsBracket";
import { MiniPicksDisplay } from "../components/MiniPicksDisplay";
import {
  PickSetStatusText,
  getStatusStyles,
} from "../components/PickSetStatus";

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
  checkPrediction: (
    teamId: string | null,
    type: SlotType,
    stage: string,
  ) => "correct" | "incorrect" | "unknown";
  handleRefresh?: () => void;
  isRefreshing?: boolean;
  setViewMode?: (mode: "home" | "edit" | "summary") => void;
}

import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Download, Image as ImageIcon, FileText } from "lucide-react";

export const SummaryView: React.FC<SummaryViewProps> = React.memo(
  ({
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
    checkPrediction,
    handleRefresh,
    isRefreshing,
    setViewMode,
  }) => {
    const [isMobileResultsOpen, setIsMobileResultsOpen] = useState(true);

    return (
      <div className="flex-1 flex flex-col xl:flex-row bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl shadow-xl relative backdrop-blur-2xl overflow-hidden">
        {/* Left Panel: Context & Controls */}
        <div className="w-full xl:w-[380px] shrink-0 flex flex-col border-b xl:border-b-0 xl:border-r border-black/5 dark:border-white/5 bg-zinc-50/80 dark:bg-zinc-900/80 z-10 transition-all">
          <div className="p-4 sm:p-5 flex flex-col gap-4 sm:gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {setViewMode && (
                  <button
                    onClick={() => setViewMode("home")}
                    className="p-1.5 -ml-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-zinc-600 dark:text-zinc-300 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    社区预测
                    <span className="px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded-full text-[0.6875rem] sm:text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      {communityPicks.length} 份
                    </span>
                  </h2>
                </div>
              </div>
            </div>

            {/* Stage Selector */}
            <div className="flex bg-zinc-200/50 dark:bg-zinc-900/50 p-1 rounded-xl shadow-inner border border-black/5 dark:border-white/5 overflow-x-auto custom-scrollbar">
              {["stage1", "stage2", "stage3", "playoffs"].map((tabId) => {
                const stageLabel =
                  tabId === "stage1"
                    ? "第一阶段"
                    : tabId === "stage2"
                      ? "第二阶段"
                      : tabId === "stage3"
                        ? "第三阶段"
                        : "决胜阶段";
                const isActive = activeStage === tabId;
                return (
                  <button
                    key={`sum-${tabId}`}
                    onClick={() => setActiveStage(tabId as StageKey)}
                    className={cn(
                      "flex-1 px-3 py-1.5 text-[0.6875rem] sm:text-xs font-display font-medium rounded-lg transition-all duration-300 whitespace-nowrap",
                      isActive
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-md ring-1 ring-black/5 dark:ring-white/10"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5",
                    )}
                  >
                    {stageLabel}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() =>
                  setShowProbabilityInSummary(!showProbabilityInSummary)
                }
                className="col-span-2 py-2 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-black/5 dark:border-white/5 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {showProbabilityInSummary ? "当前：显示对错数量" : "当前：显示通过概率"}
              </button>
              <button
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
                  setImageExportIds(validIds);
                  setShowImageExportModal(true);
                }}
                className="p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                导出长图
              </button>
              <button
                onClick={() => {
                  setShowTextExportModal(true);
                }}
                className="p-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                导出文本
              </button>
            </div>
          </div>

          <div className="h-px bg-black/5 dark:bg-white/5 w-full shrink-0 xl:hidden"></div>
        </div>

        {/* Right Panel: Community Picks */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-100/40 dark:bg-black/10 relative custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4 lg:gap-6 max-w-[1600px] mx-auto content-start mb-6">
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-[0_0_15px_rgba(16,185,129,0.15)] justify-between">
              <div className="flex items-center min-h-[32px]">
                <h3 className="text-[15px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  赛段真实赛果
                </h3>
              </div>
              <div className="bg-zinc-50/80 dark:bg-zinc-950/50 rounded-xl p-3 border border-emerald-500/10 overflow-x-auto custom-scrollbar">
                {activeStage === "playoffs" ? (
                  <MiniPlayoffsBracket
                    slots={PLAYOFFS_SLOTS.map((s) => {
                      const sTypeIdx = PLAYOFFS_SLOTS.filter(
                        (x) => x.type === s.type,
                      ).findIndex((x) => x.id === s.id);
                      return {
                        ...s,
                        teamId:
                          ACTUAL_RESULTS[activeStage]?.filter(
                            (x: any) => x.type === s.type,
                          )[sTypeIdx]?.teamId || undefined,
                        resultStatus: "unknown",
                      };
                    })}
                  />
                ) : (
                  <MiniPicksDisplay
                    title30="3:0 晋级"
                    slots30={Array(2)
                      .fill(null)
                      .map((_, i) => ({
                        id: `r30-${i}`,
                        type: "3-0" as SlotType,
                        teamId:
                          ACTUAL_RESULTS[activeStage]?.filter(
                            (s: any) => s.type === "3-0",
                          )[i]?.teamId || undefined,
                        resultStatus: "unknown",
                      }))}
                    titleAdvance="3:1 3:2 晋级"
                    slotsAdvance={Array(6)
                      .fill(null)
                      .map((_, i) => ({
                        id: `ra-${i}`,
                        type: "advance" as SlotType,
                        teamId:
                          ACTUAL_RESULTS[activeStage]?.filter(
                            (s: any) => s.type === "advance",
                          )[i]?.teamId || undefined,
                        resultStatus: "unknown",
                      }))}
                    title03="0:3 淘汰"
                    slots03={Array(2)
                      .fill(null)
                      .map((_, i) => ({
                        id: `r03-${i}`,
                        type: "0-3" as SlotType,
                        teamId:
                          ACTUAL_RESULTS[activeStage]?.filter(
                            (s: any) => s.type === "0-3",
                          )[i]?.teamId || undefined,
                        resultStatus: "unknown",
                      }))}
                  />
                )}
              </div>
            </div>

            {communityPicks.length === 0 ? (
              <div className="col-span-full py-12 text-center text-zinc-500 dark:text-zinc-500 text-sm font-bold opacity-80 flex flex-col items-center justify-center gap-2">
                <FileText className="w-8 h-8 opacity-40" />
                暂无社区预测数据
              </div>
            ) : (
              sortedCommunityPicks.map((participant) => {
                const theirPicks = participant.picks[activeStage] || [];
                const statusData = getSetStatus(theirPicks, activeStage);
                const statusStyles = getStatusStyles(statusData);
                const isInitialSimulating = isRefreshing && statusData?.passingProbability === undefined;

                if (activeStage === "playoffs") {
                  return (
                    <div
                      key={participant.id}
                      className={cn(
                        "bg-white dark:bg-zinc-900 border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm hover:shadow-md duration-500 transition-all",
                        statusStyles.border
                      )}
                    >
                      <div className="flex items-center justify-between min-h-[32px]">
                        <div className="font-black text-[15px] text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                          <div className={cn("w-2 h-2 rounded-full duration-500 transition-colors", statusStyles.bg)}></div>
                          {participant.name}
                        </div>
                        <motion.div
                          layout
                          animate={{
                            opacity: isRefreshing ? (isInitialSimulating ? 0 : 0.4) : 1,
                            scale: isRefreshing && !isInitialSimulating ? 0.95 : 1,
                            filter: isRefreshing && !isInitialSimulating ? "blur(2px) grayscale(50%)" : "blur(0px) grayscale(0%)",
                            x: isRefreshing && isInitialSimulating ? 15 : 0
                          }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 20,
                            mass: 0.8
                          }}
                        >
                          <PickSetStatusText
                            statusData={statusData}
                            showProbability={showProbabilityInSummary}
                          />
                        </motion.div>
                      </div>
                      <div className="bg-zinc-50/80 dark:bg-zinc-950/50 rounded-xl p-4 border border-black/5 dark:border-white/5 overflow-x-auto custom-scrollbar">
                        <MiniPlayoffsBracket
                          slots={PLAYOFFS_SLOTS.map((s) => {
                            const pick = theirPicks.find(
                              (p) => p.id === s.id || p.id === `playoffs-${s.id}`,
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
                              teamId = qfActuals[sTypeIdx]?.teamId || null;
                            }

                            return {
                              ...s,
                              teamId: teamId,
                              resultStatus: "unknown",
                            };
                          })}
                        />
                      </div>
                    </div>
                  );
                }

                // Swiss Stage Logic
                const picks30 = theirPicks.filter((s) => s.type === "3-0");
                const sorted30Picks = [...picks30]
                  .sort((a, b) => {
                    const aKey = a.teamId ? `3-0-${a.teamId}` : null;
                    const bKey = b.teamId ? `3-0-${b.teamId}` : null;
                    if (!aKey && !bKey) return 0;
                    if (!aKey) return 1;
                    if (!bKey) return -1;
                    const freqDiff =
                      (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0);
                    if (freqDiff !== 0) return freqDiff;
                    return a.teamId!.localeCompare(b.teamId!);
                  })
                  .map((s) => {
                    const clash = statusData?.clashes?.find(
                      (c: any) => c.slotId === s.id,
                    );
                    return {
                      ...s,
                      resultStatus: checkPrediction(
                        s.teamId,
                        "3-0",
                        activeStage,
                      ),
                      clashType: clash?.type,
                    };
                  });

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
                    const freqDiff =
                      (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0);
                    if (freqDiff !== 0) return freqDiff;
                    return a.teamId!.localeCompare(b.teamId!);
                  })
                  .map((s) => {
                    const clash = statusData?.clashes?.find(
                      (c: any) => c.slotId === s.id,
                    );
                    return {
                      ...s,
                      resultStatus: checkPrediction(
                        s.teamId,
                        "advance",
                        activeStage,
                      ),
                      clashType: clash?.type,
                    };
                  });

                const elimPicks = theirPicks.filter((s) => s.type === "0-3");
                const sortedElimPicks = [...elimPicks]
                  .sort((a, b) => {
                    const aKey = a.teamId ? `0-3-${a.teamId}` : null;
                    const bKey = b.teamId ? `0-3-${b.teamId}` : null;
                    if (!aKey && !bKey) return 0;
                    if (!aKey) return 1;
                    if (!bKey) return -1;
                    const freqDiff =
                      (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0);
                    if (freqDiff !== 0) return freqDiff;
                    return a.teamId!.localeCompare(b.teamId!);
                  })
                  .map((s) => {
                    const clash = statusData?.clashes?.find(
                      (c: any) => c.slotId === s.id,
                    );
                    return {
                      ...s,
                      resultStatus: checkPrediction(
                        s.teamId,
                        "0-3",
                        activeStage,
                      ),
                      clashType: clash?.type,
                    };
                  });

                return (
                  <div
                    key={participant.id}
                    className={cn(
                      "bg-white dark:bg-zinc-900 border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm hover:shadow-md duration-500 transition-all",
                      statusStyles.border
                    )}
                  >
                    <div className="flex items-center justify-between min-h-[32px]">
                      <div className="font-black text-[15px] text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                        <div className={cn("w-2 h-2 rounded-full duration-500 transition-colors", statusStyles.bg)}></div>
                        {participant.name}
                      </div>
                      <motion.div
                        layout
                        animate={{
                          opacity: isRefreshing ? (isInitialSimulating ? 0 : 0.4) : 1,
                          scale: isRefreshing && !isInitialSimulating ? 0.95 : 1,
                          filter: isRefreshing && !isInitialSimulating ? "blur(2px) grayscale(50%)" : "blur(0px) grayscale(0%)",
                          x: isRefreshing && isInitialSimulating ? 15 : 0
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 20,
                          mass: 0.8
                        }}
                      >
                        <PickSetStatusText
                          statusData={statusData}
                          showProbability={showProbabilityInSummary}
                        />
                      </motion.div>
                    </div>
                    <div className="bg-zinc-50/80 dark:bg-zinc-950/50 rounded-xl p-3 border border-black/5 dark:border-white/5 overflow-x-auto custom-scrollbar">
                      <MiniPicksDisplay
                        title30="3:0 晋级"
                        slots30={sorted30Picks}
                        titleAdvance="3:1 3:2 晋级"
                        slotsAdvance={sortedAdvancePicks}
                        title03="0:3 淘汰"
                        slots03={sortedElimPicks}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  },
);
