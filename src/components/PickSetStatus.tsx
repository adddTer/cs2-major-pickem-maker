import React from "react";

export const getStatusStyles = (statusData: any) => {
  if (!statusData) return { bg: "bg-zinc-900/60", border: "border-white/5" };
  switch (statusData.statusId) {
    case "passed":
      return {
        bg: "bg-zinc-900/60 bg-gradient-to-bl from-emerald-500/20 via-transparent to-transparent",
        border: "border-emerald-500/20",
      };
    case "failed":
      return {
        bg: "bg-zinc-900/60 bg-gradient-to-bl from-rose-500/20 via-transparent to-transparent",
        border: "border-rose-500/20",
      };
    case "great_chance":
      return {
        bg: "bg-zinc-900/60 bg-gradient-to-bl from-blue-500/20 via-transparent to-transparent",
        border: "border-blue-500/20",
      };
    case "uncertain":
      return {
        bg: "bg-zinc-900/60 bg-gradient-to-bl from-amber-500/20 via-transparent to-transparent",
        border: "border-amber-500/20",
      };
    case "slim_chance":
      return {
        bg: "bg-zinc-900/60 bg-gradient-to-bl from-orange-500/20 via-transparent to-transparent",
        border: "border-orange-500/20",
      };
    default:
      return { bg: "bg-zinc-900/60", border: "border-white/5" };
  }
};

export const PickSetStatusText = ({
  statusData,
  showProbability = false,
}: {
  statusData: any;
  showProbability?: boolean;
}) => {
  if (!statusData) return null;
  const { statusId, guaranteed, mathematicallyIncorrect, passingProbability } =
    statusData;

  let finalProb = passingProbability;
  if (statusId === "passed") finalProb = 1;
  else if (statusId === "failed") finalProb = 0;

  const countsNode = showProbability ? (
    <span className="flex items-center gap-1.5 ml-2 font-sans bg-black/20 px-1.5 py-0.5 rounded text-[10px]">
      <span className="text-blue-400">
        {finalProb !== undefined ? `${(finalProb * 100).toFixed(1)}%` : "-"}{" "}
        通关
      </span>
    </span>
  ) : (
    <span className="flex items-center gap-1.5 ml-2 font-sans bg-black/20 px-1.5 py-0.5 rounded text-[10px]">
      <span className="text-emerald-400">✓ {guaranteed}</span>
      <span className="text-zinc-600/80">|</span>
      <span className="text-rose-400 text-[11px]">✗</span>
      <span className="text-rose-400 -ml-0.5">{mathematicallyIncorrect}</span>
    </span>
  );

  switch (statusId) {
    case "passed":
      return (
        <div className="flex items-center text-emerald-400 text-[11px] font-bold shrink-0 opacity-90">
          已达成 {countsNode}
        </div>
      );
    case "failed":
      return (
        <div className="flex items-center text-rose-500 text-[11px] font-bold shrink-0 opacity-90">
          未达成 {countsNode}
        </div>
      );
    case "great_chance":
      return (
        <div className="flex items-center text-blue-400 text-[11px] font-bold shrink-0 opacity-90">
          形势大好 {countsNode}
        </div>
      );
    case "uncertain":
      return (
        <div className="flex items-center text-amber-500 text-[11px] font-bold shrink-0 opacity-90">
          胜负难测 {countsNode}
        </div>
      );
    case "slim_chance":
      return (
        <div className="flex items-center text-orange-500 text-[11px] font-bold shrink-0 opacity-90">
          希望渺茫 {countsNode}
        </div>
      );
    default:
      return null;
  }
};
