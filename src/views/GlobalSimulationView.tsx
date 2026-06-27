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
import { Play, Trophy, BarChart2, X } from "lucide-react";

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
    const key = currentEvent
      ? `globalSimResultCSGOE5_${currentEvent.id}`
      : "globalSimResultCSGOE5";
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
        const key = currentEvent
          ? `globalSimResultCSGOE5_${currentEvent.id}`
          : "globalSimResultCSGOE5";
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
      <div className="flex-1 p-6 sm:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col h-full">
        <h3 className="text-xl font-bold mb-8 mt-2 text-center text-zinc-900 dark:text-zinc-100 font-display">
          {title}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
          {sorted.map((item, i) => (
            <div
              key={item.team?.id}
              className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all shadow-sm"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-white dark:bg-zinc-800 rounded-full border border-zinc-100 dark:border-zinc-700">
                <TeamLogo team={item.team!} />
              </div>
              <span className="font-medium flex-1 truncate text-sm text-zinc-900 dark:text-zinc-100">
                {item.team?.shortName}
              </span>
              <div className="px-2.5 py-1 bg-white dark:bg-zinc-800 rounded-lg shrink-0 border border-zinc-100 dark:border-zinc-700 shadow-sm">
                <span className="text-zinc-600 dark:text-zinc-400 font-mono font-medium text-xs">
                  {item.prob}%
                </span>
              </div>
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
      title = "概率分布";
    } else if (selectedSlotForModal.startsWith("sf-")) {
      const finalId =
        selectedSlotForModal === "sf-1" || selectedSlotForModal === "sf-2"
          ? "final-1"
          : "final-2";
      freqMap = result.finalFreq[finalId] || {};
      title = "概率分布";
    } else if (selectedSlotForModal.startsWith("final-")) {
      freqMap = result.championFreq || {};
      title = "概率分布";
    } else if (selectedSlotForModal === "champion") {
      freqMap = result.championFreq || {};
      title = "概率分布";
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
    <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto relative custom-scrollbar bg-zinc-50 dark:bg-zinc-950">
      {modalData && selectedSlotForModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedSlotForModal(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100">
                {modalData.title}
              </h3>
              <button
                onClick={() => setSelectedSlotForModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex flex-col gap-2.5 custom-scrollbar">
              {modalData.data.map((item, i) => (
                <div
                  key={item.team?.id}
                  className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                >
                  <span className="text-zinc-400 dark:text-zinc-500 font-bold w-6 text-center text-sm">
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <TeamLogo team={item.team!} />
                  </div>
                  <span className="font-medium flex-1 text-zinc-900 dark:text-zinc-100">
                    {item.team?.name}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-300 font-mono font-medium text-xs bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm px-2 py-1 rounded-lg">
                    {item.prob}%
                  </span>
                </div>
              ))}
              {modalData.data.length === 0 && (
                <div className="text-center text-zinc-500 dark:text-zinc-400 py-12 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <BarChart2 className="w-6 h-6 text-zinc-400" />
                  </div>
                  <span className="text-sm">无足够数据</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 mb-8 shadow-sm relative overflow-hidden shrink-0">
        <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-3 text-zinc-900 dark:text-white relative z-10 text-center">
          全局赛事推演
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-8 max-w-lg text-sm sm:text-base relative z-10 px-4 leading-relaxed">
          基于当前赛况，向后推演整个赛程的概率分布
        </p>

        {isSimulating ? (
          <div className="w-full max-w-md flex flex-col items-center gap-4 relative z-10">
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden relative">
              <div
                className="bg-zinc-900 dark:bg-white h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">
              推演中... {progress}%
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
            <button
              onClick={handleRunSimulation}
              className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-sm sm:text-base rounded-2xl shadow-sm transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {result ? "重新推演赛程" : "开始全盘推演"}
            </button>
            {result && (
              <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-50 dark:bg-zinc-800/50 px-5 py-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                已完成 {result.totalSims.toLocaleString()} 次模拟
              </div>
            )}
          </div>
        )}
      </div>

      {result && !isSimulating && (
        <div className="w-full flex flex-col gap-6 pb-12 min-h-0 relative">
          {/* Navigation Tabs */}
          <div className="flex justify-center mb-2">
            <div className="flex p-1.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-x-auto hide-scrollbar max-w-full">
              {[
                { id: "stage1", label: "第一阶段" },
                { id: "stage2", label: "第二阶段" },
                { id: "stage3", label: "第三阶段" },
                { id: "playoffs", label: "决胜阶段" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-2.5 rounded-xl text-[0.8125rem] font-display font-medium cursor-pointer transition-all duration-300 flex items-center whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "stage1" && (
            <div className="flex flex-col gap-6">
              {renderStageLeaderboard(result.stage2Freq, "晋级概率")}
            </div>
          )}

          {activeTab === "stage2" && (
            <div className="flex flex-col gap-6">
              {renderStageLeaderboard(result.stage3Freq, "晋级概率")}
            </div>
          )}

          {activeTab === "stage3" && (
            <div className="flex flex-col gap-6">
              {renderStageLeaderboard(result.playoffsFreq, "晋级概率")}
            </div>
          )}

          {activeTab === "playoffs" && (
            <div className="flex flex-col xl:flex-row gap-6 w-full h-[50rem] xl:h-[37.5rem]">
              <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8">
                <h3 className="text-xl font-bold mb-4 text-center mt-2 text-zinc-900 dark:text-zinc-100 font-display shrink-0">
                  最有可能的决胜路线
                </h3>
                <div className="w-full flex-1 relative overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800/50">
                  <PlayoffsBracket
                    refreshTrigger={0}
                    slots={bracketSlots}
                    readOnly={true}
                    showResults={false}
                    disableAutoFill={true}
                    hideControls={true}
                    onClick={(slotId) =>
                      setSelectedSlotForModal(slotId.replace("playoffs-", ""))
                    }
                  />
                </div>
              </div>

              <div className="w-full xl:w-[20rem] flex shrink-0 flex-col gap-6 h-full overflow-y-auto custom-scrollbar xl:overflow-visible">
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                  <h3 className="text-lg font-bold mb-6 mt-2 flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-display">
                    <Trophy className="w-5 h-5 text-zinc-400" /> 夺冠概率 TOP 5
                  </h3>
                  <div className="flex flex-col gap-3">
                    {topChampions.map((item, i) => (
                      <div
                        key={item.team?.id}
                        className="group flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white" : i === 1 ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300" : i === 2 ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400" : "text-zinc-400"}`}
                        >
                          {i + 1}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center p-1 border border-zinc-100 dark:border-zinc-700">
                          <TeamLogo team={item.team!} />
                        </div>
                        <span className="font-medium flex-1 text-sm text-zinc-900 dark:text-zinc-100">
                          {item.team?.shortName}
                        </span>
                        <div className="px-2 py-1 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-100 dark:border-zinc-700 shadow-sm">
                          <span className="text-zinc-600 dark:text-zinc-300 font-mono font-medium text-xs">
                            {item.prob}%
                          </span>
                        </div>
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
