import React, { useContext } from "react";
import { PickSlot } from "../types";
import { cn } from "../lib/utils";
import { TEAMS } from "../data/teams";
import { TeamLogo } from "./TeamLogo";
import { ExportContext } from "../lib/ExportContext";
import { CheckCircle2, XCircle, Swords, AlertCircle } from "lucide-react";

export const SlotBox: React.FC<{
  slot: PickSlot & {
    resultStatus?: "correct" | "incorrect" | "unknown";
    clashType?: "x-one" | "x-fail" | "x-pass";
  };
  border: string;
  readOnly?: boolean;
  size?: "xs" | "sm" | "md";
  onDrop?: (e: React.DragEvent, slotId: string) => void;
  onClick?: (slotId: string, teamId: string | null) => void;
}> = ({ slot, border, readOnly = false, size = "md", onDrop, onClick }) => {
  const team = TEAMS.find((t) => t.id === slot.teamId);
  const isExport = useContext(ExportContext);
  const isSm = size === "sm";
  const isXs = size === "xs";
  const isTbd = team?.id === "tbd";

  return (
    <div
      draggable={!readOnly && !!team && !isTbd}
      onDragStart={(e) => {
        if (readOnly || !team || isTbd) return e.preventDefault();
        e.dataTransfer.setData("teamId", team.id);
        e.dataTransfer.setData("sourceSlotId", slot.id);
        e.dataTransfer.effectAllowed = "copyMove";
      }}
      onDrop={
        readOnly || isTbd ? undefined : (e) => onDrop && onDrop(e, slot.id)
      }
      onDragOver={
        readOnly || isTbd
          ? undefined
          : (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }
      }
      onClick={
        readOnly || isTbd
          ? undefined
          : () => onClick && onClick(slot.id, slot.teamId)
      }
      className={cn(
        "bg-white/40 dark:bg-zinc-900/40 flex items-center justify-center transition-all duration-300 group relative border shrink-0",
        !isTbd && !isExport && "shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)] backdrop-blur-xl",
        isXs
          ? "w-7 h-7 sm:w-8 sm:h-8 rounded-lg"
          : isSm
            ? "w-9 h-9 sm:w-11 sm:h-11 rounded-[10px]"
            : "w-[3rem] h-[3rem] md:w-[60px] md:h-[60px] rounded-xl z-10",
        readOnly && !slot.resultStatus
          ? ""
          : !readOnly && !isTbd
            ? "hover:bg-white/60 dark:hover:bg-zinc-800/60 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
            : "",
        slot.resultStatus === "correct"
          ? cn("border-emerald-500/60 bg-emerald-500/10", !isExport && "shadow-[0_0_15px_rgba(16,185,129,0.2)]")
          : slot.resultStatus === "incorrect"
            ? "border-rose-500/40 bg-rose-500/10"
            : team && !isTbd
              ? cn(
                  "border-black/10 dark:border-white/10 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700/80",
                  !isExport && "shadow-sm dark:shadow-sm",
                  border,
                )
              : cn("border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 border-dashed bg-black/5 dark:bg-white/5", !isExport && "shadow-inner"),
        slot.clashType === "x-one" &&
          slot.resultStatus === "unknown" &&
          "border-amber-500/30 bg-amber-500/5",
        slot.clashType === "x-fail" &&
          slot.resultStatus === "unknown" &&
          "border-rose-500/30 bg-rose-500/5",
        slot.clashType === "x-pass" &&
          slot.resultStatus === "unknown" &&
          "border-emerald-500/30 bg-emerald-500/5",
      )}
    >
      {slot.resultStatus === "correct" && (
        <CheckCircle2
          color="#34d399"
          className="absolute -top-1.5 -right-1.5 text-emerald-400 w-3 h-3 sm:w-4 sm:h-4 bg-white dark:bg-black rounded-full z-20"
        />
      )}
      {slot.resultStatus === "incorrect" && (
        <XCircle
          color="#f43f5e"
          className="absolute -top-1.5 -right-1.5 text-rose-500 w-3 h-3 sm:w-4 sm:h-4 bg-white dark:bg-black rounded-full z-20"
        />
      )}

      {slot.resultStatus === "unknown" && slot.clashType === "x-one" && (
        <Swords
          color="#f59e0b"
          className="absolute -top-1.5 -right-1.5 text-amber-500 w-3 h-3 sm:w-4 sm:h-4 bg-white dark:bg-black rounded-full z-20 p-[1px] sm:p-[2px]"
          title="内战：这两支选择队伍中必定有一支正确，一支错误"
        />
      )}
      {slot.resultStatus === "unknown" && slot.clashType === "x-fail" && (
        <AlertCircle
          color="#f43f5e"
          className="absolute -top-1.5 -right-1.5 text-rose-500 w-3 h-3 sm:w-4 sm:h-4 bg-white dark:bg-black rounded-full z-20"
          title="内战：这两支选择队伍中必定有一支会错误，仅可能存活一支"
        />
      )}
      {slot.resultStatus === "unknown" && slot.clashType === "x-pass" && (
        <CheckCircle2
          color="#10b981"
          className="absolute -top-1.5 -right-1.5 text-emerald-500 w-3 h-3 sm:w-4 sm:h-4 bg-white dark:bg-black rounded-full z-20 opacity-80"
          title="内战：这两支选择队伍中必定有一支会正确晋级"
        />
      )}

      {team ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center animate-in zoom-in-95 duration-200 overflow-hidden",
            isXs
              ? "w-[85%] h-[85%]"
              : isSm
                ? "w-[85%] h-[85%]"
                : "w-[80%] h-[80%]",
          )}
        >
          <TeamLogo
            team={team}
            fallbackClasses={cn(
              "rounded-[8px]",
              isXs ? "text-[5px] sm:text-[6px]" : "text-[8px] sm:text-[0.625rem]",
            )}
          />
        </div>
      ) : slot.resultStatus === "unknown" ? (
        <span
          className={cn(
            "font-black tracking-widest transition-opacity opacity-50 group-hover:opacity-60 text-zinc-500 dark:text-zinc-500",
            isXs
              ? "text-sm sm:text-lg"
              : isSm
                ? "text-lg sm:text-xl"
                : "text-2xl md:text-3xl",
          )}
        >
          ?
        </span>
      ) : (
        <span
          className={cn(
            "font-medium transition-opacity opacity-20 group-hover:opacity-40 text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 cursor-copy",
            isXs
              ? "text-[6px] sm:text-[8px]"
              : isSm
                ? "text-[0.625rem] sm:text-xs"
                : "text-sm",
          )}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
        </span>
      )}
    </div>
  );
};
