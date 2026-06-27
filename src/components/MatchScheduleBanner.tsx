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
    const t = TEAMS.find((x) => x.id === id);
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
        className="flex flex-col items-center justify-center p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm hover:shadow-md w-full shrink-0 relative transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group"
      >
        <div className="flex flex-col w-full mb-5 gap-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-[0.8125rem] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 font-display">
                <CalendarDays size={14} className="text-zinc-400" />
                {tLabel || "时间待定"}
              </span>
              {m.star > 0 && (
                <div className="text-[0.625rem] text-amber-400 flex items-center gap-[1px]">
                  {Array.from({ length: m.star }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              )}
            </div>

            {isLive ? (
              <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2.5 py-1 rounded-lg text-[0.625rem] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                LIVE
              </div>
            ) : targetTime > 0 && m.status !== "past" ? (
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-2.5 py-1 rounded-lg text-[0.625rem] font-bold tracking-widest">
                <Clock size={12} />
                <span>{formatCountdown(targetTime)}</span>
              </div>
            ) : m.status === "past" ? (
              <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-lg text-[0.625rem] font-bold tracking-widest">
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

                let styleClass =
                  "text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20";
                if (tagStr.includes("淘汰")) {
                  styleClass =
                    "text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20";
                } else if (tagStr.includes("晋级") || tagStr.includes("决胜")) {
                  styleClass =
                    "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20";
                } else if (tagStr.includes("决赛") || tagStr.includes("冠军")) {
                  styleClass =
                    "text-purple-600 bg-purple-50 border-purple-100 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20";
                } else if (tagStr.includes("BO5") || tagStr.includes("BO3")) {
                  styleClass =
                    "text-zinc-600 bg-zinc-100 border-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 font-mono";
                }

                return (
                  <span
                    key={idx}
                    className={`text-[0.625rem] font-bold px-2 py-1 rounded-md border ${styleClass}`}
                  >
                    {tagStr}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between w-full mt-auto px-2 py-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
          <div className="flex flex-col items-center gap-2.5 w-[4.375rem] shrink-0">
            <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center p-1.5 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <MatchParticipant teamId={m.team1Id} />
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate w-full text-center">
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
                  <div className="flex items-center justify-center w-full gap-4">
                    <span
                      className={`flex-1 text-right text-3xl font-black font-display tracking-tighter ${
                        isLive
                          ? "text-zinc-900 dark:text-white"
                          : leftWon
                            ? "text-emerald-500"
                            : "text-zinc-400 dark:text-zinc-600"
                      }`}
                    >
                      {displayLeft !== undefined ? displayLeft : "-"}
                    </span>
                    <span className="text-center shrink-0 text-xl text-zinc-300 dark:text-zinc-700 font-black -mt-1">
                      :
                    </span>
                    <span
                      className={`flex-1 text-left text-3xl font-black font-display tracking-tighter ${
                        isLive
                          ? "text-zinc-900 dark:text-white"
                          : rightWon
                            ? "text-emerald-500"
                            : "text-zinc-400 dark:text-zinc-600"
                      }`}
                    >
                      {displayRight !== undefined ? displayRight : "-"}
                    </span>
                  </div>
                );
              })()
            ) : (
              <span className="text-xl text-zinc-300 dark:text-zinc-700 font-black font-display w-full text-center tracking-widest shrink-0">
                VS
              </span>
            )}

            {m.status === "upcoming" &&
              (m.format === "bo3" || m.format === "bo5") && (
                <span className="absolute -bottom-6 text-[0.625rem] text-zinc-500 dark:text-zinc-400 font-bold uppercase font-mono tracking-widest bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  {m.format.toUpperCase()}
                </span>
              )}
          </div>

          <div className="flex flex-col items-center gap-2.5 w-[4.375rem] shrink-0">
            <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center p-1.5 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <MatchParticipant teamId={m.team2Id} />
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate w-full text-center">
              {getTeamShortName(m.team2Id)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 w-full h-full relative">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display flex items-center gap-2">
          推荐比赛
          <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md text-xs font-mono">
            {recommendedMatches.length}
          </span>
        </h3>
        <div className="flex flex-col gap-3">
          {recommendedMatches.length > 0 ? (
            recommendedMatches.map(renderMatchCard)
          ) : (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 py-8 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">
              暂无推荐比赛
            </div>
          )}
        </div>
      </div>

      {otherMatches.length > 0 && (
        <div className="flex flex-col gap-4 pb-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display flex items-center gap-2">
            全部比赛
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-md text-xs font-mono">
              {otherMatches.length}
            </span>
          </h3>
          <div className="flex flex-col gap-3">
            {otherMatches.map(renderMatchCard)}
          </div>
        </div>
      )}
    </div>
  );
};
