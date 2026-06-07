import React, { useState } from "react";
import { TEAMS } from "../data/teams";
import { GLOBAL_SEEDING } from "../data/seedings";
import { MATCHES } from "../data/matches";
import { BracketMatch } from "../types";
import { cn } from "../lib/utils";
import { useFitScale } from "../utils/hooks";
import { TeamLogo } from "./TeamLogo";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { MatchDialog } from "./MatchDialog";

export const MatchParticipant = ({ teamId }: { teamId?: string }) => {
  const team = TEAMS.find((t) => t.id === teamId);
  if (team) {
    return (
      <div className="w-[32px] h-[32px] shrink-0 flex items-center justify-center relative zoom-in-95 animate-in">
        <TeamLogo team={team} fallbackClasses="rounded-[4px] text-[9px]" />
      </div>
    );
  }
  return (
    <div className="w-[32px] h-[32px] shrink-0 rounded-[4px] bg-zinc-950/80 border border-white/10 flex items-center justify-center font-bold text-zinc-500 text-[11px] shadow-inner pb-[1px] relative zoom-in-95 animate-in">
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
  const hasResult = match?.score1 !== undefined && match?.score2 !== undefined;
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
  const isClickable = !simulateWinner && match?.team1Id && match?.team2Id && match.team1Id !== "tbd" && match.team2Id !== "tbd";

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
        "flex flex-col items-center relative z-20 w-full px-2 h-[54px] justify-center border-b border-white/5 last:border-[0px] transition-colors group rounded-sm",
        isClickable ? "cursor-pointer hover:bg-white/5" : "",
      )}
      title={titleStr}
      onClick={() => {
        if (isClickable && onClick && match) {
          onClick(match);
        }
      }}
    >
      <div className="flex items-center gap-2 justify-center w-full">
        <div
          onClick={(e) => (simulateWinner ? handleTeamClick(e, 1) : undefined)}
          className={cn(
            "p-1 rounded transition-all",
            simulateWinner ? "cursor-pointer hover:bg-white/10" : "",
            hasResult && (match?.score2 ?? 0) > (match?.score1 ?? 0)
              ? "opacity-30 grayscale"
              : "opacity-100",
            simulateWinner && (match?.score1 ?? 0) > (match?.score2 ?? 0)
              ? "ring-1 ring-emerald-500 bg-emerald-500/10"
              : "",
          )}
        >
          <MatchParticipant teamId={match?.team1Id} />
        </div>
        {hasResult ? (
          <div className="flex items-center justify-center w-[36px] h-[32px] shrink-0 relative">
            <div className="flex items-center justify-center w-full gap-0">
              <span
                className={cn(
                  "flex-1 text-right text-[11px] font-bold",
                  isLive && !isSimulated
                    ? "text-white"
                    : (displayLeft ?? 0) > (displayRight ?? 0)
                      ? "text-emerald-400 drop-shadow-sm"
                      : "text-zinc-500",
                )}
              >
                {displayLeft}
              </span>
              <span className="w-[8px] text-center shrink-0 text-[10px] text-zinc-700">
                -
              </span>
              <span
                className={cn(
                  "flex-1 text-left text-[11px] font-bold",
                  isLive && !isSimulated
                    ? "text-white"
                    : (displayRight ?? 0) > (displayLeft ?? 0)
                      ? "text-emerald-400 drop-shadow-sm"
                      : "text-zinc-500",
                )}
              >
                {displayRight}
              </span>
            </div>
            {isSimulated ? (
              <span className="absolute -bottom-[4px] text-[8px] text-zinc-100 font-bold bg-blue-600/90 px-1 rounded-[2px] tracking-tighter scale-[0.8]">
                SIM
              </span>
            ) : isLive ? (
              <span className="absolute -bottom-[4px] text-[8px] text-zinc-100 font-bold bg-rose-600/90 px-1 rounded-[2px] tracking-tighter scale-[0.8]">
                LIVE
              </span>
            ) : match.format === "bo3" || match.format === "bo5" ? (
              <span className="absolute -bottom-[4px] text-[8px] text-zinc-500 uppercase font-mono tracking-tighter scale-75">
                {match.format.toUpperCase()}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center justify-center w-[36px] h-[32px] shrink-0 relative">
            <span className="text-[10px] text-zinc-600/80 font-medium w-full text-center uppercase tracking-widest shrink-0 transition-colors">
              vs
            </span>
            {(match?.format === "bo3" || match?.format === "bo5") && (
              <span className="absolute -bottom-[4px] text-[8px] text-zinc-500 uppercase font-mono tracking-tighter scale-75">
                {match.format.toUpperCase()}
              </span>
            )}
          </div>
        )}
        <div
          onClick={(e) => (simulateWinner ? handleTeamClick(e, 2) : undefined)}
          className={cn(
            "p-1 rounded transition-all",
            simulateWinner ? "cursor-pointer hover:bg-white/10" : "",
            hasResult && (match?.score1 ?? 0) > (match?.score2 ?? 0)
              ? "opacity-30 grayscale"
              : "opacity-100",
            simulateWinner && (match?.score2 ?? 0) > (match?.score1 ?? 0)
              ? "ring-1 ring-emerald-500 bg-emerald-500/10"
              : "",
          )}
        >
          <MatchParticipant teamId={match?.team2Id} />
        </div>
      </div>
    </div>
  );
};

const GroupBox = ({
  score,
  count,
  matches = [],
  onMatchClick,
  simulateWinner,
}: {
  score: string;
  count: number;
  matches?: BracketMatch[];
  onMatchClick?: (m: BracketMatch) => void;
  simulateWinner?: (m: BracketMatch, winner: 1 | 2 | 0) => void;
}) => {
  return (
    <div className="bg-zinc-900/60 border border-white/5 rounded-[8px] px-1 pt-6 pb-2 flex flex-col items-center relative shadow-lg w-[156px] shrink-0 z-10 backdrop-blur-sm pointer-events-auto">
      <div className="absolute top-1.5 right-2 text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">
        {score}
      </div>
      <div className="flex flex-col w-full items-center justify-center relative">
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
      strokeWidth="1.5"
      fill="none"
      strokeDasharray="5 3"
    />
  );
};

const ResultGroup = ({
  score,
  count,
  win,
  teams = [],
}: {
  score: string;
  count: number;
  win: boolean;
  teams?: string[];
}) => {
  return (
    <div
      className={cn(
        "border rounded-[8px] px-1 pt-6 pb-2 flex flex-col items-center relative shadow-lg w-[156px] shrink-0 z-10 backdrop-blur-sm pointer-events-auto",
        win
          ? "bg-emerald-900/60 border-emerald-500/20"
          : "bg-rose-950/60 border-rose-500/20",
      )}
    >
      <div
        className={cn(
          "absolute top-1.5 right-2 text-[11px] font-bold uppercase tracking-tighter",
          win ? "text-emerald-500/80" : "text-rose-500/80",
        )}
      >
        {score}
      </div>
      <div className="flex flex-col w-full items-center justify-center relative">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center relative z-20 w-full px-2 h-[54px] justify-center border-b border-white/5 last:border-[0px]"
          >
            <div className="flex items-center gap-2 justify-center w-full">
               <div className="p-1 rounded opacity-100">
                 <MatchParticipant teamId={teams[i]} />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AbsoluteBox = ({
  p,
  children,
}: {
  p: any;
  children: React.ReactNode;
}) => (
  <div
    style={{ left: p.x, top: p.y }}
    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 w-max"
  >
    {children}
  </div>
);

export const SwissBracket = ({
  activeStage,
  refreshTrigger,
}: {
  activeStage: string;
  refreshTrigger: number;
}) => {
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, 1 | 2 | 0>>({});

  React.useEffect(() => {
    if (!simulationMode) setPredictions({});
  }, [simulationMode]);

  const matchesMap = React.useMemo(() => {
    const origMap = MATCHES[activeStage] || {};
    if (!simulationMode) return origMap;

    const map: Record<string, BracketMatch[]> = {};
    const teamsRecord: Record<
      string,
      { wins: number; losses: number; opponents: string[]; initialSeed: number }
    > = {};
    const r0 = origMap["0:0"] || [];

    // Attempt to figure out initial seed based on 0:0
    // In Swiss 0:0, it's typically Seed 1 vs 16, 2 vs 15... 8 vs 9.
    r0.forEach((m, idx) => {
      if (m.team1Id && m.team1Id !== "tbd")
        teamsRecord[m.team1Id] = {
          wins: 0,
          losses: 0,
          opponents: [],
          initialSeed: idx + 1,
        };
      if (m.team2Id && m.team2Id !== "tbd")
        teamsRecord[m.team2Id] = {
          wins: 0,
          losses: 0,
          opponents: [],
          initialSeed: 16 - idx,
        };
    });

    const rounds = [
      ["0:0"],
      ["1:0", "0:1"],
      ["2:0", "1:1", "0:2"],
      ["2:1", "1:2"],
      ["2:2"],
    ];

    rounds.forEach((groups, roundIndex) => {
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

        // Calculate Buchholz score
        const getBuchholz = (tid: string) => {
          return teamsRecord[tid].opponents.reduce((sum, oppId) => {
            const opp = teamsRecord[oppId];
            if (!opp) return sum;
            return sum + (opp.wins - opp.losses);
          }, 0);
        };

        // Rank remaining teams
        remainingTeams.sort((a, b) => {
          // For Round 1 & 2 (roundIndex 0 and 1), use initial seed only
          if (roundIndex >= 2) {
            const bhA = getBuchholz(a);
            const bhB = getBuchholz(b);
            if (bhA !== bhB) return bhB - bhA; // Descending Buchholz
          }
          const seedA = GLOBAL_SEEDING[a] || teamsRecord[a].initialSeed || 99;
          const seedB = GLOBAL_SEEDING[b] || teamsRecord[b].initialSeed || 99;
          return seedA - seedB; // Ascending initial seed
        });

        // Greedy pairing: Highest vs Lowest available unplayed
        let pool = [...remainingTeams];
        while (pool.length >= 2) {
          const teamA = pool.shift()!;
          let paired = false;

          // Search from bottom up for lowest ranked team that hasn't played teamA
          for (let i = pool.length - 1; i >= 0; i--) {
            const teamB = pool[i];
            if (!teamsRecord[teamA].opponents.includes(teamB)) {
              pool.splice(i, 1);
              map[group].push({
                team1Id: teamA,
                team2Id: teamB,
                format: w === 2 || l === 2 ? "bo3" : "bo1",
              } as BracketMatch);
              paired = true;
              break;
            }
          }

          // Fallback if everyone was played (very rare, just pair with lowest)
          if (!paired && pool.length > 0) {
            const teamB = pool.pop()!;
            map[group].push({
              team1Id: teamA,
              team2Id: teamB,
              format: w === 2 || l === 2 ? "bo3" : "bo1",
            } as BracketMatch);
          }
        }

        map[group].forEach((m) => {
          if (!m.team1Id || !m.team2Id) return;

          // Add to opponents here so subsequent rounds know
          if (!teamsRecord[m.team1Id].opponents.includes(m.team2Id)) {
            teamsRecord[m.team1Id].opponents.push(m.team2Id);
          }
          if (!teamsRecord[m.team2Id].opponents.includes(m.team1Id)) {
            teamsRecord[m.team2Id].opponents.push(m.team1Id);
          }

          const pKey = `${m.team1Id}-${m.team2Id}`;
          const pKeyRev = `${m.team2Id}-${m.team1Id}`;
          const prediction =
            predictions[pKey] ||
            (predictions[pKeyRev] === 1
              ? 2
              : predictions[pKeyRev] === 2
                ? 1
                : 0);

          if (prediction === 1) {
            m.score1 = m.format === "bo3" ? 2 : 1;
            m.score2 = 0;
            (m as any).isSimulated = true;
            teamsRecord[m.team1Id].wins++;
            teamsRecord[m.team2Id].losses++;
          } else if (prediction === 2) {
            m.score1 = 0;
            m.score2 = m.format === "bo3" ? 2 : 1;
            (m as any).isSimulated = true;
            teamsRecord[m.team1Id].losses++;
            teamsRecord[m.team2Id].wins++;
          } else {
            const hasResult =
              m.score1 !== undefined &&
              m.score2 !== undefined &&
              m.status === "past";
            if (hasResult) {
              const t1Wins =
                (m.format === "bo3" && m.score1 === 2) ||
                (m.format === "bo1" && m.score1 === 1);
              if (t1Wins) {
                teamsRecord[m.team1Id].wins++;
                teamsRecord[m.team2Id].losses++;
              } else {
                teamsRecord[m.team1Id].losses++;
                teamsRecord[m.team2Id].wins++;
              }
            } else if (!simulationMode) {
              // If we are NOT simulating and no outcome yet, we still know they are opponents
              // But their wins/losses won't change
            }
          }
        });
      });
    });

    return map;
  }, [simulationMode, activeStage, predictions, refreshTrigger]);

  React.useEffect(() => {
    if (selectedMatch) {
      // Find the updated match object in matchesMap
      let updatedMatch = null;
      for (const group of Object.values(matchesMap)) {
        const found = group.find((m) => 
          (m.externalId && m.externalId === selectedMatch.externalId) || 
          (m.team1Id === selectedMatch.team1Id && m.team2Id === selectedMatch.team2Id)
        );
        if (found) {
          updatedMatch = found;
          break;
        }
      }
      if (updatedMatch) {
        setSelectedMatch(updatedMatch);
      }
    }
  }, [matchesMap]);

  const handleSimulateWinner = (match: BracketMatch, winner: 1 | 2 | 0) => {
    setPredictions((prev) => ({
      ...prev,
      [`${match.team1Id}-${match.team2Id}`]: winner,
    }));
  };

  const pos = {
    g00: { id: "g00", x: 90, y: 420, o1: 65, o2: 65 },

    g10: { id: "g10", x: 280, y: 276, o1: 65, o2: 65 },
    g01: { id: "g01", x: 280, y: 564, o1: 65, o2: 65 },

    g20: { id: "g20", x: 470, y: 186, o1: 65, o2: 65 },
    g11: { id: "g11", x: 470, y: 420, o1: 65, o2: 65 },
    g02: { id: "g02", x: 470, y: 654, o1: 65, o2: 65 },

    g30: { id: "g30", x: 660, y: 111, o1: 65, o2: 65 },
    g21: { id: "g21", x: 660, y: 308, o1: 65, o2: 65 },
    g12: { id: "g12", x: 660, y: 532, o1: 65, o2: 65 },
    g03: { id: "g03", x: 660, y: 729, o1: 65, o2: 65 },

    g31: { id: "g31", x: 850, y: 186, o1: 65, o2: 65 },
    g22: { id: "g22", x: 850, y: 420, o1: 65, o2: 65 },
    g13: { id: "g13", x: 850, y: 654, o1: 65, o2: 65 },

    g32: { id: "g32", x: 1040, y: 303, o1: 65, o2: 65 },
    g23: { id: "g23", x: 1040, y: 537, o1: 65, o2: 65 },
  };

  const pathLines = [
    { p1: pos.g00, p2: pos.g10, win: true },
    { p1: pos.g00, p2: pos.g01, win: false },
    { p1: pos.g10, p2: pos.g20, win: true },
    { p1: pos.g10, p2: pos.g11, win: false },
    { p1: pos.g01, p2: pos.g11, win: true },
    { p1: pos.g01, p2: pos.g02, win: false },

    { p1: pos.g20, p2: pos.g30, win: true },
    { p1: pos.g20, p2: pos.g21, win: false },

    { p1: pos.g11, p2: pos.g21, win: true },
    { p1: pos.g11, p2: pos.g12, win: false },

    { p1: pos.g02, p2: pos.g12, win: true },
    { p1: pos.g02, p2: pos.g03, win: false },

    { p1: pos.g21, p2: pos.g31, win: true },
    { p1: pos.g21, p2: pos.g22, win: false },

    { p1: pos.g12, p2: pos.g22, win: true },
    { p1: pos.g12, p2: pos.g13, win: false },

    { p1: pos.g22, p2: pos.g32, win: true },
    { p1: pos.g22, p2: pos.g23, win: false },
  ];

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
          let t1Win = false;
          let t2Win = false;

          if (match.format === "bo1") {
            t1Win = match.score1 === 1;
            t2Win = match.score2 === 1;
          } else if (match.format === "bo5") {
            t1Win = match.score1 === 3;
            t2Win = match.score2 === 3;
          } else {
            t1Win = match.score1 === 2;
            t2Win = match.score2 === 2;
          }

          if (!t1Win && !t2Win) {
            hasResult = false;
          }

          if (hasResult) {
            if (match.team1Id) {
              if (!records[match.team1Id])
                records[match.team1Id] = { w: 0, l: 0 };
              t1Win ? records[match.team1Id].w++ : records[match.team1Id].l++;
            }
            if (match.team2Id) {
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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden z-10 relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
        <button
          onClick={() => {
            if (isRoundIncomplete) return;
            setSimulationMode(!simulationMode);
          }}
          disabled={isRoundIncomplete}
          className={cn(
            "px-3 py-1.5 border rounded-[4px] text-[12px] font-bold shadow-lg transition-colors flex items-center gap-2",
            isRoundIncomplete
              ? "opacity-50 cursor-not-allowed bg-black/50 text-zinc-600 border-white/5"
              : simulationMode
                ? "bg-blue-600/20 text-blue-400 border-blue-500/50"
                : "bg-black/50 text-zinc-400 border-white/10 hover:bg-white/5",
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

        {isRoundIncomplete ? (
          <div className="mt-2 text-[10px] text-rose-400/80 bg-rose-500/10 px-2 py-1 rounded w-max border border-rose-500/20">
            初始对决尚未完全确定，暂不支持模拟
          </div>
        ) : (
          simulationMode && (
            <div className="mt-2 text-[10px] text-zinc-400 bg-black/50 px-2 py-1 rounded w-max border border-white/5">
              点击队伍标识切换胜负关系
            </div>
          )
        )}
      </div>

      <div className="w-full flex-1 relative">
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
            <div className="w-[1200px] h-[840px] relative pointer-events-none px-4 flex-shrink-0">
              {/* SVG Connections */}
              <svg
                className="absolute inset-0 w-full h-full z-0 opacity-45 pointer-events-none"
                style={{ left: 0, top: 0 }}
              >
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
                {pathLines.map((l, i) => (
                  <DrawPath key={i} p1={l.p1} p2={l.p2} win={l.win} />
                ))}
              </svg>

              {/* Swiss Bracket Boxes */}
              <AbsoluteBox p={pos.g00}>
                <GroupBox
                  score="0:0"
                  count={8}
                  matches={getMatches("0:0")}
                  onMatchClick={setSelectedMatch}
                  simulateWinner={
                    simulationMode ? handleSimulateWinner : undefined
                  }
                />
              </AbsoluteBox>
              <AbsoluteBox p={pos.g10}>
                <GroupBox
                  score="1:0"
                  count={4}
                  matches={getMatches("1:0")}
                  onMatchClick={setSelectedMatch}
                  simulateWinner={
                    simulationMode ? handleSimulateWinner : undefined
                  }
                />
              </AbsoluteBox>
              <AbsoluteBox p={pos.g01}>
                <GroupBox
                  score="0:1"
                  count={4}
                  matches={getMatches("0:1")}
                  onMatchClick={setSelectedMatch}
                  simulateWinner={
                    simulationMode ? handleSimulateWinner : undefined
                  }
                />
              </AbsoluteBox>
              <AbsoluteBox p={pos.g20}>
                <GroupBox
                  score="2:0"
                  count={2}
                  matches={getMatches("2:0")}
                  onMatchClick={setSelectedMatch}
                  simulateWinner={
                    simulationMode ? handleSimulateWinner : undefined
                  }
                />
              </AbsoluteBox>
              <AbsoluteBox p={pos.g11}>
                <GroupBox
                  score="1:1"
                  count={4}
                  matches={getMatches("1:1")}
                  onMatchClick={setSelectedMatch}
                  simulateWinner={
                    simulationMode ? handleSimulateWinner : undefined
                  }
                />
              </AbsoluteBox>
              <AbsoluteBox p={pos.g02}>
                <GroupBox
                  score="0:2"
                  count={2}
                  matches={getMatches("0:2")}
                  onMatchClick={setSelectedMatch}
                  simulateWinner={
                    simulationMode ? handleSimulateWinner : undefined
                  }
                />
              </AbsoluteBox>
              <AbsoluteBox p={pos.g21}>
                <GroupBox
                  score="2:1"
                  count={3}
                  matches={getMatches("2:1")}
                  onMatchClick={setSelectedMatch}
                  simulateWinner={
                    simulationMode ? handleSimulateWinner : undefined
                  }
                />
              </AbsoluteBox>
              <AbsoluteBox p={pos.g12}>
                <GroupBox
                  score="1:2"
                  count={3}
                  matches={getMatches("1:2")}
                  onMatchClick={setSelectedMatch}
                  simulateWinner={
                    simulationMode ? handleSimulateWinner : undefined
                  }
                />
              </AbsoluteBox>
              <AbsoluteBox p={pos.g22}>
                <GroupBox
                  score="2:2"
                  count={3}
                  matches={getMatches("2:2")}
                  onMatchClick={setSelectedMatch}
                  simulateWinner={
                    simulationMode ? handleSimulateWinner : undefined
                  }
                />
              </AbsoluteBox>

              {/* Advance / Eliminate Result Groups */}
              <AbsoluteBox p={pos.g30}>
                <ResultGroup
                  score="3:0"
                  count={2}
                  win={true}
                  teams={getFinalTeams(3, 0)}
                />
              </AbsoluteBox>
              <AbsoluteBox p={pos.g31}>
                <ResultGroup
                  score="3:1"
                  count={3}
                  win={true}
                  teams={getFinalTeams(3, 1)}
                />
              </AbsoluteBox>
              <AbsoluteBox p={pos.g32}>
                <ResultGroup
                  score="3:2"
                  count={3}
                  win={true}
                  teams={getFinalTeams(3, 2)}
                />
              </AbsoluteBox>

              <AbsoluteBox p={pos.g03}>
                <ResultGroup
                  score="0:3"
                  count={2}
                  win={false}
                  teams={getFinalTeams(0, 3)}
                />
              </AbsoluteBox>
              <AbsoluteBox p={pos.g13}>
                <ResultGroup
                  score="1:3"
                  count={3}
                  win={false}
                  teams={getFinalTeams(1, 3)}
                />
              </AbsoluteBox>
              <AbsoluteBox p={pos.g23}>
                <ResultGroup
                  score="2:3"
                  count={3}
                  win={false}
                  teams={getFinalTeams(2, 3)}
                />
              </AbsoluteBox>
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
      <MatchDialog
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
};
