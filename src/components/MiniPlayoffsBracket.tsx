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
      className={`flex items-center gap-1 flex-col ${isExport ? (compact ? "w-8" : "w-11") : "w-10 sm:w-11"}`}
    >
      <SlotBox
        slot={s}
        border="border-black/10 dark:border-white/10"
        readOnly={readOnly}
        size={compact ? "xs" : "sm"}
        onDrop={onDrop}
        onClick={onClick}
      />
      {showTeamNames && s.teamId && (
        <div className="text-[9px] text-center font-bold text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 break-words leading-[1.1] max-w-full truncate">
          {TEAMS.find((t) => t.id === s.teamId)?.shortName}
        </div>
      )}
    </div>
  );

  const sfSlots = slots.filter((s) => s.type === "sf");
  const finalSlots = slots.filter((s) => s.type === "final");
  const champSlot = slots.filter((s) => s.type === "champion");

  return (
    <div className={`w-max min-w-full ${isExport ? "" : ""} pt-1 2xl:pt-3 pr-1 2xl:pr-3 pb-2`}>
      <div
        className={`flex w-max ${compact ? (isExport ? "gap-2 items-start flex-nowrap" : "gap-3 sm:gap-4 lg:gap-6 items-start flex-nowrap") : isExport ? "gap-4 items-start flex-nowrap" : "gap-3 sm:gap-4 lg:gap-6 items-start flex-nowrap"}`}
      >
        {/* 1/4决赛胜者 (4 Slots) */}
        <div
          className={`flex flex-col shrink-0 ${compact ? (isExport ? "gap-1" : "gap-0.5 sm:gap-1") : isExport ? "gap-2" : "gap-1.5 sm:gap-2"}`}
        >
          {sfSlots.length > 0 ? (
            <>
              {!compact && (
                <span
                  className={`font-bold text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 whitespace-nowrap ${isExport ? "text-[0.625rem] text-left" : "text-[9px] sm:text-[0.625rem] text-center sm:text-left"}`}
                >
                  1/4 决赛胜者
                </span>
              )}
              <div
                className={`flex flex-nowrap ${isExport ? "justify-start" : "justify-center sm:justify-start"} ${compact ? (isExport ? "gap-0.5" : "gap-1") : isExport ? "gap-1.5" : "gap-1.5"}`}
              >
                {sfSlots.map(renderSlot)}
              </div>
            </>
          ) : (
            <span className="text-[0.625rem] text-zinc-500 dark:text-zinc-600 font-bold py-2 italic opacity-60">
              暂无
            </span>
          )}
        </div>

        <div
          className={`${isExport ? "block" : "hidden sm:block"} w-px bg-black/5 dark:bg-white/5 self-stretch ${compact ? "my-1" : ""}`}
        ></div>

        {/* 半决赛胜者 (2 Slots) */}
        <div
          className={`flex flex-col ${compact ? (isExport ? "gap-1" : "gap-0.5 sm:gap-1") : isExport ? "gap-2" : "gap-1.5 sm:gap-2"}`}
        >
          {finalSlots.length > 0 ? (
            <>
              {!compact && (
                <span
                  className={`font-bold text-blue-500 dark:text-blue-400 whitespace-nowrap ${isExport ? "text-[0.625rem] text-left" : "text-[9px] sm:text-[0.625rem] text-center sm:text-left"}`}
                >
                  半决赛胜者
                </span>
              )}
              <div
                className={`flex flex-nowrap ${isExport ? "justify-start" : "justify-center sm:justify-start"} ${compact ? (isExport ? "gap-0.5" : "gap-1") : isExport ? "gap-1.5" : "gap-1.5"}`}
              >
                {finalSlots.map(renderSlot)}
              </div>
            </>
          ) : (
            <span className="text-[0.625rem] text-zinc-500 dark:text-zinc-600 font-bold py-2 italic opacity-60">
              暂无
            </span>
          )}
        </div>

        <div
          className={`${isExport ? "block" : "hidden sm:block"} w-px bg-black/5 dark:bg-white/5 self-stretch ${compact ? "my-1" : ""}`}
        ></div>

        {/* 冠军 (1 Slot) */}
        <div
          className={`flex shrink-0 flex-col ${compact ? (isExport ? "gap-1" : "gap-0.5 sm:gap-1") : isExport ? "gap-2" : "gap-1.5 sm:gap-2"}`}
        >
          {champSlot.length > 0 ? (
            <>
              {!compact && (
                <span
                  className={`font-bold text-yellow-500 whitespace-nowrap ${isExport ? "text-[0.625rem] text-left" : "text-[9px] sm:text-[0.625rem] text-center sm:text-left"}`}
                >
                  冠军
                </span>
              )}
              <div
                className={`flex flex-nowrap ${isExport ? "justify-start" : "justify-center sm:justify-start"} ${compact ? (isExport ? "gap-0.5" : "gap-1") : isExport ? "gap-1.5" : "gap-1.5"}`}
              >
                {champSlot.map(renderSlot)}
              </div>
            </>
          ) : (
            <span className="text-[0.625rem] text-zinc-500 dark:text-zinc-600 font-bold py-2 italic opacity-60">
              暂无
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
