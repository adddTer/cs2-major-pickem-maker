import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { DialogManager, dialog } from "../components/DialogManager";
import { PLAYOFFS_SLOTS } from "../data/teams";
import { PlayoffsBracket } from "../components/PlayoffsBracket";
import { GlobalSimulationResult } from "../utils/simulateGlobal";
import { BracketMatch, TournamentEvent } from "../types";

import { MatchDialog } from "../components/MatchDialog";
import { TeamLogo } from "../components/TeamLogo";
import { TEAMS } from "../data/teams";

interface GlobalSimulationViewProps {
  currentMatches: any;
  computedActuals: any;
  onMatchClick?: (m: BracketMatch) => void;
  currentEvent?: TournamentEvent;
}

export function GlobalSimulationView({
  currentMatches,
  computedActuals,
  onMatchClick,
  currentEvent,
}: GlobalSimulationViewProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<GlobalSimulationResult | null>(null);
  const [activeTab, setActiveTab] = useState<
    "stage1" | "stage2" | "stage3" | "playoffs"
  >("playoffs");
  const [selectedSlotForModal, setSelectedSlotForModal] = useState<
    string | null
  >(null);

  useEffect(() => {
    const key = currentEvent ? `globalSimResultCSGOE5_${currentEvent.id}` : "globalSimResultCSGOE5";
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setResult(JSON.parse(saved));
      } catch (e) {}
    } else {
      setResult(null); // Reset when switching events
    }
  }, [currentEvent]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setProgress(0);

    const worker = new Worker(
      new URL("../workers/simulateGlobalWorker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (e) => {
      if (e.data.type === "progress") {
        setProgress(e.data.progress);
      } else if (e.data.type === "done") {
        setIsSimulating(false);
        const res = e.data.result;
        setResult(res);
        const key = currentEvent ? `globalSimResultCSGOE5_${currentEvent.id}` : "globalSimResultCSGOE5";
        localStorage.setItem(key, JSON.stringify(res));
        worker.terminate();
      }
    };

    worker.postMessage({
      currentMatches,
      computedActuals,
      numSimulations: 1000000,
      isSwissAllBo3: currentEvent?.isSwissAllBo3,
      currentEventId: currentEvent?.id,
    });
  };

  const getOverallFreq = React.useCallback(
    (teamId: string, stageFreqMap: Record<string, Record<string, number>>) => {
      if (!stageFreqMap) return 0;
      let total = 0;
      for (const slotMap of Object.values(stageFreqMap)) {
        total += slotMap[teamId] || 0;
      }
      return total;
    },
    [],
  );

  const logicalBracket = React.useMemo(() => {
    if (!result || !result.playoffsFreq || !result.qfFreq) return {};

    const assignment: Record<string, string> = {};
    const usedTeams = new Set<string>();

    // Helper to get top team for a slot, avoiding duplicates if possible
    const getTopTeamForSlot = (slotMap: Record<string, number> | undefined) => {
      if (!slotMap) return undefined;
      const sorted = Object.entries(slotMap).sort((a, b) => b[1] - a[1]);
      for (const [teamId] of sorted) {
        if (!usedTeams.has(teamId)) {
          return teamId;
        }
      }
      return sorted[0]?.[0]; // Fallback to literal highest if all are used
    };

    // QF
    for (let i = 1; i <= 8; i++) {
       const slotId = `qf-${i}`;
       const team = getTopTeamForSlot(result.qfFreq?.[slotId]);
       if (team) {
         assignment[slotId] = team;
         usedTeams.add(team);
       }
    }

    // SF
    const getWinner = (
      t1: string | undefined,
      t2: string | undefined,
      stageFreqMap: Record<string, Record<string, number>>,
    ) => {
      if (!t1 && !t2) return undefined;
      if (!t1) return t2;
      if (!t2) return t1;
      const c1 = getOverallFreq(t1, stageFreqMap);
      const c2 = getOverallFreq(t2, stageFreqMap);
      return c1 >= c2 ? t1 : t2;
    };

    const sf1Winner = getWinner(
      assignment["qf-1"],
      assignment["qf-2"],
      result.sfFreq,
    );
    const sf2Winner = getWinner(
      assignment["qf-3"],
      assignment["qf-4"],
      result.sfFreq,
    );
    const sf3Winner = getWinner(
      assignment["qf-5"],
      assignment["qf-6"],
      result.sfFreq,
    );
    const sf4Winner = getWinner(
      assignment["qf-7"],
      assignment["qf-8"],
      result.sfFreq,
    );

    if (sf1Winner) assignment["sf-1"] = sf1Winner;
    if (sf2Winner) assignment["sf-2"] = sf2Winner;
    if (sf3Winner) assignment["sf-3"] = sf3Winner;
    if (sf4Winner) assignment["sf-4"] = sf4Winner;

    // Final
    const final1Winner = getWinner(sf1Winner, sf2Winner, result.finalFreq);
    const final2Winner = getWinner(sf3Winner, sf4Winner, result.finalFreq);

    if (final1Winner) assignment["final-1"] = final1Winner;
    if (final2Winner) assignment["final-2"] = final2Winner;

    // Champion
    if (final1Winner && final2Winner) {
      const c1 = result.championFreq?.[final1Winner] || 0;
      const c2 = result.championFreq?.[final2Winner] || 0;
      assignment["champion"] = c1 >= c2 ? final1Winner : final2Winner;
    } else {
      assignment["champion"] = final1Winner || final2Winner || "";
    }

    return assignment;
  }, [result, getOverallFreq]);

  const bracketSlots = React.useMemo(() => {
    if (!result) return [];
    return PLAYOFFS_SLOTS.map((s) => {
      let teamId = logicalBracket[s.id] || null;
      let bottomText = undefined;

      if (s.type === "qf" && teamId) {
        const prob =
          (getOverallFreq(teamId, result.sfFreq) / result.totalSims) * 100;
        bottomText = prob > 0 ? `${prob.toFixed(1)}%` : undefined;
      }

      if (s.type === "sf" && teamId) {
        const prob =
          (getOverallFreq(teamId, result.finalFreq) / result.totalSims) * 100;
        bottomText = prob > 0 ? `${prob.toFixed(1)}%` : undefined;
      }

      if (s.type === "final" && teamId) {
        const champCount = result.championFreq?.[teamId] || 0;
        const prob = (champCount / result.totalSims) * 100;
        bottomText = prob > 0 ? `${prob.toFixed(1)}%` : undefined;
      }

      if (s.type === "champion" && teamId) {
        const champCount = result.championFreq?.[teamId] || 0;
        const prob = (champCount / result.totalSims) * 100;
        bottomText = prob > 0 ? `${prob.toFixed(1)}%` : undefined;
      }

      return { ...s, id: `playoffs-${s.id}`, teamId, bottomText };
    });
  }, [result, logicalBracket, getOverallFreq]);

  const topChampions = React.useMemo(() => {
    if (!result || !result.championFreq) return [];
    return Object.entries(result.championFreq)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([id, p]) => ({
        team: TEAMS.find((t) => t.id === id),
        prob: (((p as number) / result.totalSims) * 100).toFixed(1),
      }))
      .filter((x) => x.team);
  }, [result]);

  const renderStageLeaderboard = (
    freqMap: Record<string, number>,
    title: string,
    colorClass: string,
  ) => {
    if (!result || !freqMap) return null;
    const sorted = Object.entries(freqMap)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .map(([id, p]) => ({
        team: TEAMS.find((t) => t.id === id),
        prob: (((p as number) / result.totalSims) * 100).toFixed(1),
      }))
      .filter((x) => x.team);

    return (
      <div className="flex-1 p-5 bg-zinc-100/60 dark:bg-zinc-900/60 rounded-xl border border-black/5 dark:border-white/5 shadow-xl relative overflow-hidden flex flex-col h-full transition-all duration-300">
        <div className={`absolute top-0 left-0 w-full h-1 ${colorClass}`} />
        <h3 className="text-xl font-bold mb-6 mt-2 text-center">{title}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
          {sorted.map((item, i) => (
            <div
              key={item.team?.id}
              className="flex items-center gap-3 p-3 bg-zinc-200/40 dark:bg-black/40 rounded-lg border border-black/5 dark:border-white/5 hover:border-black/10 dark:border-white/10 transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <TeamLogo team={item.team!} />
              </div>
              <span className="font-bold flex-1 truncate text-sm">
                {item.team?.shortName}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm shrink-0">
                {item.prob}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getModalProbabilities = () => {
    if (!result || !selectedSlotForModal) return null;

    let title = "";
    let freqMap: Record<string, number> = {};

    if (selectedSlotForModal.startsWith("qf-")) {
      const sfId =
        selectedSlotForModal === "qf-1" || selectedSlotForModal === "qf-2"
          ? "sf-1"
          : selectedSlotForModal === "qf-3" || selectedSlotForModal === "qf-4"
            ? "sf-2"
            : selectedSlotForModal === "qf-5" || selectedSlotForModal === "qf-6"
              ? "sf-3"
              : "sf-4";
      freqMap = result.sfFreq[sfId] || {};
      title = "完整概率分布";
    } else if (selectedSlotForModal.startsWith("sf-")) {
      const finalId =
        selectedSlotForModal === "sf-1" || selectedSlotForModal === "sf-2"
          ? "final-1"
          : "final-2";
      freqMap = result.finalFreq[finalId] || {};
      title = "完整概率分布";
    } else if (selectedSlotForModal.startsWith("final-")) {
      freqMap = result.championFreq || {};
      title = "完整概率分布";
    } else if (selectedSlotForModal === "champion") {
      freqMap = result.championFreq || {};
      title = "完整概率分布";
    }

    const sorted = Object.entries(freqMap)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .map(([id, p]) => ({
        team: TEAMS.find((t) => t.id === id),
        prob: (((p as number) / result.totalSims) * 100).toFixed(1),
      }))
      .filter((x) => x.team && Number(x.prob) > 0);

    return { title, data: sorted };
  };

  const modalData = getModalProbabilities();

  return (
    <div className="w-full h-full flex flex-col p-4 overflow-y-auto relative">
      {modalData && selectedSlotForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-200/60 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedSlotForModal(null)}
        >
          <div
            className="bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-zinc-200/20 dark:bg-black/20">
              <h3 className="font-bold text-lg">{modalData.title}</h3>
              <button
                onClick={() => setSelectedSlotForModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
              {modalData.data.map((item, i) => (
                <div
                  key={item.team?.id}
                  className="flex items-center gap-3 p-3 bg-zinc-200/40 dark:bg-black/40 rounded-lg border border-black/5 dark:border-white/5"
                >
                  <span className="text-zinc-500 dark:text-zinc-500 font-black w-6 text-center">
                    {i + 1}
                  </span>
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <TeamLogo team={item.team!} />
                  </div>
                  <span className="font-bold flex-1">{item.team?.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    {item.prob}%
                  </span>
                </div>
              ))}
              {modalData.data.length === 0 && (
                <div className="text-center text-zinc-500 dark:text-zinc-500 py-8">无足够数据</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center p-8 bg-zinc-100/40 dark:bg-zinc-900/40 rounded-xl border border-black/5 dark:border-white/5 mb-6">
        <h2 className="text-2xl font-bold mb-4">全局模拟</h2>
        <p className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 text-center mb-6 max-w-2xl text-sm leading-relaxed">
          从当前的赛况开始，向后推演整个赛程。
        </p>

        {isSimulating ? (
          <div className="w-full max-w-md flex flex-col items-center gap-3">
            <div className="w-full bg-white dark:bg-zinc-800 rounded-full h-2 overflow-hidden relative">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm font-mono text-zinc-500 dark:text-zinc-500">
              模拟中... {progress}%
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={handleRunSimulation}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-black dark:text-white font-bold rounded shadow-lg transition-all active:scale-95"
            >
              {result ? "重新模拟赛程" : "开始进行全盘模拟"}
            </button>
            {result && (
              <div className="text-sm text-zinc-500 dark:text-zinc-500 font-mono">
                基于已完成 {result.totalSims} 次模拟
              </div>
            )}
          </div>
        )}
      </div>

      {result && !isSimulating && (
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 pb-12">
          {/* Navigation Tabs */}
          <div className="flex justify-center mb-2">
            <div className="inline-flex bg-zinc-100/50 dark:bg-zinc-900/50 p-1 rounded-lg border border-black/5 dark:border-white/5">
              <button
                onClick={() => setActiveTab("stage1")}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "stage1" ? "bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-200 hover:bg-black/50 dark:bg-white/50 dark:bg-zinc-800/50"}`}
              >
                Stage 1
              </button>
              <button
                onClick={() => setActiveTab("stage2")}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "stage2" ? "bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-200 hover:bg-black/50 dark:bg-white/50 dark:bg-zinc-800/50"}`}
              >
                Stage 2
              </button>
              <button
                onClick={() => setActiveTab("stage3")}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "stage3" ? "bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-200 hover:bg-black/50 dark:bg-white/50 dark:bg-zinc-800/50"}`}
              >
                Stage 3
              </button>
              <button
                onClick={() => setActiveTab("playoffs")}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "playoffs" ? "bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-200 hover:bg-black/50 dark:bg-white/50 dark:bg-zinc-800/50"}`}
              >
                决胜阶段
              </button>
            </div>
          </div>

          {activeTab === "stage1" && (
            <div className="flex flex-col gap-6">
              {renderStageLeaderboard(
                result.stage2Freq,
                "晋级概率",
                "bg-gradient-to-r from-sky-600 to-blue-500",
              )}
            </div>
          )}

          {activeTab === "stage2" && (
            <div className="flex flex-col gap-6">
              {renderStageLeaderboard(
                result.stage3Freq,
                "晋级概率",
                "bg-gradient-to-r from-indigo-500 to-purple-500",
              )}
            </div>
          )}

          {activeTab === "stage3" && (
            <div className="flex flex-col gap-6">
              {renderStageLeaderboard(
                result.playoffsFreq,
                "晋级概率",
                "bg-gradient-to-r from-violet-500 to-fuchsia-500",
              )}
            </div>
          )}

          {activeTab === "playoffs" && (
            <div className="flex flex-col xl:flex-row gap-6 w-full">
              <div className="flex-1 p-4 bg-zinc-100/60 dark:bg-zinc-900/60 rounded-xl border border-black/5 dark:border-white/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-sky-500" />
                <h3 className="text-xl font-bold mb-6 text-center mt-2">
                  最有可能的决胜路线
                </h3>
                <div
                  className="w-full mx-auto relative scale-90 sm:scale-100 transform origin-top overflow-x-auto custom-scrollbar pb-8"
                  style={{ minHeight: "600px" }}
                >
                  <div className="min-w-[800px]">
                    <PlayoffsBracket
                      refreshTrigger={0}
                      slots={bracketSlots}
                      readOnly={true}
                      showResults={false}
                      disableAutoFill={true}
                      onClick={(slotId) =>
                        setSelectedSlotForModal(slotId.replace("playoffs-", ""))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="w-full xl:w-80 flex shrink-0 flex-col gap-4">
                <div className="p-5 bg-zinc-100/60 dark:bg-zinc-900/60 rounded-xl border border-black/5 dark:border-white/5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                  <h3 className="text-lg font-bold mb-4 mt-1 flex items-center gap-2">
                    <span>🏆 夺冠概率 TOP 5</span>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {topChampions.map((item, i) => (
                      <div
                        key={item.team?.id}
                        className="flex items-center gap-3 p-3 bg-zinc-200/40 dark:bg-black/40 rounded-lg border border-black/5 dark:border-white/5"
                      >
                        <span className="text-lg font-black text-zinc-500 dark:text-zinc-600 w-4 text-center">
                          {i + 1}
                        </span>
                        <div className="w-8 h-8 rounded bg-black/50 dark:bg-white/50 dark:bg-zinc-800/50 flex items-center justify-center">
                          <TeamLogo team={item.team!} />
                        </div>
                        <span className="font-bold flex-1">
                          {item.team?.shortName}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          {item.prob}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
