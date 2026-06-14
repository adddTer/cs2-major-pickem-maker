import React from "react";
import { PickSlot } from "../types";
import { cn } from "../lib/utils";
import { TEAMS } from "../data/teams";
import { ACTUAL_RESULTS, MATCHES } from "../data/matches";
import { BracketMatch } from "../types";
import { MatchDialog } from "./MatchDialog";
import { TeamLogo } from "./TeamLogo";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const W = 180;
const H = 40;

const nodes: Record<string, { x: number; y: number }> = {
  "qf-1": { x: 60, y: 120 },
  "qf-2": { x: 60, y: 170 },
  "qf-3": { x: 60, y: 270 },
  "qf-4": { x: 60, y: 320 },
  "qf-5": { x: 60, y: 470 },
  "qf-6": { x: 60, y: 520 },
  "qf-7": { x: 60, y: 620 },
  "qf-8": { x: 60, y: 670 },
  "sf-1": { x: 320, y: 145 },
  "sf-2": { x: 320, y: 295 },
  "sf-3": { x: 320, y: 495 },
  "sf-4": { x: 320, y: 645 },
  "final-1": { x: 580, y: 220 },
  "final-2": { x: 580, y: 570 },
  champion: { x: 840, y: 395 },
};

const edges = [
  ["qf-1", "sf-1"],
  ["qf-2", "sf-1"],
  ["qf-3", "sf-2"],
  ["qf-4", "sf-2"],
  ["qf-5", "sf-3"],
  ["qf-6", "sf-3"],
  ["qf-7", "sf-4"],
  ["qf-8", "sf-4"],
  ["sf-1", "final-1"],
  ["sf-2", "final-1"],
  ["sf-3", "final-2"],
  ["sf-4", "final-2"],
  ["final-1", "champion"],
  ["final-2", "champion"],
];

const DrawPath: React.FC<{ fromId: string; toId: string }> = ({
  fromId,
  toId,
}) => {
  const p1 = nodes[fromId];
  const p2 = nodes[toId];
  if (!p1 || !p2) return null;

  const sx = p1.x + W;
  const sy = p1.y + H / 2;
  const ex = p2.x;
  const ey = p2.y + H / 2;
  const midX = sx + (ex - sx) / 2;

  const R = 16;
  const dirY = Math.sign(ey - sy);
  const r = Math.min(R, Math.abs(ey - sy) / 2);

  let d = "";
  if (Math.abs(ey - sy) < 1) {
    d = `M ${sx} ${sy} L ${ex} ${ey}`;
  } else {
    d = `M ${sx} ${sy} L ${midX - r} ${sy} Q ${midX} ${sy} ${midX} ${sy + r * dirY} L ${midX} ${ey - r * dirY} Q ${midX} ${ey} ${midX + r} ${ey} L ${ex} ${ey}`;
  }

  return (
    <path
      d={d}
      stroke="currentColor"
      className="text-black/15 dark:text-white/15"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

const BracketSlot: React.FC<{
  slot:
    | (PickSlot & {
        resultStatus?: "correct" | "incorrect" | "unknown";
        score?: number | null;
        isLive?: boolean;
      })
    | undefined;
  readOnly: boolean;
  disableDragDrop?: boolean;
  onDrop: any;
  onClick: any;
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
        "w-[180px] h-[40px] rounded-[6px] flex items-center px-3 gap-2 border transition-colors relative overflow-hidden",
        onClick ? "cursor-pointer" : !readOnly ? "cursor-pointer" : "",
        team
          ? cn(
              "bg-white dark:bg-zinc-800 border-black/20 dark:border-white/20 shadow-sm",
              !readOnly && "hover:border-black/40 dark:border-white/40 hover:bg-zinc-700/80",
            )
          : cn(
              "bg-black/40 dark:bg-white/40 dark:bg-zinc-800/40 border-black/20 dark:border-white/20 border-dashed shadow-inner text-zinc-500 dark:text-zinc-600 dark:text-zinc-400",
              !readOnly && "hover:border-black/40 dark:border-white/40",
            ),
        readOnly && !team && "opacity-60 cursor-default",
        slot?.resultStatus === "correct"
          ? "border-emerald-500/60 bg-emerald-500/15"
          : "",
        slot?.resultStatus === "incorrect"
          ? "border-rose-500/40 bg-rose-500/10"
          : "",
      )}
    >
      {team ? (
        <>
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <TeamLogo team={team} fallbackClasses="text-[10px]" />
          </div>
          <span className="font-bold text-zinc-900 dark:text-zinc-200 text-sm flex-1 truncate">
            {team.name}
          </span>
          {slot?.score !== undefined && slot?.score !== null ? (
            <div className="flex flex-col items-center justify-center min-w-[24px] shrink-0 relative">
              <div className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded bg-zinc-200/40 dark:bg-black/40 text-xs font-black text-black dark:text-white shadow-inner">
                {slot.score}
              </div>
              {slot.isLive && (
                <span className="text-[8px] font-black text-rose-500 scale-[0.7] absolute -bottom-[7px] tracking-widest uppercase">
                  LIVE
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-w-[24px] shrink-0 relative h-full">
              {slot?.bottomText ? (
                <div className="text-[10px] sm:text-xs font-mono font-bold text-emerald-400 shrink-0">
                  {slot.bottomText}
                </div>
              ) : null}
              {slot?.isLive && (
                <span className="text-[8px] font-black text-rose-500 scale-[0.7] absolute bottom-1 tracking-widest uppercase">
                  LIVE
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        <span
          className="text-xs font-semibold mx-auto tracking-widest text-zinc-500 dark:text-zinc-500"
          style={{ letterSpacing: "0.1em" }}
        >
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
}> = ({
  slots,
  readOnly = false,
  showResults = false,
  refreshTrigger,
  disableAutoFill = false,
  onDrop,
  onClick,
}) => {
  const [selectedMatch, setSelectedMatch] = React.useState<BracketMatch | null>(
    null,
  );

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
      if (updatedMatch && JSON.stringify(selectedMatch) !== JSON.stringify(updatedMatch)) {
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

    let score: number | null | undefined = null;
    let isLive = false;
    if (baseSlot.teamId && baseSlot.type !== "champion" && !disableAutoFill) {
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

    if (!showResults) return { ...baseSlot, score, isLive };

    // When showing results, evaluate correct/incorrect
    const actuals = ACTUAL_RESULTS["playoffs"] || [];

    let resultStatus: "correct" | "incorrect" | "unknown" = "unknown";
    if (baseSlot.teamId && baseSlot.type !== "qf") {
      const isCorrect = actuals.some(
        (a) => a.teamId === baseSlot?.teamId && a.type === baseSlot?.type,
      );
      if (isCorrect) {
        resultStatus = "correct";
      } else {
        // If this slot type is fully filled in actuals, and this isn't correct, it's incorrect
        const typeCount = actuals.filter(
          (a) => a.type === baseSlot?.type,
        ).length;
        const maxForType =
          baseSlot.type === "sf" ? 4 : baseSlot.type === "final" ? 2 : 1;
        if (typeCount >= maxForType) resultStatus = "incorrect";
      }
    }
    return { ...baseSlot, resultStatus, score, isLive };
  };

  return (
    <div className="w-full h-full overflow-hidden z-10 relative">
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={2}
        centerOnInit={true}
        limitToBounds={true}
        wheel={{ step: 0.001 }}
        panning={{ velocityDisabled: false }}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%", cursor: "grab" }}
        >
          <div className="w-[1100px] h-[800px] relative pointer-events-none flex-shrink-0">
            <svg
              className="absolute inset-0 w-full h-full z-0 pointer-events-none"
              style={{ left: 0, top: 0 }}
            >
              {edges.map(([from, to], i) => (
                <DrawPath key={i} fromId={from} toId={to} />
              ))}
            </svg>

            {[
              { type: "qf", matchIndex: 0, nodeTop: "qf-1", title: "1/4决赛" },
              { type: "qf", matchIndex: 1, nodeTop: "qf-3", title: "1/4决赛" },
              { type: "qf", matchIndex: 2, nodeTop: "qf-5", title: "1/4决赛" },
              { type: "qf", matchIndex: 3, nodeTop: "qf-7", title: "1/4决赛" },
              { type: "sf", matchIndex: 0, nodeTop: "sf-1", title: "半决赛" },
              { type: "sf", matchIndex: 1, nodeTop: "sf-3", title: "半决赛" },
              {
                type: "final",
                matchIndex: 0,
                nodeTop: "final-1",
                title: "决 赛",
              },
            ].map((header, i) => {
              const pos = nodes[header.nodeTop];
              if (!pos) return null;

              const match: BracketMatch | undefined =
                MATCHES["playoffs"]?.[header.type]?.[header.matchIndex];

              return (
                <div
                  key={`header-${i}`}
                  className="absolute text-[12px] text-zinc-900 dark:text-zinc-200 bg-zinc-200/60 dark:bg-black/60 rounded-sm px-1 py-0.5 font-bold tracking-wider flex items-center justify-center pointer-events-auto cursor-pointer hover:bg-zinc-200/80 dark:bg-black/80 w-[180px] z-50 shadow-md transition-colors hover:text-black dark:text-white"
                  style={{ left: pos.x, top: pos.y - 24 }}
                  onClick={() => {
                    if (match) setSelectedMatch(match);
                  }}
                  title="点击查看赛况"
                >
                  {header.title}
                </div>
              );
            })}

            {Object.entries(nodes).map(([id, pos]) => {
              const isCol1 = id.startsWith("qf-");
              const emptyTitle = readOnly
                ? "待定"
                : isCol1
                  ? "待定"
                  : "作出您的选择";

              return (
                <div
                  key={id}
                  style={{ left: pos.x, top: pos.y }}
                  className="absolute pointer-events-auto shadow-sm"
                >
                  <BracketSlot
                    slot={
                      getSlot(id) || {
                        id,
                        type: id.split("-")[0] as any,
                        teamId: null,
                      }
                    }
                    readOnly={readOnly}
                    disableDragDrop={isCol1}
                    onDrop={onDrop}
                    onClick={onClick}
                    emptyTitle={emptyTitle}
                  />
                </div>
              );
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>

      <MatchDialog
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
};
