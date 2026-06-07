import React, { useEffect, useState } from "react";
import { MATCHES } from "../data/matches";
import { StageKey } from "../types";
import { MatchParticipant } from "./SwissBracket";

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
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
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
        className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent shadow-md w-full shrink-0 relative transition-transform hover:scale-[1.02] cursor-pointer"
      >
        {isLive && (
          <span className="absolute top-2 right-2 text-[10px] text-zinc-100 font-bold bg-rose-600/90 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(225,29,72,0.6)] tracking-tighter animate-pulse">
            LIVE
          </span>
        )}
        {(tLabel || m.star > 0) && (
          <div className="flex flex-col w-full mb-2.5">
            {tLabel && (
              <div className="text-[12px] font-sans flex flex-col gap-1 w-full min-h-[20px]">
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold tracking-wide text-zinc-300">
                    {tLabel}
                  </span>
                  {!isLive && targetTime > 0 && m.status !== "past" && (
                    <span className="text-[#f59e0b] font-bold font-sans tracking-tight bg-[#f59e0b]/15 px-2 py-0.5 rounded text-[12px] leading-tight shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
                      {formatCountdown(targetTime)}
                    </span>
                  )}
                </div>
                {m.tags && (
                  <div className="flex flex-wrap gap-1 mt-1 w-full min-h-[16px]">
                    {(Array.isArray(m.tags)
                      ? m.tags
                      : m.tags.split(",").map((t: string) => t.trim())
                    ).map((tag: any, idx: number) => {
                      const tagStr =
                        typeof tag === "string"
                          ? tag
                          : tag.name || JSON.stringify(tag);
                      let styleClass =
                        "text-[#f59e0b] border border-[#f59e0b]/30 bg-[#f59e0b]/10"; // amber default
                      return (
                        <span
                          key={idx}
                          className={`text-[9px] font-bold px-1.5 py-[2px] rounded leading-none w-max shadow-sm tracking-wide ${styleClass}`}
                        >
                          {tagStr}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {m.star > 0 && (
              <div className="text-[10px] text-yellow-400/80 flex items-center w-full mt-0.5 min-h-[14px]">
                {Array.from({ length: m.star }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between w-full mt-auto px-0">
          <div className="flex shrink-0 justify-start">
            <MatchParticipant teamId={m.team1Id} />
          </div>
          <div className="flex flex-1 items-center justify-center relative px-2">
            {m.status === "past" || m.status === "live" ? (
              (() => {
                let displayLeft = m.score1;
                let displayRight = m.score2;
                if (m.format === "bo1" && m.maps && m.maps[0]) {
                  displayLeft = m.maps[0].score1;
                  displayRight = m.maps[0].score2;
                }
                return (
                  <div className="flex items-center justify-center w-full gap-2">
                    <span
                      className={`flex-1 text-right text-[24px] md:text-[28px] font-black tracking-tight ${
                        isLive
                          ? "text-white"
                          : (displayLeft ?? 0) > (displayRight ?? 0)
                            ? "text-emerald-400 drop-shadow-sm"
                            : "text-zinc-500"
                      }`}
                    >
                      {displayLeft !== undefined ? displayLeft : "-"}
                    </span>
                    <span className="text-center shrink-0 text-[18px] text-zinc-700 font-black -mt-1">
                      :
                    </span>
                    <span
                      className={`flex-1 text-left text-[24px] md:text-[28px] font-black tracking-tight ${
                        isLive
                          ? "text-white"
                          : (displayRight ?? 0) > (displayLeft ?? 0)
                            ? "text-emerald-400 drop-shadow-sm"
                            : "text-zinc-500"
                      }`}
                    >
                      {displayRight !== undefined ? displayRight : "-"}
                    </span>
                  </div>
                );
              })()
            ) : (
              <span className="text-[16px] md:text-[18px] text-zinc-600/80 font-black w-full text-center uppercase tracking-widest shrink-0 transition-colors">
                vs
              </span>
            )}
            {(m.format === "bo3" || m.format === "bo5") && (
              <span className="absolute -bottom-[6px] text-[10px] text-zinc-600 font-black uppercase font-mono tracking-tighter">
                {m.format.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex shrink-0 justify-end">
            <MatchParticipant teamId={m.team2Id} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full relative">
      <div className="flex flex-col gap-3 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
        <h3 className="text-[12px] font-bold text-zinc-300 tracking-wider">
          推荐比赛
        </h3>
        <div className="flex flex-col gap-3">
          {recommendedMatches.length > 0 ? (
            recommendedMatches.map(renderMatchCard)
          ) : (
            <div className="text-sm text-zinc-500 py-4">
              无即将开始的推荐比赛
            </div>
          )}
        </div>
      </div>

      {otherMatches.length > 0 && (
        <div className="flex flex-col gap-3 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
          <h3 className="text-[12px] font-bold text-zinc-300 tracking-wider">
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
