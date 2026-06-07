import React from "react";
import { PickSlot, StageKey, SlotType } from "../types";
import { cn } from "../lib/utils";
import { CheckCircle2, Clock, Trash2 } from "lucide-react";
import { PickEmDock } from "./PickEmDock";
import { TeamLogo } from "./TeamLogo";
import { MiniPlayoffsBracket } from "./MiniPlayoffsBracket";

interface PickemWidgetProps {
  newNickname: string;
  setNewNickname: (val: string) => void;
  handleSavePick: () => void;
  activeStage: StageKey;
  currentPoolTeams: any[];
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
  currentSlots: PickSlot[];
  handleDrop: (e: React.DragEvent, slotId: string) => void;
  handleAssignSlot: (teamId: string, slotId: string) => void;
  handleClear: (slotId: string) => void;
  activeStageActuals: PickSlot[];
  checkPrediction: (
    teamId: string | null,
    type: SlotType,
    stage: string,
  ) => "correct" | "incorrect" | "unknown";
  getSetStatus: (picks: PickSlot[], stage: string) => any;
  showResults: boolean;
  setShowResults: (val: boolean) => void;
  getStageStatus: (s: string) => string;
}

export const PickemWidget: React.FC<PickemWidgetProps> = ({
  newNickname,
  setNewNickname,
  handleSavePick,
  activeStage,
  currentPoolTeams,
  selectedTeamId,
  setSelectedTeamId,
  currentSlots,
  handleDrop,
  handleAssignSlot,
  handleClear,
  activeStageActuals,
  checkPrediction,
  getSetStatus,
  showResults,
  setShowResults,
  getStageStatus,
}) => {
  const statusData =
    activeStage !== "playoffs" ? getSetStatus(currentSlots, activeStage) : null;

  return (
    <div className="flex flex-col gap-6 w-full h-full relative">
      {/* 1. Predict ID & Save */}
      <div className="flex flex-col gap-3 p-4 bg-black/40 rounded-xl border border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
            预测昵称 / ID
          </span>
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {getStageStatus(activeStage)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500 transition-colors shadow-inner w-full"
            placeholder="输入昵称..."
          />
          <button
            onClick={handleSavePick}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors rounded-lg flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-blue-900/20"
          >
            <CheckCircle2 className="w-4 h-4" /> 保存
          </button>
        </div>
      </div>

      {/* 2. Drag Source Pool */}
      <div className="flex flex-col gap-3 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
        <div className="text-[11px] text-zinc-400 font-medium">
          点击队伍，再点击下方槽位；或直接拖动。
        </div>
        {activeStage === "playoffs" && currentPoolTeams.length < 8 && (
          <div className="text-[11px] text-amber-500 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
            请先在第三阶段竞猜或等待实际比赛完成，以获得 8 支晋级队伍。
          </div>
        )}
        {activeStage !== "stage1" &&
          activeStage !== "playoffs" &&
          currentPoolTeams.length < 16 && (
            <div className="text-[11px] text-amber-500 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
              请先在上一阶段填满 8 支晋级队伍。
            </div>
          )}
        <div className="flex gap-2.5 flex-wrap">
          {currentPoolTeams.map((team) => {
            const isPlaced =
              activeStage !== "playoffs"
                ? currentSlots.some((s) => s.teamId === team.id)
                : false; // In playoffs, teams can be placed multiple times
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
                  "w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] flex items-center justify-center rounded-[6px] transition-all bg-black/40 border shrink-0",
                  isPlaced
                    ? "opacity-20 grayscale pointer-events-none border-transparent"
                    : "cursor-pointer active:cursor-grabbing hover:bg-white/10 hover:border-white/20",
                  isSelected
                    ? "border-blue-500 bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                    : "border-white/5",
                )}
              >
                <div className="w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] flex items-center justify-center pointer-events-none">
                  <TeamLogo
                    team={team}
                    fallbackClasses="rounded-[4px] text-[10px]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PickEm Slots */}
      <div className="flex flex-col gap-3">
        {activeStage === "playoffs" ? (
          <div className="w-full bg-zinc-900/50 p-4 rounded-xl border border-white/5 overflow-x-hidden">
            <MiniPlayoffsBracket
              slots={currentSlots.map((s) => ({
                ...s,
                resultStatus: showResults
                  ? checkPrediction(s.teamId, s.type, activeStage)
                  : undefined,
              }))}
              readOnly={false}
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
        ) : (
          <div className="w-full">
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
        )}
      </div>
    </div>
  );
};
