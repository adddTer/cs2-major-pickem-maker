import React from "react";
import { PickSlot } from "../types";
import { cn } from "../lib/utils";
import { SlotBox } from "./SlotBox";
import { TEAMS } from "../data/teams";

export const MiniPlayoffsBracket: React.FC<{
  slots: (PickSlot & {
    resultStatus?: "correct" | "incorrect" | "unknown";
    clashType?: "x-one" | "x-fail" | "x-pass";
  })[];
  compact?: boolean;
  showTeamNames?: boolean;
  isExport?: boolean;
  readOnly?: boolean;
  onDrop?: (e: React.DragEvent, slotId: string) => void;
  onClick?: (slotId: string, teamId: string | null) => void;
}> = ({
  slots,
  compact,
  showTeamNames,
  isExport = false,
  readOnly = true,
  onDrop,
  onClick,
}) => {
  const renderSlot = (
    s: PickSlot & {
      resultStatus?: "correct" | "incorrect" | "unknown";
      clashType?: "x-one" | "x-fail" | "x-pass";
    },
    i: number,
  ) => (
    <div
      key={s.id || i}
      className={`flex items-center gap-1.5 flex-col ${isExport ? "w-[44px]" : "w-[36px] sm:w-[44px]"}`}
    >
      <SlotBox
        slot={s}
        border="border-white/10"
        readOnly={readOnly}
        size={compact ? "xs" : "sm"}
        onDrop={onDrop}
        onClick={onClick}
      />
      {showTeamNames && s.teamId && (
        <div className="text-[9px] text-center font-bold text-zinc-400 break-words leading-[1.1] max-w-full truncate">
          {TEAMS.find((t) => t.id === s.teamId)?.shortName}
        </div>
      )}
    </div>
  );

  const sfSlots = slots.filter((s) => s.type === "sf");
  const finalSlots = slots.filter((s) => s.type === "final");
  const champSlot = slots.filter((s) => s.type === "champion");

  return (
    <div className="w-full overflow-x-hidden pt-2 pr-2 pb-2">
      <div
        className={cn(
          "flex items-stretch justify-between w-full",
          compact ? "gap-1 sm:gap-2" : "gap-2 sm:gap-3",
        )}
      >
        {/* 1/4决赛胜者 (4 Slots) */}
        <div
          className={`flex flex-col shrink-0 flex-[4] ${compact ? (isExport ? "gap-1" : "gap-0.5 sm:gap-1") : isExport ? "gap-2" : "gap-1.5 sm:gap-2"}`}
        >
          {sfSlots.length > 0 ? (
            <>
              {!compact && (
                <span
                  className={`font-bold text-zinc-400 whitespace-nowrap ${isExport ? "text-[10px] text-left" : "text-[9px] sm:text-[10px] text-center sm:text-left truncate"}`}
                >
                  1/4 决赛胜者
                </span>
              )}
              <div
                className={cn(
                  "grid grid-cols-2",
                  compact ? "gap-1" : "gap-1.5",
                )}
              >
                {sfSlots.map(renderSlot)}
              </div>
            </>
          ) : (
            <span className="text-[10px] text-zinc-600 font-bold py-2 italic opacity-60">
              暂无
            </span>
          )}
        </div>

        <div className="hidden sm:block w-px self-stretch my-1 bg-white/5 opacity-50"></div>

        {/* 半决赛胜者 (2 Slots) */}
        <div
          className={`flex flex-col shrink-0 flex-[2] ${compact ? (isExport ? "gap-1" : "gap-0.5 sm:gap-1") : isExport ? "gap-2" : "gap-1.5 sm:gap-2"}`}
        >
          {finalSlots.length > 0 ? (
            <>
              {!compact && (
                <span
                  className={`font-bold text-blue-400 whitespace-nowrap ${isExport ? "text-[10px] text-left" : "text-[9px] sm:text-[10px] text-center sm:text-left truncate"}`}
                >
                  半决赛胜者
                </span>
              )}
              <div
                className={cn(
                  "grid grid-cols-1",
                  compact ? "gap-1" : "gap-1.5",
                )}
              >
                {finalSlots.map(renderSlot)}
              </div>
            </>
          ) : (
            <span className="text-[10px] text-zinc-600 font-bold py-2 italic opacity-60">
              暂无
            </span>
          )}
        </div>

        <div className="hidden sm:block w-px self-stretch my-1 bg-white/5 opacity-50"></div>

        {/* 冠军 (1 Slot) */}
        <div
          className={`flex shrink-0 flex-col flex-[1] ${compact ? (isExport ? "gap-1" : "gap-0.5 sm:gap-1") : isExport ? "gap-2" : "gap-1.5 sm:gap-2"}`}
        >
          {champSlot.length > 0 ? (
            <>
              {!compact && (
                <span
                  className={`font-bold text-yellow-500 whitespace-nowrap ${isExport ? "text-[10px] text-left" : "text-[9px] sm:text-[10px] text-center sm:text-left truncate"}`}
                >
                  冠军
                </span>
              )}
              <div
                className={cn(
                  "grid grid-cols-1",
                  compact ? "gap-1" : "gap-1.5",
                )}
              >
                {champSlot.map(renderSlot)}
              </div>
            </>
          ) : (
            <span className="text-[10px] text-zinc-600 font-bold py-2 italic opacity-60">
              暂无
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
