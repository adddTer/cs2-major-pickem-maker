import React from "react";
import { PickSlot, StageKey, SlotType } from "../types";
import { cn } from "../lib/utils";
import { CheckCircle2, Clock } from "lucide-react";
import { SwissBracket } from "../components/SwissBracket";
import { PickEmDock } from "../components/PickEmDock";
import { PlayoffsBracket } from "../components/PlayoffsBracket";
import { TeamLogo } from "../components/TeamLogo";

interface EditViewProps {
  newNickname: string;
  setNewNickname: (val: string) => void;
  handleSavePick: () => void;
  activeStage: StageKey;
  setActiveStage: (val: StageKey) => void;
  picks: Record<string, PickSlot[]>;
  setPicks: React.Dispatch<React.SetStateAction<Record<string, PickSlot[]>>>;
  defaultPicks: Record<string, PickSlot[]>;
  currentSlots: PickSlot[];
  showResults: boolean;
  setShowResults: (val: boolean) => void;
  mobileView: "picks" | "bracket";
  setMobileView: (val: "picks" | "bracket") => void;
  getStageStatus: (s: string) => string;
  currentPoolTeams: any[];
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
  handleDrop: (e: React.DragEvent, slotId: string) => void;
  handleAssignSlot: (teamId: string, slotId: string) => void;
  handleClear: (slotId: string) => void;
  checkPrediction: (
    teamId: string | null,
    type: SlotType,
    stage: string,
  ) => "correct" | "incorrect" | "unknown";
  activeStageActuals: PickSlot[];
  getSetStatus: (picks: PickSlot[], stage: string) => any;
}

export const EditView: React.FC<EditViewProps> = ({
  newNickname,
  setNewNickname,
  handleSavePick,
  activeStage,
  setActiveStage,
  picks,
  setPicks,
  defaultPicks,
  currentSlots,
  showResults,
  setShowResults,
  mobileView,
  setMobileView,
  getStageStatus,
  currentPoolTeams,
  selectedTeamId,
  setSelectedTeamId,
  handleDrop,
  handleAssignSlot,
  handleClear,
  checkPrediction,
  activeStageActuals,
  getSetStatus,
}) => {
  return (
    <>
      {/* Left Sidebar */}
      <div className="w-full lg:w-[300px] flex flex-col bg-white/40 dark:bg-zinc-900/40 border border-black/5 dark:border-white/5 rounded-[2rem] shrink-0 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative backdrop-blur-xl lg:overflow-hidden">
        <div className="p-6 lg:p-8 bg-white/60 dark:bg-black/20 shrink-0 lg:border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row lg:flex-col justify-between sm:items-center lg:items-start gap-4">
          <div>
            <h2 className="text-[15px] lg:text-base font-display font-black tracking-wide mb-1 lg:mb-2 text-zinc-900 dark:text-zinc-100 flex items-center gap-2 drop-shadow-sm">
              当前活跃的竞猜
            </h2>
            <p className="text-[0.6875rem] lg:text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
              正在编辑{" "}
              <span className="text-blue-500 font-bold">{newNickname}</span>
            </p>
          </div>

          <div className="flex lg:hidden items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              className="bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 flex-1 min-w-0 transition-all font-medium placeholder:text-zinc-400"
              placeholder="预测 ID"
            />
            <button
              onClick={handleSavePick}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all rounded-xl flex items-center gap-2 shrink-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" /> 保存
            </button>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 overflow-y-auto px-8 py-8 flex-col gap-8 z-10">
          <div className="flex flex-col gap-3">
            <label className="text-[0.6875rem] font-display font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              预测 ID
            </label>
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              className="bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium shadow-sm"
            />
          </div>

          <button
            onClick={handleSavePick}
            className="mt-auto px-6 py-3.5 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            <CheckCircle2 className="w-4 h-4" /> 保存竞猜
          </button>
        </div>
      </div>

      {/* Right Main Pick'Em Board */}
      <div className="flex-1 flex flex-col bg-white/40 dark:bg-zinc-900/40 border border-black/5 dark:border-white/5 rounded-[2rem] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative backdrop-blur-xl overflow-hidden min-h-[600px] lg:min-h-0">
        {/* Tabs Header */}
        <div className="h-16 border-b border-black/5 dark:border-white/5 flex items-center px-6 justify-between bg-white/60 dark:bg-black/20 shrink-0 gap-4 overflow-x-auto custom-scrollbar backdrop-blur-md">
          <div className="flex bg-zinc-200/50 dark:bg-zinc-900/50 p-1 rounded-xl shadow-inner border border-black/5 dark:border-white/5 shrink-0">
            {[
              { id: "stage1", label: "第一阶段" },
              { id: "stage2", label: "第二阶段" },
              { id: "stage3", label: "第三阶段" },
              { id: "playoffs", label: "决胜阶段" },
            ].map((tab) => {
              const isActive = activeStage === tab.id;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveStage(tab.id as StageKey)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-display font-medium cursor-pointer transition-all duration-300 flex items-center whitespace-nowrap",
                    isActive
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-md ring-1 ring-black/5 dark:ring-white/10"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5",
                  )}
                >
                  {isActive ? (
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block mr-2 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full inline-block mr-2"></span>
                  )}
                  {tab.label}
                </div>
              );
            })}
          </div>
        </div>
        {/* Content Area */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden min-h-0 relative">
          {/* Mobile View Toggle */}
          {activeStage !== "playoffs" && (
            <div className="xl:hidden flex items-center justify-center p-3 bg-zinc-100 dark:bg-zinc-900 border-b border-black/5 dark:border-white/5 gap-3 shrink-0 z-20 sticky top-0">
              <button
                onClick={() => setMobileView("picks")}
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-[8px] transition-all",
                  mobileView === "picks"
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 shadow-inner"
                    : "text-zinc-500 dark:text-zinc-500 bg-zinc-200/20 dark:bg-black/20 hover:text-zinc-800 dark:text-zinc-300 border border-transparent",
                )}
              >
                选择竞猜
              </button>
              <button
                onClick={() => setMobileView("bracket")}
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-[8px] transition-all",
                  mobileView === "bracket"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-inner"
                    : "text-zinc-500 dark:text-zinc-500 bg-zinc-200/20 dark:bg-black/20 hover:text-zinc-800 dark:text-zinc-300 border border-transparent",
                )}
              >
                查看对阵图
              </button>
            </div>
          )}

          {/* Team Drag Source Pool */}
          {activeStage !== "playoffs" && (
            <div
              className={cn(
                "w-full xl:w-[320px] p-4 lg:p-6 flex-col border-b xl:border-r border-black/5 dark:border-white/5 bg-zinc-100/30 dark:bg-zinc-900/30 shrink-0 z-10 xl:overflow-hidden",
                mobileView === "picks" ? "flex" : "hidden xl:flex",
              )}
            >
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 mb-2 xl:mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 opacity-60" />{" "}
                {getStageStatus(activeStage)}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-[24px] h-[24px] bg-zinc-200/40 dark:bg-black/40 flex items-center justify-center rounded-full opacity-60 shrink-0">
                  <div className="w-[14px] h-[14px] border-2 border-dashed border-zinc-500 rounded-full"></div>
                </div>
                <p className="text-[0.6875rem] text-zinc-500 dark:text-zinc-500 font-medium">
                  点击队伍选择，然后点击下方槽位填入；或直接拖动。
                </p>
              </div>

              {activeStage !== "stage1" &&
                activeStage !== "playoffs" &&
                currentPoolTeams.length < 16 && (
                  <div className="text-[0.6875rem] text-orange-400/90 mb-4 bg-orange-500/10 p-3 rounded border border-orange-500/20 shadow-inner">
                    请先在上一阶段选择8支晋级队伍。
                  </div>
                )}

              <div className="grid grid-rows-2 grid-flow-col auto-cols-max overflow-x-auto xl:auto-cols-auto xl:grid-rows-none xl:grid-flow-row xl:grid-cols-3 gap-2 sm:gap-3 flex-none xl:flex-1 content-start xl:overflow-y-auto pr-2 pb-2 xl:pb-10 custom-scrollbar">
                {currentPoolTeams.map((team) => {
                  const isPlaced = currentSlots.some(
                    (s) => s.teamId === team.id,
                  );
                  const isSelected = selectedTeamId === team.id;
                  return (
                    <div
                      key={team.id}
                      draggable={!isPlaced}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("teamId", team.id);
                        e.dataTransfer.effectAllowed = "copyMove";
                      }}
                      onClick={() => {
                        if (isPlaced) return;
                        setSelectedTeamId(isSelected ? null : team.id);
                      }}
                      className={cn(
                        "w-[40px] h-[40px] sm:w-[52px] sm:h-[52px] xl:w-[60px] xl:h-[60px] xl:mx-auto flex items-center justify-center rounded-[8px] transition-all bg-zinc-200/20 dark:bg-black/20 hover:bg-black/10 dark:bg-white/10 shrink-0",
                        isPlaced
                          ? "opacity-15 grayscale pointer-events-none"
                          : "cursor-pointer active:cursor-grabbing border",
                        isSelected
                          ? "border-blue-500 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                          : "border-transparent hover:border-black/20 dark:border-white/20 hover:shadow-md",
                      )}
                    >
                      <div className="w-[26px] h-[26px] sm:w-[36px] sm:h-[36px] xl:w-[42px] xl:h-[42px] flex items-center justify-center pointer-events-none">
                        <TeamLogo
                          team={team}
                          fallbackClasses="rounded-[4px] text-[0.625rem] sm:text-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main PickEm Area Layout */}
          <div
            className={cn(
              "flex-1 flex flex-col min-w-0 overflow-hidden relative",
              mobileView === "picks" && activeStage !== "playoffs"
                ? "bg-transparent"
                : "bg-zinc-50/20 dark:bg-zinc-950/20 xl:mx-4 xl:my-4 rounded-xl xl:border border-black/5 dark:border-white/5 shadow-inner",
            )}
          >
            {activeStage === "playoffs" ? (
              <div className="flex-1 w-full min-h-[60vh] h-full relative">
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-zinc-200/40 dark:bg-black/40 backdrop-blur border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-[4px]">
                  <Clock className="w-4 h-4 opacity-70 text-zinc-800 dark:text-zinc-300" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-300">
                    {getStageStatus(activeStage)}
                  </span>
                </div>
                <div className="absolute top-4 right-4 z-20">
                  <button
                    onClick={() => setShowResults(!showResults)}
                    className={cn(
                      "px-3 py-1.5 border border-black/10 dark:border-white/10 rounded-[3px] transition-colors text-[0.6875rem] font-bold",
                      showResults
                        ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "bg-zinc-200/40 dark:bg-black/40 hover:bg-black/10 dark:bg-white/10 text-zinc-500 dark:text-zinc-600 dark:text-zinc-400",
                    )}
                  >
                    {showResults ? "隐藏实际赛果" : "展示比赛结果"}
                  </button>
                </div>
                <PlayoffsBracket
                  slots={currentSlots}
                  showResults={showResults}
                  onDrop={handleDrop}
                  onClick={(slotId, teamId) => {
                    if (selectedTeamId) {
                      handleAssignSlot(selectedTeamId, slotId);
                      setSelectedTeamId(null);
                    } else if (teamId) {
                      const isQF = slotId.includes("qf-");
                      const isSF = slotId.includes("sf-");
                      const isFinal = slotId.includes("final-");

                      if (isQF) {
                        const qfNum = parseInt(slotId.split("-")[2]);
                        const targetSf = `playoffs-sf-${Math.ceil(qfNum / 2)}`;
                        handleAssignSlot(teamId, targetSf);
                      } else if (isSF) {
                        const sfNum = parseInt(slotId.split("-")[2]);
                        const targetFinal = `playoffs-final-${Math.ceil(sfNum / 2)}`;
                        handleAssignSlot(teamId, targetFinal);
                      } else if (isFinal) {
                        handleAssignSlot(teamId, "playoffs-champion");
                      } else {
                        handleClear(slotId);
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "w-full xl:flex-1 h-full xl:h-auto items-center justify-center relative overflow-hidden bg-zinc-50/40 dark:bg-zinc-950/40",
                    mobileView === "bracket" ? "flex flex-1" : "hidden xl:flex",
                  )}
                >
                  <SwissBracket activeStage={activeStage} />
                </div>

                {(() => {
                  const statusData =
                    activeStage !== "playoffs"
                      ? getSetStatus(currentSlots, activeStage)
                      : null;
                  return (
                    <div
                      className={cn(
                        "w-full bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md shrink-0 shadow-[0_-15px_30px_rgba(0,0,0,0.5)] border-t border-black/5 dark:border-white/5 z-20 overflow-y-auto p-4 xl:p-6 pb-6 lg:flex-none relative",
                        mobileView === "picks"
                          ? "flex-1 xl:flex-none block"
                          : "hidden xl:block",
                      )}
                    >
                      <PickEmDock
                        slots={currentSlots.map((s) => {
                          const clash = statusData?.clashes?.find(
                            (c: any) => c.slotId === s.id,
                          );
                          return {
                            ...s,
                            resultStatus: showResults
                              ? checkPrediction(s.teamId, s.type, activeStage)
                              : undefined,
                            clashType: clash?.type,
                          };
                        })}
                        actualResults={activeStageActuals}
                        showResults={showResults}
                        onToggleResults={() => setShowResults(!showResults)}
                        onDrop={handleDrop}
                        onClick={(slotId, teamId) => {
                          if (selectedTeamId) {
                            handleAssignSlot(selectedTeamId, slotId);
                            setSelectedTeamId(null);
                          } else if (teamId) {
                            handleClear(slotId);
                          }
                        }}
                      />
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
