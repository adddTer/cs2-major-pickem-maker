import React, { useEffect, useState } from "react";
import { MATCHES } from "../data/matches";
import { TEAMS } from "../data/teams";
import { StageKey } from "../types";
import { MatchParticipant } from "./SwissBracket";
import { Clock, CalendarDays } from "lucide-react";

export const MatchScheduleBanner: React.FC<{
  activeStage: StageKey;
  onMatchClick?: (m: any) => void;
}> = ({ activeStage, onMatchClick }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const stageMatches = MATCHES[activeStage];
  if (!stageMatches) return null;

  let allMatches: any[] = [];
  if (activeStage === "playoffs") {
    const rounds = ["qf", "sf", "final"];
    for (const round of rounds) {
      if (stageMatches[round]) {
        allMatches.push(...stageMatches[round]);
      }
    }
  } else {
    // swiss brackets
    Object.values(stageMatches).forEach((bracket: any) => {
      allMatches.push(...bracket);
    });
  }

  // Filter valid ones
  allMatches = allMatches.filter(
    (m) => m.team1Id && m.team2Id && m.team1Id !== "tbd" && m.team2Id !== "tbd",
  );

  const upcomingOrLive = allMatches.filter(
    (m) => m.status === "upcoming" || m.status === "live",
  );

  const parseTime = (val: any) => {
    if (!val) return Infinity;
    if (typeof val === "number") return val > 9999999999 ? val : val * 1000;
    if (typeof val === "string") {
      if (/^\d+$/.test(val)) return parseInt(val, 10) * 1000;
      const tString = val.replace(" ", "T");
      return new Date(tString).getTime() || Infinity;
    }
    return Infinity;
  };

  const getStatusPriority = (status: string) => {
    if (status === "live") return 3;
    if (status === "upcoming") return 2;
    if (status === "past") return 1;
    return 0;
  };

  const sortMatches = (a: any, b: any) => {
    const pA = getStatusPriority(a.status);
    const pB = getStatusPriority(b.status);
    if (pA !== pB) return pB - pA; // live(3) > upcoming(2) > past(1)

    const starA = a.star || 0;
    const starB = b.star || 0;
    const timeA = parseTime(a.time);
    const timeB = parseTime(b.time);
    const timeDiff = timeA - timeB;

    if (a.status === "live") {
      if (starA !== starB) return starB - starA;
      return isNaN(timeDiff) ? 0 : timeDiff;
    } else {
      if (timeA !== timeB) return isNaN(timeDiff) ? 0 : timeDiff;
      return starB - starA;
    }
  };

  upcomingOrLive.sort(sortMatches);

  const recommendedMatches = upcomingOrLive.slice(0, 4);
  const recommendedIds = new Set(recommendedMatches.map((m) => m.externalId));

  const otherMatches = allMatches
    .filter((m) => !recommendedIds.has(m.externalId))
    .sort(sortMatches);

  const formatCountdown = (targetTime: number) => {
    const diff = targetTime - currentTime;
    if (diff <= 0) return "即将开始";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}天后`;
    }
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTeamShortName = (id: string) => {
    if (id === "tbd") return "TBD";
    const t = TEAMS.find(x => x.id === id);
    return t ? t.shortName : id;
  };

  const renderMatchCard = (m: any) => {
    const parseTime = (val: any) => {
      if (!val) return 0;
      if (typeof val === "number") return val > 9999999999 ? val : val * 1000;
      if (typeof val === "string") {
        if (/^\d+$/.test(val)) return parseInt(val, 10) * 1000;
        const tString = val.replace(" ", "T");
        return new Date(tString).getTime() || 0;
      }
      return 0;
    };

    const formatTimeLabel = (ts: number) => {
      const d = new Date(ts);
      return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    };

    const targetTime = parseTime(m.time);
    const tLabel = targetTime > 0 ? formatTimeLabel(targetTime) : "";
    const isLive = m.status === "live";

    return (
      <div
        key={m.externalId || Math.random()}
        onClick={() => {
          if (onMatchClick) onMatchClick(m);
        }}
        className="flex flex-col items-center justify-center p-4 rounded-xl border border-black/5 dark:border-white/5 bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 hover:from-zinc-800/60 hover:to-zinc-900/60 shadow-lg w-full shrink-0 relative transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group"
      >
        <div className="flex flex-col w-full mb-4 gap-2.5">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 tracking-wide flex items-center gap-1.5">
                <CalendarDays size={14} className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400" />
                {tLabel || "时间待定"}
              </span>
              {m.star > 0 && (
                <div className="text-[11px] text-yellow-400/90 flex items-center drop-shadow-[0_0_2px_rgba(250,204,21,0.5)]">
                  {Array.from({ length: m.star }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              )}
            </div>
            
            {isLive ? (
              <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-[0_0_10px_rgba(225,29,72,0.15)] tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                LIVE
              </div>
            ) : targetTime > 0 && m.status !== "past" ? (
              <div className="flex items-center gap-1.5 text-amber-500/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                <Clock size={12} className="opacity-80" />
                <span>{formatCountdown(targetTime)}</span>
              </div>
            ) : m.status === "past" ? (
              <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 bg-black/80 dark:bg-white/80 dark:bg-zinc-800/80 border border-zinc-700/50 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wider">
                已结束
              </div>
            ) : null}
          </div>

          {m.tags && (
            <div className="flex flex-wrap gap-1.5 w-full">
              {(Array.isArray(m.tags)
                ? m.tags
                : m.tags.split(",").map((t: string) => t.trim())
              ).map((tag: any, idx: number) => {
                const tagStr =
                  typeof tag === "string"
                    ? tag
                    : tag.name || JSON.stringify(tag);
                
                let styleClass = "text-indigo-300 border-indigo-400/20 bg-indigo-500/10";
                if (tagStr.includes("淘汰")) {
                  styleClass = "text-rose-300 border-rose-400/20 bg-rose-500/10";
                } else if (tagStr.includes("晋级") || tagStr.includes("决胜")) {
                  styleClass = "text-emerald-300 border-emerald-400/20 bg-emerald-500/10";
                } else if (tagStr.includes("决赛") || tagStr.includes("冠军")) {
                  styleClass = "text-purple-300 border-purple-400/20 bg-purple-500/10";
                } else if (tagStr.includes("BO5") || tagStr.includes("BO3")) {
                   styleClass = "text-zinc-800 dark:text-zinc-300 border-zinc-400/20 bg-zinc-500/10 font-mono";
                }

                return (
                  <span
                    key={idx}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-[4px] border ${styleClass}`}
                  >
                    {tagStr}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between w-full mt-auto px-1 bg-zinc-200/20 dark:bg-black/20 rounded-lg p-3">
          <div className="flex flex-col items-center gap-2 w-[70px] shrink-0">
            <MatchParticipant teamId={m.team1Id} />
            <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 truncate w-full text-center">
              {getTeamShortName(m.team1Id)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 relative px-2">
            {m.status === "past" || m.status === "live" ? (
              (() => {
                let displayLeft = m.score1;
                let displayRight = m.score2;
                if (m.format === "bo1" && m.maps && m.maps[0]) {
                  displayLeft = m.maps[0].score1;
                  displayRight = m.maps[0].score2;
                }
                const leftWon = (displayLeft ?? 0) > (displayRight ?? 0);
                const rightWon = (displayRight ?? 0) > (displayLeft ?? 0);
                
                return (
                  <div className="flex items-center justify-center w-full gap-3">
                    <span
                      className={`flex-1 text-right text-[26px] md:text-[32px] font-black tracking-tighter ${
                        isLive
                          ? "text-black dark:text-white"
                          : leftWon
                            ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                            : "text-zinc-500 dark:text-zinc-500"
                      }`}
                    >
                      {displayLeft !== undefined ? displayLeft : "-"}
                    </span>
                    <span className="text-center shrink-0 text-[18px] text-zinc-500 dark:text-zinc-600 font-black -mt-1">
                      :
                    </span>
                    <span
                      className={`flex-1 text-left text-[26px] md:text-[32px] font-black tracking-tighter ${
                        isLive
                          ? "text-black dark:text-white"
                          : rightWon
                            ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                            : "text-zinc-500 dark:text-zinc-500"
                      }`}
                    >
                      {displayRight !== undefined ? displayRight : "-"}
                    </span>
                  </div>
                );
              })()
            ) : (
              <span className="text-[16px] md:text-[20px] text-zinc-500 dark:text-zinc-600 font-black w-full text-center uppercase tracking-widest shrink-0">
                VS
              </span>
            )}
            
            {(m.status === "upcoming") && (m.format === "bo3" || m.format === "bo5") && (
              <span className="absolute -bottom-5 text-[10px] text-zinc-500 dark:text-zinc-500 font-bold uppercase font-mono tracking-widest bg-black/80 dark:bg-white/80 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5">
                {m.format.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 w-[70px] shrink-0">
            <MatchParticipant teamId={m.team2Id} />
            <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 truncate w-full text-center">
              {getTeamShortName(m.team2Id)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full relative">
      <div className="flex flex-col gap-3 p-4 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-xl border border-black/5 dark:border-white/5">
        <h3 className="text-[12px] font-bold text-zinc-800 dark:text-zinc-300 tracking-wider">
          推荐比赛
        </h3>
        <div className="flex flex-col gap-3">
          {recommendedMatches.length > 0 ? (
            recommendedMatches.map(renderMatchCard)
          ) : (
            <div className="text-sm text-zinc-500 dark:text-zinc-500 py-4">
              无即将开始的推荐比赛
            </div>
          )}
        </div>
      </div>

      {otherMatches.length > 0 && (
        <div className="flex flex-col gap-3 p-4 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-xl border border-black/5 dark:border-white/5">
          <h3 className="text-[12px] font-bold text-zinc-800 dark:text-zinc-300 tracking-wider">
            全部比赛
          </h3>
          <div className="flex flex-col gap-3">
            {otherMatches.map(renderMatchCard)}
          </div>
        </div>
      )}
    </div>
  );
};

