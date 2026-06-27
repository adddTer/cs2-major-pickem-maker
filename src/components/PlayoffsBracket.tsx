import React, { useState } from "react";
import { PickSlot } from "../types";
import { cn } from "../lib/utils";
import { TEAMS } from "../data/teams";
import { ACTUAL_RESULTS, MATCHES } from "../data/matches";
import { BracketMatch } from "../types";
import { MatchDialog } from "./MatchDialog";
import { TeamLogo } from "./TeamLogo";
import { TournamentBracketRenderer } from "./TournamentBracketRenderer";
import { PLAYOFFS_CONFIG, BracketNode } from "../data/bracketConfigs";
import { getLocalStrength } from "../data/localPoints";
import { GLOBAL_SEEDING } from "../data/seedings";

export const BracketSlot: React.FC<{
  slot:
    | (PickSlot & {
        resultStatus?: "correct" | "incorrect" | "unknown";
        score?: number | null;
        isLive?: boolean;
        isSimulated?: boolean;
      })
    | undefined;
  readOnly: boolean;
  disableDragDrop?: boolean;
  onDrop?: any;
  onClick?: any;
  emptyTitle: string;
}> = ({
  slot,
  readOnly,
  disableDragDrop = false,
  onDrop,
  onClick,
  emptyTitle,
}) => {
  const team = TEAMS.find((t) => t.id === slot?.teamId);

  return (
    <div
      draggable={!readOnly && !disableDragDrop && !!team}
      onDragStart={(e) => {
        if (readOnly || disableDragDrop || !team || !slot)
          return e.preventDefault();
        e.dataTransfer.setData("teamId", team.id);
        e.dataTransfer.setData("sourceSlotId", slot.id);
        e.dataTransfer.effectAllowed = "copyMove";
      }}
      onDrop={
        readOnly || disableDragDrop
          ? undefined
          : (e) => slot && onDrop && onDrop(e, slot.id)
      }
      onDragOver={
        readOnly || disableDragDrop
          ? undefined
          : (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }
      }
      onClick={() => slot && onClick && onClick(slot.id, slot.teamId)}
      className={cn(
        "w-[190px] h-[48px] rounded-xl flex items-center px-3 gap-3 transition-all duration-300 relative overflow-hidden",
        onClick ? "cursor-pointer" : !readOnly ? "cursor-pointer" : "",
        team
          ? cn(
              "bg-white/80 dark:bg-zinc-800/80 border border-black/10 dark:border-white/10 shadow-lg backdrop-blur-md",
              !readOnly &&
                "hover:border-black/30 dark:hover:border-white/30 hover:-translate-y-0.5 hover:shadow-xl",
            )
          : cn(
              "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 border-dashed text-zinc-400 dark:text-zinc-500",
              !readOnly &&
                "hover:border-black/30 dark:hover:border-white/30 hover:bg-black/10 dark:hover:bg-white/10",
            ),
        readOnly && !team && "opacity-50 cursor-default",
        slot?.resultStatus === "correct"
          ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          : "",
        slot?.resultStatus === "incorrect"
          ? "border-rose-500/50 bg-rose-500/10"
          : "",
        slot?.isSimulated &&
          "ring-2 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]",
      )}
    >
      {team ? (
        <>
          <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-white/50 dark:bg-black/30 rounded-md border border-black/5 dark:border-white/5 shadow-inner">
            <TeamLogo team={team} fallbackClasses="text-xs" />
          </div>
          <span className="font-display font-bold tracking-wide text-zinc-900 dark:text-zinc-100 text-sm flex-1 truncate drop-shadow-sm">
            {team.name}
          </span>
          {slot?.score !== undefined && slot?.score !== null ? (
            <div className="flex items-center justify-center min-w-[24px] shrink-0 bg-zinc-100/50 dark:bg-zinc-900/50 px-2 py-1 rounded-md shadow-inner border border-black/5 dark:border-white/5">
              <span
                className={cn(
                  "font-mono text-base font-bold leading-none",
                  slot.isLive
                    ? "text-rose-500"
                    : "text-zinc-800 dark:text-zinc-200",
                )}
              >
                {slot.score}
              </span>
            </div>
          ) : slot?.bottomText || slot?.isLive ? (
            <div className="flex flex-col items-center justify-center min-w-[28px] shrink-0 relative h-full">
              {slot?.bottomText ? (
                <div className="text-[0.625rem] sm:text-[0.6875rem] font-mono font-bold text-emerald-500 dark:text-emerald-400 shrink-0 drop-shadow-sm">
                  {slot.bottomText}
                </div>
              ) : null}
              {slot?.isLive && (
                <span className="text-[8px] font-black text-rose-500 scale-[0.8] absolute bottom-1.5 tracking-widest uppercase animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                  LIVE
                </span>
              )}
            </div>
          ) : null}
        </>
      ) : (
        <span className="text-[0.6875rem] font-display font-medium mx-auto tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-500">
          {emptyTitle}
        </span>
      )}
    </div>
  );
};

export const PlayoffsBracket: React.FC<{
  slots: PickSlot[];
  readOnly?: boolean;
  showResults?: boolean;
  refreshTrigger?: number;
  disableAutoFill?: boolean;
  onDrop?: (e: React.DragEvent, slotId: string) => void;
  onClick?: (slotId: string, teamId: string | null) => void;
  onMatchClick?: (m: BracketMatch) => void;
  hideControls?: boolean;
}> = ({
  slots,
  readOnly = false,
  showResults = false,
  refreshTrigger,
  disableAutoFill = false,
  onDrop,
  onClick,
  onMatchClick,
  hideControls = false,
}) => {
  const [selectedMatch, setSelectedMatch] = React.useState<BracketMatch | null>(
    null,
  );
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulations, setSimulations] = useState<Record<string, string>>({}); // targetSlotId -> teamId

  React.useEffect(() => {
    if (!simulationMode) setSimulations({});
  }, [simulationMode]);

  React.useEffect(() => {
    if (selectedMatch) {
      const playoffsMatches = MATCHES["playoffs"] || {};
      let updatedMatch = null;
      for (const group of Object.values(playoffsMatches)) {
        const found = group.find(
          (m: any) =>
            (m.externalId && m.externalId === selectedMatch.externalId) ||
            (m.team1Id === selectedMatch.team1Id &&
              m.team2Id === selectedMatch.team2Id),
        );
        if (found) {
          updatedMatch = found;
          break;
        }
      }
      if (
        updatedMatch &&
        JSON.stringify(selectedMatch) !== JSON.stringify(updatedMatch)
      ) {
        setSelectedMatch(updatedMatch);
      }
    }
  }, [refreshTrigger, selectedMatch]);

  const getSlot = (id: string) => {
    let baseSlot = slots.find((s) => s.id === id || s.id === `playoffs-${id}`);
    if (!baseSlot) {
      baseSlot = { id, type: id.split("-")[0] as any, teamId: null };
    }

    // Auto-fill quarter-finalists from actual schedule, since users don't pick them
    if (baseSlot.type === "qf" && !disableAutoFill) {
      const qfMatches = MATCHES["playoffs"]?.["qf"] || [];
      const qfIndex = parseInt(id.replace("qf-", ""), 10) - 1;
      const matchIndex = Math.floor(qfIndex / 2);
      const isTeam1 = qfIndex % 2 === 0;

      if (qfMatches[matchIndex]) {
        const assignedTeam = isTeam1
          ? qfMatches[matchIndex].team1Id
          : qfMatches[matchIndex].team2Id;
        if (assignedTeam) {
          baseSlot = { ...baseSlot, teamId: assignedTeam };
        }
      }
    }

    // Apply simulations over existing read-only team IDs
    let isSimulated = false;
    if (simulationMode && simulations[id]) {
      baseSlot = { ...baseSlot, teamId: simulations[id] };
      isSimulated = true;
    }

    let score: number | null | undefined = null;
    let isLive = false;
    if (
      baseSlot.teamId &&
      baseSlot.type !== "champion" &&
      !disableAutoFill &&
      !isSimulated
    ) {
      const roundMatches = MATCHES["playoffs"]?.[baseSlot.type] || [];
      for (const m of roundMatches) {
        if (m.team1Id === baseSlot.teamId) {
          if (m.score1 !== undefined) score = m.score1;
          isLive = m.status === "live";
          break;
        }
        if (m.team2Id === baseSlot.teamId) {
          if (m.score2 !== undefined) score = m.score2;
          isLive = m.status === "live";
          break;
        }
      }
    }

    if (!showResults) return { ...baseSlot, score, isLive, isSimulated };

    // When showing results, evaluate correct/incorrect
    const actuals = ACTUAL_RESULTS["playoffs"] || [];
    let resultStatus: "correct" | "incorrect" | "unknown" = "unknown";
    if (baseSlot.teamId && baseSlot.type !== "qf" && !isSimulated) {
      const isCorrect = actuals.some(
        (a) => a.teamId === baseSlot?.teamId && a.type === baseSlot?.type,
      );
      if (isCorrect) {
        resultStatus = "correct";
      } else {
        const typeCount = actuals.filter(
          (a) => a.type === baseSlot?.type,
        ).length;
        const maxForType =
          baseSlot.type === "sf" ? 4 : baseSlot.type === "final" ? 2 : 1;
        if (typeCount >= maxForType) resultStatus = "incorrect";
      }
    }
    return { ...baseSlot, resultStatus, score, isLive, isSimulated };
  };

  const getMatchForSlotId = (slotId: string) => {
    const type = slotId.split("-")[0];
    const idxStr = slotId.split("-")[1];
    if (type === "champion") {
      return MATCHES["playoffs"]?.["final"]?.[0];
    }
    if (!idxStr) return undefined;
    const idx = parseInt(idxStr, 10);
    let matchIndex = 0;
    if (type === "qf" || type === "sf" || type === "final") {
      matchIndex = Math.floor((idx - 1) / 2);
      return MATCHES["playoffs"]?.[type]?.[matchIndex];
    }
    return undefined;
  };

  const handleSlotClick = (id: string) => {
    const s = getSlot(id);
    if (simulationMode && s?.teamId) {
      // Advance team to next target slot
      let target = "";
      if (id.startsWith("qf-")) {
        const idx = parseInt(id.replace("qf-", ""));
        target = `sf-${Math.ceil(idx / 2)}`;
      } else if (id.startsWith("sf-")) {
        const idx = parseInt(id.replace("sf-", ""));
        target = `final-${Math.ceil(idx / 2)}`;
      } else if (id.startsWith("final-")) {
        target = "champion";
      }
      if (target) {
        setSimulations((prev) => ({ ...prev, [target]: s.teamId! }));
      }
      return;
    }

    if (onClick) {
      onClick(id, getSlot(id)?.teamId || null);
      return;
    }
    const match = getMatchForSlotId(id);
    if (match) {
      if (onMatchClick) onMatchClick(match);
      else setSelectedMatch(match);
    }
  };

  const handleAutoSimulateNextRound = () => {
    const newSims = { ...simulations };
    const transitions = [
      { fromPrefix: "qf-", toPrefix: "sf-", levels: 4 },
      { fromPrefix: "sf-", toPrefix: "final-", levels: 2 },
      { fromPrefix: "final-", toPrefix: "champion", levels: 1 },
    ];

    for (const trans of transitions) {
      let madePicksThisLevel = false;
      for (let i = 1; i <= trans.levels; i++) {
        const t1Id = trans.fromPrefix + (i * 2 - 1);
        const t2Id = trans.fromPrefix + i * 2;
        const destId =
          trans.toPrefix === "champion" ? "champion" : trans.toPrefix + i;

        const s1 = getSlot(t1Id);
        const s2 = getSlot(t2Id);
        const dest = getSlot(destId);

        if (s1?.teamId && s2?.teamId && !dest?.teamId) {
          // We have two contestants, no winner predicted yet
          const s1Str =
            getLocalStrength(s1.teamId) ||
            2000 - (GLOBAL_SEEDING[s1.teamId] || 32) * 30;
          const s2Str =
            getLocalStrength(s2.teamId) ||
            2000 - (GLOBAL_SEEDING[s2.teamId] || 32) * 30;
          const t1Wins = s1Str >= s2Str;
          newSims[destId] = t1Wins ? s1.teamId : s2.teamId;
          madePicksThisLevel = true;
        }
      }
      if (madePicksThisLevel) break; // Simulate one round strictly
    }
    setSimulations(newSims);
  };

  const renderNode = (node: BracketNode) => {
    if (node.type === "playoffsHeader") {
      const match: BracketMatch | undefined =
        node.matchIndex !== undefined
          ? MATCHES["playoffs"]?.[node.id.split("-")[1] as any]?.[
              node.matchIndex
            ]
          : undefined;

      return (
        <div
          className="absolute text-[0.6875rem] text-zinc-600 dark:text-zinc-400 bg-white/60 dark:bg-zinc-900/60 rounded-full px-4 py-1.5 font-display font-semibold tracking-widest uppercase flex items-center justify-center pointer-events-auto cursor-pointer hover:bg-white dark:hover:bg-zinc-800 w-[190px] z-50 shadow-sm border border-black/5 dark:border-white/5 backdrop-blur-md transition-all duration-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:shadow-md hover:-translate-y-1 -mt-2"
          onClick={() => {
            if (match) {
              if (onMatchClick) onMatchClick(match);
              else setSelectedMatch(match);
            }
          }}
          title="点击查看赛况"
        >
          {node.title}
        </div>
      );
    }

    // Default is playoffsSlot
    const isCol1 = node.id.startsWith("qf-");
    const emptyTitle = readOnly ? "待定" : isCol1 ? "待定" : "作出您的选择";

    return (
      <BracketSlot
        slot={getSlot(node.id)}
        readOnly={readOnly && !simulationMode}
        disableDragDrop={node.disableDragDrop || disableAutoFill}
        onDrop={onDrop}
        onClick={() => handleSlotClick(node.id)}
        emptyTitle={emptyTitle}
      />
    );
  };

  return (
    <div className="w-full flex-1 min-h-0 overflow-hidden z-10 relative flex flex-col">
      {!hideControls && readOnly && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-auto">
          <div className="flex gap-2 isolate">
            <button
              onClick={() => setSimulationMode(!simulationMode)}
              className={cn(
                "px-3 py-1.5 border rounded-[4px] text-xs font-bold shadow-lg transition-colors flex items-center gap-2",
                simulationMode
                  ? "bg-blue-600/20 text-blue-400 border-blue-500/50"
                  : "bg-white/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800",
              )}
            >
              {simulationMode ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  模拟模式已开启
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-zinc-600" />
                  开启预测模拟
                </>
              )}
            </button>
            {simulationMode && (
              <button
                onClick={handleAutoSimulateNextRound}
                className="px-3 py-1.5 border rounded-[4px] text-xs font-bold shadow-lg transition-colors flex items-center gap-2 bg-white/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-200 border-zinc-300 dark:border-zinc-600/50 hover:bg-white dark:hover:bg-zinc-800/80"
              >
                推演下一轮
              </button>
            )}
          </div>
          {simulationMode && (
            <div className="mt-2 text-[0.625rem] text-zinc-500 dark:text-zinc-600 bg-zinc-200/50 dark:bg-black/50 px-2 py-1 rounded w-max border border-black/5 dark:border-white/5">
              点击队伍晋级下一轮
            </div>
          )}
        </div>
      )}

      <TournamentBracketRenderer
        config={PLAYOFFS_CONFIG}
        renderNode={renderNode}
      />

      <MatchDialog
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
};
