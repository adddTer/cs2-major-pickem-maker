import React, { useState, useContext } from "react";
import { TEAMS } from "../data/teams";
import { GLOBAL_SEEDING } from "../data/seedings";
import { getLocalStrength, LOCAL_POINTS } from "../data/localPoints";
import { MATCHES } from "../data/matches";
import { BracketMatch } from "../types";
import { cn } from "../lib/utils";
import { useFitScale } from "../utils/hooks";
import { TeamLogo } from "./TeamLogo";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { MatchDialog } from "./MatchDialog";
import { TournamentBracketRenderer } from "./TournamentBracketRenderer";
import { SWISS_CONFIG, BracketNode } from "../data/bracketConfigs";
import { ExportContext } from "../lib/ExportContext";

export const MatchParticipant = ({ teamId }: { teamId?: string }) => {
  const team = TEAMS.find((t) => t.id === teamId);
  const isExport = useContext(ExportContext);
  if (team) {
    return (
      <div className={cn("w-[36px] h-[36px] shrink-0 flex items-center justify-center relative zoom-in-95 animate-in rounded-md border border-black/5 dark:border-white/5", isExport ? "bg-zinc-100 dark:bg-zinc-800" : "bg-zinc-100/50 dark:bg-zinc-800/50", !isExport && "shadow-sm")}>
        <TeamLogo team={team} fallbackClasses="rounded-[4px] text-[0.625rem]" />
      </div>
    );
  }
  return (
    <div className={cn("w-[36px] h-[36px] shrink-0 rounded-md border border-dashed border-black/20 dark:border-white/20 flex items-center justify-center font-display font-semibold text-zinc-400 dark:text-zinc-600 text-xs pb-[1px] relative zoom-in-95 animate-in", isExport ? "bg-zinc-100 dark:bg-zinc-900" : "bg-zinc-100/50 dark:bg-zinc-900/50", !isExport && "shadow-inner")}>
      ?
    </div>
  );
};

const MatchLine: React.FC<{
  match?: BracketMatch;
  onClick?: (m: BracketMatch) => void;
  simulateWinner?: (m: BracketMatch, winner: 1 | 2 | 0) => void;
  isSimulated?: boolean;
}> = ({ match, onClick, simulateWinner, isSimulated }) => {
  const isExport = useContext(ExportContext);
  const hasResult = match?.score1 !== undefined && match?.score2 !== undefined;

  let isFinished = false;
  if (hasResult) {
    if (match?.format === "bo3") {
      isFinished = match.score1 === 2 || match.score2 === 2;
    } else if (match?.format === "bo5") {
      isFinished = match.score1 === 3 || match.score2 === 3;
    } else {
      isFinished = match.score1 !== match.score2; // bo1, not a draw
    }
  }

  const isLive = match?.status === "live";

  let displayLeft = match?.score1;
  let displayRight = match?.score2;

  if (match?.format === "bo1" && match.maps?.[0]) {
    displayLeft = match.maps[0].score1;
    displayRight = match.maps[0].score2;
  }

  const titleStr = match?.maps
    ?.map((m) => `${m.score1}:${m.score2}`)
    .join(" | ");

  const isInteractive = simulateWinner || hasResult;
  const isClickable =
    !simulateWinner &&
    match?.team1Id &&
    match?.team2Id &&
    match.team1Id !== "tbd" &&
    match.team2Id !== "tbd";

  const handleTeamClick = (e: React.MouseEvent, side: 1 | 2) => {
    if (simulateWinner && match) {
      e.stopPropagation();
      let nextWinner: 1 | 2 | 0 = 0;
      const t1Wins =
        (match.format === "bo3" && match.score1 === 2) ||
        (match.format === "bo1" && match.score1 === 1);
      const t2Wins =
        (match.format === "bo3" && match.score2 === 2) ||
        (match.format === "bo1" && match.score2 === 1);

      if (side === 1) {
        nextWinner = t1Wins ? 0 : 1;
      } else {
        nextWinner = t2Wins ? 0 : 2;
      }
      simulateWinner(match, nextWinner);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center relative z-20 w-full px-3 h-[64px] justify-center border-b border-black/5 dark:border-white/5 last:border-[0px] transition-all duration-300 group rounded-xl",
        isClickable
          ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
          : "",
      )}
      title={titleStr}
      onClick={() => {
        if (isClickable && onClick && match) {
          onClick(match);
        }
      }}
    >
      <div className="flex items-center gap-3 justify-center w-full">
        <div
          onClick={(e) => (simulateWinner ? handleTeamClick(e, 1) : undefined)}
          className={cn(
            "p-1 rounded-lg transition-all duration-300",
            simulateWinner
              ? "cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
              : "",
            hasResult && (match?.score2 ?? 0) > (match?.score1 ?? 0)
              ? cn("opacity-40 grayscale", !isExport && "blur-[0.5px]")
              : cn("opacity-100", !isExport && "drop-shadow-sm"),
            simulateWinner && (match?.score1 ?? 0) > (match?.score2 ?? 0)
              ? cn("ring-2 ring-emerald-500 bg-emerald-500/20", !isExport && "shadow-[0_0_15px_rgba(16,185,129,0.3)]")
              : "",
          )}
        >
          <MatchParticipant teamId={match?.team1Id} />
        </div>
        {hasResult ? (
          <div className={cn("flex flex-col items-center justify-center w-[44px] h-[36px] shrink-0 relative rounded-md border border-black/5 dark:border-white/5", isExport ? "bg-zinc-100 dark:bg-zinc-900" : "bg-zinc-100/50 dark:bg-zinc-900/50", !isExport && "shadow-inner")}>
            <div className="flex items-center justify-center w-full gap-0 px-1">
              <span
                className={cn(
                  "flex-1 text-center text-[0.8125rem] font-mono font-bold tracking-tight",
                  isLive && !isSimulated
                    ? cn("text-black dark:text-white", !isExport && "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]")
                    : (displayLeft ?? 0) > (displayRight ?? 0)
                      ? cn("text-emerald-500 dark:text-emerald-400", !isExport && "drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]")
                      : "text-zinc-500 dark:text-zinc-500",
                )}
              >
                {displayLeft}
              </span>
              <span className="w-[6px] text-center shrink-0 text-[0.625rem] text-zinc-400 dark:text-zinc-600 font-bold mx-0.5">
                :
              </span>
              <span
                className={cn(
                  "flex-1 text-center text-[0.8125rem] font-mono font-bold tracking-tight",
                  isLive && !isSimulated
                    ? cn("text-black dark:text-white", !isExport && "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]")
                    : (displayRight ?? 0) > (displayLeft ?? 0)
                      ? cn("text-emerald-500 dark:text-emerald-400", !isExport && "drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]")
                      : "text-zinc-500 dark:text-zinc-500",
                )}
              >
                {displayRight}
              </span>
            </div>
            {isSimulated ? (
              <span className={cn("absolute -top-2.5 text-[8px] text-blue-900 dark:text-blue-100 font-bold bg-blue-500/20 dark:bg-blue-500/30 border border-blue-500/40 px-1.5 py-0.5 rounded-full tracking-wider", !isExport && "shadow-sm")}>
                SIM
              </span>
            ) : isLive ? (
              <span className={cn("absolute -top-2.5 text-[8px] text-rose-900 dark:text-rose-100 font-bold bg-rose-500/20 dark:bg-rose-500/30 border border-rose-500/40 px-1.5 py-0.5 rounded-full tracking-wider animate-pulse", !isExport && "shadow-[0_0_8px_rgba(244,63,94,0.4)]")}>
                LIVE
              </span>
            ) : match.format === "bo3" || match.format === "bo5" ? (
              <span className="absolute -top-2 text-[8px] text-zinc-500 dark:text-zinc-400 uppercase font-mono tracking-wider font-semibold bg-zinc-100 dark:bg-zinc-900 px-1 rounded border border-black/5 dark:border-white/5">
                {match.format.toUpperCase()}
              </span>
            ) : null}
          </div>
        ) : (
          <div className={cn("flex items-center justify-center w-[44px] h-[36px] shrink-0 relative rounded-md border border-dashed border-black/10 dark:border-white/10", isExport ? "bg-zinc-100 dark:bg-zinc-900" : "bg-zinc-100/30 dark:bg-zinc-900/30")}>
            <span className="text-[0.625rem] text-zinc-400 dark:text-zinc-500 font-display font-bold w-full text-center uppercase tracking-widest shrink-0 transition-colors">
              VS
            </span>
            {isLive ? (
              <span className={cn("absolute -top-2.5 text-[8px] text-rose-900 dark:text-rose-100 font-bold bg-rose-500/20 dark:bg-rose-500/30 border border-rose-500/40 px-1.5 py-0.5 rounded-full tracking-wider animate-pulse", !isExport && "shadow-[0_0_8px_rgba(244,63,94,0.4)]")}>
                LIVE
              </span>
            ) : match?.format === "bo3" || match?.format === "bo5" ? (
              <span className="absolute -top-2 text-[8px] text-zinc-500 dark:text-zinc-400 uppercase font-mono tracking-wider font-semibold bg-zinc-100 dark:bg-zinc-900 px-1 rounded border border-black/5 dark:border-white/5">
                {match.format.toUpperCase()}
              </span>
            ) : null}
          </div>
        )}
        <div
          onClick={(e) => (simulateWinner ? handleTeamClick(e, 2) : undefined)}
          className={cn(
            "p-1 rounded-lg transition-all duration-300",
            simulateWinner
              ? "cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
              : "",
            hasResult && (match?.score1 ?? 0) > (match?.score2 ?? 0)
              ? cn("opacity-40 grayscale", !isExport && "blur-[0.5px]")
              : cn("opacity-100", !isExport && "drop-shadow-sm"),
            simulateWinner && (match?.score2 ?? 0) > (match?.score1 ?? 0)
              ? cn("ring-2 ring-emerald-500 bg-emerald-500/20", !isExport && "shadow-[0_0_15px_rgba(16,185,129,0.3)]")
              : "",
          )}
        >
          <MatchParticipant teamId={match?.team2Id} />
        </div>
      </div>
    </div>
  );
};

export const GroupBox = ({
  score,
  count,
  matches = [],
  onMatchClick,
  simulateWinner,
  isExportNode,
}: {
  score: string;
  count: number;
  matches?: BracketMatch[];
  onMatchClick?: (m: BracketMatch) => void;
  simulateWinner?: (m: BracketMatch, winner: 1 | 2 | 0) => void;
  isExportNode?: boolean;
}) => {
  const isExportCtx = useContext(ExportContext);
  const isExport = isExportNode !== undefined ? isExportNode : isExportCtx;
  return (
    <div className={cn(
      "border rounded-2xl px-2 pt-8 pb-3 flex flex-col items-center relative w-[180px] shrink-0 z-10 pointer-events-auto transition-transform duration-300 hover:-translate-y-1 border-white/40 dark:border-white/10",
      isExport ? "bg-white dark:bg-zinc-900" : "bg-white/60 dark:bg-zinc-900/60",
      !isExport && "shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-xl"
    )}>
      <div className="absolute top-2 left-0 w-full flex justify-center">
        <div className={cn("px-3 py-1 rounded-full border border-black/5 dark:border-white/5", isExport ? "bg-zinc-200 dark:bg-zinc-800" : "bg-zinc-200/50 dark:bg-zinc-800/80", !isExport && "shadow-inner")}>
          <span className={cn("text-[0.6875rem] font-display font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest leading-none", !isExport && "drop-shadow-sm")}>
            {score}
          </span>
        </div>
      </div>
      <div className="flex flex-col w-full items-center justify-center relative mt-2 gap-1">
        {Array.from({ length: count }).map((_, i) => (
          <MatchLine
            key={i}
            match={matches[i]}
            onClick={onMatchClick}
            simulateWinner={simulateWinner}
            isSimulated={(matches[i] as any)?.isSimulated}
          />
        ))}
      </div>
    </div>
  );
};

const DrawPath: React.FC<{ p1: any; p2: any; win: boolean }> = ({
  p1,
  p2,
  win,
}) => {
  const isExport = useContext(ExportContext);
  let sx = p1.x + p1.o1;
  let sy = p1.y;
  let ex = p2.x - p2.o2;
  let ey = p2.y;

  const dist = Math.abs(ex - sx);
  const cx1 = sx + dist * 0.5;
  const cx2 = ex - dist * 0.5;

  return (
    <path
      d={`M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ey}, ${ex} ${ey}`}
      stroke={`url(#${win ? "win" : "loss"}-grad)`}
      strokeWidth="2"
      fill="none"
      className={cn(
        "transition-all duration-500",
        win && !isExport ? "drop-shadow-[0_0_3px_rgba(16,185,129,0.4)]" : "",
      )}
      strokeDasharray={win ? "none" : "6 4"}
      strokeLinecap="round"
    />
  );
};

export const ResultGroup = ({
  score,
  count,
  win,
  teams = [],
  isExportNode,
}: {
  score: string;
  count: number;
  win: boolean;
  teams?: string[];
  isExportNode?: boolean;
}) => {
  const isExportCtx = useContext(ExportContext);
  const isExport = isExportNode !== undefined ? isExportNode : isExportCtx;
  return (
    <div
      className={cn(
        "border rounded-2xl px-2 pt-8 pb-3 flex flex-col items-center relative w-[180px] shrink-0 z-10 pointer-events-auto transition-transform duration-300 hover:-translate-y-1",
        !isExport && "shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-xl",
        win
          ? cn(
              isExport ? "bg-emerald-50 dark:bg-emerald-950" : "bg-emerald-50/60 dark:bg-emerald-950/40", 
              "border-emerald-400/30 dark:border-emerald-500/20",
              !isExport && "bg-gradient-to-br from-emerald-400/10 dark:from-emerald-500/20 via-transparent to-transparent"
            )
          : cn(
              isExport ? "bg-rose-50 dark:bg-rose-950" : "bg-rose-50/60 dark:bg-rose-950/40",
              "border-rose-400/30 dark:border-rose-500/20",
              !isExport && "bg-gradient-to-br from-rose-400/10 dark:from-rose-500/20 via-transparent to-transparent"
            ),
      )}
    >
      <div className="absolute top-2 left-0 w-full flex justify-center">
        <div
          className={cn(
            "px-3 py-1 rounded-full border",
            !isExport && "shadow-inner",
            win
              ? cn(isExport ? "bg-emerald-100 dark:bg-emerald-900" : "bg-emerald-100/50 dark:bg-emerald-900/50", "border-emerald-500/20")
              : cn(isExport ? "bg-rose-100 dark:bg-rose-900" : "bg-rose-100/50 dark:bg-rose-900/50", "border-rose-500/20"),
          )}
        >
          <span
            className={cn(
              "text-[0.6875rem] font-display font-bold uppercase tracking-widest leading-none",
              !isExport && "drop-shadow-sm",
              win
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-rose-700 dark:text-rose-400",
            )}
          >
            {score}
          </span>
        </div>
      </div>
      <div className="flex flex-col w-full items-center justify-center relative mt-2 gap-1">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center relative z-20 w-full p-1 justify-center border-b border-black/5 dark:border-white/5 last:border-[0px]"
          >
            <div className="flex items-center gap-2 justify-center w-full">
              <MatchParticipant teamId={teams[i]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SwissBracket = ({
  activeStage,
  externalPredictions,
  isAnimating,
  refreshTrigger,
  currentEvent,
}: {
  activeStage: string;
  externalPredictions?: Record<string, any>;
  isAnimating?: boolean;
  refreshTrigger?: number;
  currentEvent?: import("../types").TournamentEvent;
}) => {
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, any>>({});

  const calculatedScale = isAnimating
    ? Math.min(
        (window.innerWidth * 0.95) / 1200,
        (window.innerHeight * 0.75) / 1000,
      )
    : 1;

  React.useEffect(() => {
    if (!simulationMode) setPredictions({});
  }, [simulationMode]);

  const activePredictions = externalPredictions || predictions;
  const activeSimMode = simulationMode || !!externalPredictions;

  const matchesMap = React.useMemo(() => {
    const origMap = MATCHES[activeStage] || {};
    if (!activeSimMode) return origMap;

    const map: Record<string, BracketMatch[]> = {};
    const teamsRecord: Record<
      string,
      { wins: number; losses: number; opponents: string[]; initialSeed: number }
    > = {};
    const r0 = origMap["0:0"] || [];

    // Collect all unique teams from 0:0
    const allTids = Array.from(
      new Set(
        r0.flatMap((m: BracketMatch) => [m.team1Id, m.team2Id]).filter(Boolean),
      ),
    ) as string[];

    // Sort them by vRank / GLOBAL_SEEDING to determine initialSeed
    allTids.sort((a, b) => {
      const seedA = GLOBAL_SEEDING[a] || 99;
      const seedB = GLOBAL_SEEDING[b] || 99;
      return seedA - seedB;
    });

    allTids.forEach((tid, idx) => {
      if (tid !== "tbd") {
        teamsRecord[tid] = {
          wins: 0,
          losses: 0,
          opponents: [],
          initialSeed: GLOBAL_SEEDING[tid] || idx + 1,
        };
      }
    });

    const rounds = [
      ["0:0"],
      ["1:0", "0:1"],
      ["2:0", "1:1", "0:2"],
      ["2:1", "1:2"],
      ["2:2"],
    ];

    rounds.forEach((groups, roundIndex) => {
      const roundRecordUpdates: (() => void)[] = [];

      groups.forEach((group) => {
        map[group] = [];
        const [w, l] = group.split(":").map(Number);

        const eligibleTeams = Object.entries(teamsRecord)
          .filter(([_, record]) => record.wins === w && record.losses === l)
          .map(([tid]) => tid);

        const realMatches = origMap[group] || [];
        const matchedTeams = new Set<string>();

        // Always add real matches first if available
        realMatches.forEach((m) => {
          if (
            m.team1Id &&
            m.team2Id &&
            eligibleTeams.includes(m.team1Id) &&
            eligibleTeams.includes(m.team2Id)
          ) {
            matchedTeams.add(m.team1Id);
            matchedTeams.add(m.team2Id);
            map[group].push({ ...m });
          }
        });

        const remainingTeams = eligibleTeams.filter(
          (t) => !matchedTeams.has(t),
        );

        // Calculate Buchholz score (Match Difference ONLY)
        const getBuchholz = (tid: string) => {
          return teamsRecord[tid].opponents.reduce((sum, oppId) => {
            const opp = teamsRecord[oppId];
            if (!opp) return sum;
            return sum + (opp.wins - opp.losses);
          }, 0);
        };

        // Rank remaining teams
        remainingTeams.sort((a, b) => {
          const bhA = getBuchholz(a);
          const bhB = getBuchholz(b);
          if (bhA !== bhB) return bhB - bhA; // Descending Buchholz

          const seedA = teamsRecord[a].initialSeed || 99;
          const seedB = teamsRecord[b].initialSeed || 99;
          return seedA - seedB; // Ascending initial seed
        });

        const pool = [...remainingTeams];
        let pairings: [string, string][] = [];
        let poolMatched = new Set<string>();

        if (activeSimMode && Object.keys(activePredictions).length > 0) {
          for (const t1 of pool) {
            if (poolMatched.has(t1)) continue;
            for (const t2 of pool) {
              if (t1 === t2 || poolMatched.has(t2)) continue;
              const k1 = `${t1}-${t2}`;
              const k2 = `${t2}-${t1}`;
              const p = activePredictions[k1] || activePredictions[k2];
              if (
                p &&
                (p.stageRound === undefined || p.stageRound === roundIndex)
              ) {
                pairings.push([t1, t2]);
                poolMatched.add(t1);
                poolMatched.add(t2);
                break;
              }
            }
          }
        }

        const remainingPool = pool.filter((t) => !poolMatched.has(t));

        if (remainingPool.length > 0) {
          let remainingPairings: [string, string][] | null = null;
          if (w === 0 && l === 0 && remainingPool.length === pool.length) {
            remainingPairings = [];
            const half = Math.floor(remainingPool.length / 2);
            for (let i = 0; i < half; i++) {
              remainingPairings.push([
                remainingPool[i],
                remainingPool[i + half],
              ]);
            }
          } else {
            function findValidPairing(
              teams: string[],
            ): [string, string][] | null {
              if (teams.length === 0) return [];
              const t1 = teams[0];
              for (let i = teams.length - 1; i >= 1; i--) {
                const t2 = teams[i];
                if (!teamsRecord[t1].opponents.includes(t2)) {
                  const rest = [...teams];
                  rest.splice(i, 1);
                  rest.splice(0, 1);
                  const sub = findValidPairing(rest);
                  if (sub !== null) {
                    return [[t1, t2], ...sub];
                  }
                }
              }
              return null;
            }

            remainingPairings = findValidPairing([...remainingPool]);
            if (!remainingPairings) {
              remainingPairings = [];
              const temp = [...remainingPool];
              while (temp.length >= 2) {
                remainingPairings.push([temp.shift()!, temp.pop()!]);
              }
            }
          }
          if (remainingPairings) {
            pairings.push(...remainingPairings);
          }
        }

        pairings.forEach(([teamA, teamB]) => {
          map[group].push({
            team1Id: teamA,
            team2Id: teamB,
            format: currentEvent?.isSwissAllBo3
              ? "bo3"
              : activeStage === "stage3"
                ? "bo3"
                : w === 2 || l === 2
                  ? "bo3"
                  : "bo1",
          } as BracketMatch);
        });

        map[group].forEach((m) => {
          if (!m.team1Id || !m.team2Id) return;

          const pKey = `${m.team1Id}-${m.team2Id}`;
          const pKeyRev = `${m.team2Id}-${m.team1Id}`;
          let pVal = activePredictions[pKey];
          if (
            pVal &&
            pVal.stageRound !== undefined &&
            pVal.stageRound !== roundIndex
          ) {
            pVal = undefined;
          }
          if (!pVal && activePredictions[pKeyRev]) {
            const reverse = activePredictions[pKeyRev];
            if (
              reverse.stageRound === undefined ||
              reverse.stageRound === roundIndex
            ) {
              if (reverse.winner !== 0) {
                pVal = {
                  winner: reverse.winner === 1 ? 2 : 1,
                  score1: reverse.score2,
                  score2: reverse.score1,
                };
              }
            }
          }

          if (pVal && pVal.winner === 1) {
            m.score1 = pVal.score1;
            m.score2 = pVal.score2;
            (m as any).isSimulated = true;
            roundRecordUpdates.push(() => {
              teamsRecord[m.team1Id].wins++;
              teamsRecord[m.team2Id].losses++;
            });
          } else if (pVal && pVal.winner === 2) {
            m.score1 = pVal.score1;
            m.score2 = pVal.score2;
            (m as any).isSimulated = true;
            roundRecordUpdates.push(() => {
              teamsRecord[m.team1Id].losses++;
              teamsRecord[m.team2Id].wins++;
            });
          } else {
            let hasResult =
              m.score1 !== undefined &&
              m.score2 !== undefined &&
              m.status === "past";

            let t1Wins = false;
            if (hasResult) {
              if (m.format === "bo3") {
                t1Wins = m.score1 === 2;
                if (m.score1 !== 2 && m.score2 !== 2) hasResult = false;
              } else if (m.format === "bo5") {
                t1Wins = m.score1 === 3;
                if (m.score1 !== 3 && m.score2 !== 3) hasResult = false;
              } else {
                t1Wins = m.score1! > m.score2!;
              }
            }

            if (hasResult) {
              if (t1Wins) {
                roundRecordUpdates.push(() => {
                  teamsRecord[m.team1Id].wins++;
                  teamsRecord[m.team2Id].losses++;
                });
              } else {
                roundRecordUpdates.push(() => {
                  teamsRecord[m.team1Id].losses++;
                  teamsRecord[m.team2Id].wins++;
                });
              }
            } else if (!simulationMode) {
              // If we are NOT simulating and no outcome yet, we still know they are opponents
              // But their wins/losses won't change
            }
          }

          roundRecordUpdates.push(() => {
            if (!teamsRecord[m.team1Id].opponents.includes(m.team2Id)) {
              teamsRecord[m.team1Id].opponents.push(m.team2Id);
            }
            if (!teamsRecord[m.team2Id].opponents.includes(m.team1Id)) {
              teamsRecord[m.team2Id].opponents.push(m.team1Id);
            }
          });
        });
      });

      roundRecordUpdates.forEach((fn) => fn());
    });

    return map;
  }, [activeSimMode, activeStage, activePredictions, refreshTrigger]);

  React.useEffect(() => {
    if (selectedMatch) {
      // Find the updated match object in matchesMap
      let updatedMatch = null;
      for (const group of Object.values(matchesMap) as BracketMatch[][]) {
        const found = group.find(
          (m: BracketMatch) =>
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
  }, [matchesMap, selectedMatch]);

  const handleSimulateWinner = (match: BracketMatch, winner: 1 | 2 | 0) => {
    let score1 = 0;
    let score2 = 0;
    if (winner === 1) {
      score1 = match.format === "bo3" ? 2 : match.format === "bo5" ? 3 : 1;
      score2 = 0;
    } else if (winner === 2) {
      score1 = 0;
      score2 = match.format === "bo3" ? 2 : match.format === "bo5" ? 3 : 1;
    }

    setPredictions((prev) => ({
      ...prev,
      [`${match.team1Id}-${match.team2Id}`]: { winner, score1, score2 },
    }));
  };

  const handleAutoSimulateNextRound = () => {
    const newPredictions = { ...predictions };
    let advanced = false;

    // Traverse current matches in matchesMap and predict unplayed matches
    Object.values(matchesMap).forEach((group: unknown) => {
      (group as BracketMatch[]).forEach((m) => {
        if (
          m.team1Id &&
          m.team2Id &&
          m.team1Id !== "tbd" &&
          m.team2Id !== "tbd"
        ) {
          const pKey = `${m.team1Id}-${m.team2Id}`;
          const pKeyRev = `${m.team2Id}-${m.team1Id}`;
          // Check if no existing prediction and no actual score
          if (
            newPredictions[pKey] === undefined &&
            newPredictions[pKeyRev] === undefined &&
            m.score1 === undefined &&
            m.score2 === undefined
          ) {
            const t1 = TEAMS.find((t) => t.id === m.team1Id);
            const t2 = TEAMS.find((t) => t.id === m.team2Id);
            const fallbackS1 =
              getLocalStrength(m.team1Id) ||
              2000 - (GLOBAL_SEEDING[m.team1Id] || 32) * 30;
            const fallbackS2 =
              getLocalStrength(m.team2Id) ||
              2000 - (GLOBAL_SEEDING[m.team2Id] || 32) * 30;
            const s1 = t1?.strength || fallbackS1;
            const s2 = t2?.strength || fallbackS2;

            let score1 = 0;
            let score2 = 0;

            if (m.format === "bo3") {
              const M = 1300;
              const mapAdv = 150; // Elo advantage for map pick

              const pMap1 = 1 / (1 + Math.pow(10, (s2 - (s1 + mapAdv)) / M)); // T1 map pick
              const pMap2 = 1 / (1 + Math.pow(10, (s2 + mapAdv - s1) / M)); // T2 map pick
              const pMap3 = 1 / (1 + Math.pow(10, (s2 - s1) / M)); // Decider

              const p2_0 = pMap1 * pMap2;
              const p2_1 =
                pMap1 * (1 - pMap2) * pMap3 + (1 - pMap1) * pMap2 * pMap3;
              const p1_2 =
                pMap1 * (1 - pMap2) * (1 - pMap3) +
                (1 - pMap1) * pMap2 * (1 - pMap3);
              const p0_2 = (1 - pMap1) * (1 - pMap2);

              const bestProb = Math.max(p2_0, p2_1, p1_2, p0_2);
              if (bestProb === p2_0) {
                score1 = 2;
                score2 = 0;
              } else if (bestProb === p2_1) {
                score1 = 2;
                score2 = 1;
              } else if (bestProb === p1_2) {
                score1 = 1;
                score2 = 2;
              } else {
                score1 = 0;
                score2 = 2;
              }
            } else if (m.format === "bo5") {
              const isClose = Math.abs(s1 - s2) < 200;
              const p1Wins = s1 >= s2;
              score1 = p1Wins ? 3 : isClose ? 2 : 0;
              score2 = !p1Wins ? 3 : isClose ? 2 : 0;
            } else {
              const p1Wins = s1 >= s2;
              score1 = p1Wins ? 1 : 0;
              score2 = !p1Wins ? 1 : 0;
            }

            const winner = score1 > score2 ? 1 : 2;
            newPredictions[pKey] = { winner, score1, score2 };
            advanced = true;
          }
        }
      });
    });

    if (advanced) {
      setPredictions(newPredictions);
    }
  };

  const getMatches = (score: string) => {
    return matchesMap[score] || [];
  };

  const getFinalTeams = (wins: number, losses: number) => {
    const records: Record<string, { w: number; l: number }> = {};

    Object.values(matchesMap)
      .flat()
      .forEach((m) => {
        const match = m as BracketMatch;
        let hasResult =
          match.score1 !== undefined && match.score2 !== undefined;

        if (hasResult) {
          let isFinished = false;
          if (match.format === "bo3") {
            isFinished = match.score1 === 2 || match.score2 === 2;
          } else if (match.format === "bo5") {
            isFinished = match.score1 === 3 || match.score2 === 3;
          } else {
            isFinished = match.score1 !== match.score2;
          }

          if (isFinished) {
            let t1Win = match.score1! > match.score2!;

            if (match.team1Id && match.team1Id !== "tbd") {
              if (!records[match.team1Id])
                records[match.team1Id] = { w: 0, l: 0 };
              t1Win ? records[match.team1Id].w++ : records[match.team1Id].l++;
            }
            if (match.team2Id && match.team2Id !== "tbd") {
              if (!records[match.team2Id])
                records[match.team2Id] = { w: 0, l: 0 };
              t1Win ? records[match.team2Id].l++ : records[match.team2Id].w++;
            }
          }
        }
      });

    return Object.entries(records)
      .filter(([_, r]) => r.w === wins && r.l === losses)
      .map(([id]) => id);
  };

  const isRoundIncomplete =
    (MATCHES[activeStage]?.["0:0"] || []).length < 8 ||
    (MATCHES[activeStage]?.["0:0"] || []).some(
      (m: BracketMatch) =>
        !m.team1Id || !m.team2Id || m.team1Id === "tbd" || m.team2Id === "tbd",
    );

  const renderNode = (node: BracketNode, isExportNode?: boolean) => {
    if (node.type === "swissGroup") {
      return (
        <GroupBox
          score={node.score!}
          count={node.count!}
          matches={getMatches(node.score!)}
          onMatchClick={setSelectedMatch}
          simulateWinner={simulationMode ? handleSimulateWinner : undefined}
          isExportNode={isExportNode}
        />
      );
    } else if (node.type === "swissResult") {
      const wins = parseInt(node.score!.split(":")[0]);
      const losses = parseInt(node.score!.split(":")[1]);
      return (
        <ResultGroup
          score={node.score!}
          count={node.count!}
          win={node.win!}
          teams={getFinalTeams(wins, losses)}
          isExportNode={isExportNode}
        />
      );
    }
    return null;
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden z-10 relative">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-auto">
        {!isAnimating && !externalPredictions && (
          <div className="flex gap-2 isolate">
            <button
              onClick={() => {
                if (isRoundIncomplete) return;
                setSimulationMode(!simulationMode);
              }}
              disabled={isRoundIncomplete}
              className={cn(
                "px-3 py-1.5 border rounded-[4px] text-xs font-bold shadow-lg transition-colors flex items-center gap-2",
                isRoundIncomplete
                  ? "opacity-50 cursor-not-allowed bg-zinc-200/50 dark:bg-black/50 text-zinc-500 dark:text-zinc-600 border-black/5 dark:border-white/5"
                  : simulationMode
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
                className="px-3 py-1.5 border rounded-[4px] text-xs font-bold shadow-lg transition-colors flex items-center gap-2 bg-zinc-700/50 text-zinc-800 dark:text-zinc-300 border-zinc-600/50 hover:bg-zinc-700/80"
              >
                推演下一轮
              </button>
            )}
          </div>
        )}

        {!isAnimating &&
          !externalPredictions &&
          (isRoundIncomplete ? (
            <div className="mt-2 text-[0.625rem] text-rose-400/80 bg-rose-500/10 px-2 py-1 rounded w-max border border-rose-500/20">
              初始对决尚未完全确定，暂不支持模拟
            </div>
          ) : (
            simulationMode && (
              <div className="mt-2 text-[0.625rem] text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 bg-zinc-200/50 dark:bg-black/50 px-2 py-1 rounded w-max border border-black/5 dark:border-white/5">
                点击队伍标识切换胜负关系
              </div>
            )
          ))}
      </div>

      <TournamentBracketRenderer
        config={SWISS_CONFIG}
        renderNode={renderNode}
        initialScale={calculatedScale}
        title={currentEvent?.name}
        logoUrl={currentEvent?.logoUrl}
        svgDefs={
          <defs>
            <linearGradient id="win-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="loss-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="1" />
            </linearGradient>
          </defs>
        }
      />

      <MatchDialog
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
};
