import React from "react";

export const getStatusStyles = (statusData: any) => {
  if (!statusData) return { bg: "bg-zinc-100/60 dark:bg-zinc-900/60", border: "border-black/5 dark:border-white/5" };
  switch (statusData.statusId) {
    case "passed":
      return {
        bg: "bg-emerald-50/50 dark:bg-emerald-950/20 bg-gradient-to-br from-emerald-100/50 dark:from-emerald-900/30 to-transparent",
        border: "border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-700/50",
      };
    case "failed":
      return {
        bg: "bg-rose-50/50 dark:bg-rose-950/20 bg-gradient-to-br from-rose-100/50 dark:from-rose-900/30 to-transparent",
        border: "border-rose-200 dark:border-rose-800/50 hover:border-rose-300 dark:hover:border-rose-700/50",
      };
    case "great_chance":
      return {
        bg: "bg-blue-50/50 dark:bg-blue-950/20 bg-gradient-to-br from-blue-100/50 dark:from-blue-900/30 to-transparent",
        border: "border-blue-200 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700/50",
      };
    case "uncertain":
      return {
        bg: "bg-amber-50/50 dark:bg-amber-950/20 bg-gradient-to-br from-amber-100/50 dark:from-amber-900/30 to-transparent",
        border: "border-amber-200 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700/50",
      };
    case "slim_chance":
      return {
        bg: "bg-orange-50/50 dark:bg-orange-950/20 bg-gradient-to-br from-orange-100/50 dark:from-orange-900/30 to-transparent",
        border: "border-orange-200 dark:border-orange-800/50 hover:border-orange-300 dark:hover:border-orange-700/50",
      };
    default:
      return { bg: "bg-zinc-100/80 dark:bg-zinc-900/60", border: "border-black/5 dark:border-white/5" };
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
  const { statusId, guaranteed, mathematicallyIncorrect, passingProbability, completedMatchesCount } =
    statusData;

  let finalProb = passingProbability;
  if (statusId === "passed") finalProb = 1;
  else if (statusId === "failed") finalProb = 0;

  const getCountsNode = (colorClasses: string) => showProbability ? (
    <span className={`flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-[10px] ${colorClasses}`}>
      {finalProb !== undefined ? `${(finalProb * 100).toFixed(1)}%` : "-"}
    </span>
  ) : (
    <span className={`flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-[10px]`}>
      <span className="text-emerald-600 dark:text-emerald-400">✓ {guaranteed}</span>
      <span className="text-zinc-400/50 dark:text-zinc-500/50">|</span>
      <span className="text-rose-600 dark:text-rose-400">✗ {mathematicallyIncorrect}</span>
    </span>
  );

  if (completedMatchesCount === 0 && statusId !== "passed" && statusId !== "failed") {
    return (
      <div className="flex items-center shrink-0">
        {getCountsNode("text-zinc-600 dark:text-zinc-400")}
      </div>
    );
  }

  const renderBadge = (label: string, themeStr: string) => {
    let classes = "";
    let countsNodeClasses = "";
    switch (themeStr) {
      case "emerald":
        classes = "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
        countsNodeClasses = "text-emerald-700 dark:text-emerald-400";
        break;
      case "rose":
        classes = "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]";
        countsNodeClasses = "text-rose-700 dark:text-rose-400";
        break;
      case "blue":
        classes = "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]";
        countsNodeClasses = "text-blue-700 dark:text-blue-400";
        break;
      case "amber":
        classes = "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
        countsNodeClasses = "text-amber-700 dark:text-amber-400";
        break;
      case "orange":
        classes = "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]";
        countsNodeClasses = "text-orange-700 dark:text-orange-400";
        break;
    }

    return (
      <div className={`flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border shrink-0 ${classes}`}>
        <span className="text-[11px] font-black tracking-widest">{label}</span>
        {getCountsNode(countsNodeClasses)}
      </div>
    );
  };

  switch (statusId) {
    case "passed":
      return renderBadge("已达成", "emerald");
    case "failed":
      return renderBadge("未达成", "rose");
    case "great_chance":
      return renderBadge("形势大好", "blue");
    case "uncertain":
      return renderBadge("胜负难测", "amber");
    case "slim_chance":
      return renderBadge("希望渺茫", "orange");
    default:
      return null;
  }
};
