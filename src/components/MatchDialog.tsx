import React, { useEffect, useState, useMemo } from "react";
import { BracketMatch } from "../types";
import { Modal } from "./Modal";
import { cn } from "../lib/utils";
import { TEAMS } from "../data/teams";
import { TeamLogo } from "./TeamLogo";
import { RefreshCw } from "lucide-react";
import { MatchAnalytics } from "./MatchAnalytics";
import { MatchStats } from "./MatchStats";
import { GLOBAL_SEEDING } from "../data/seedings";
import { getLocalStrength } from "../data/localPoints";

interface MapVetoDisplayProps {
  externalId?: string;
  isLive?: boolean;
  t1?: { name: string; shortName?: string; logo?: string };
  t2?: { name: string; shortName?: string; logo?: string };
  maps?: { score1?: number; score2?: number }[];
  isReversed?: boolean;
}

const mapTranslations: Record<string, string> = {
  Dust2: "炽热沙城Ⅱ",
  Ancient: "远古遗迹",
  Inferno: "炼狱小镇",
  Mirage: "荒漠迷城",
  Anubis: "阿努比斯",
  Overpass: "死亡游乐园",
  Nuke: "核子危机",
  Vertigo: "殒命大厦",
};

const MapVetoDisplay: React.FC<MapVetoDisplayProps & { matchData?: any }> = ({
  externalId,
  isLive,
  t1,
  t2,
  maps,
  matchData,
  isReversed,
}) => {
  const [vetoData, setVetoData] = useState<any[]>([]);

  useEffect(() => {
    if (matchData?.global_state?.bp_map_item) {
      setVetoData(matchData.global_state.bp_map_item);
    } else if (matchData?.result?.comparison?.team_map_stats) {
      setVetoData(matchData.result.comparison.team_map_stats);
    } else if (matchData?.result?.map_veto) {
      setVetoData(matchData.result.map_veto);
    } else if (matchData?.map_veto) {
      setVetoData(matchData.map_veto);
    }
  }, [matchData]);

  if (!externalId) {
    return (
      <div className="text-zinc-500 dark:text-zinc-500 text-[11px] p-4 text-center">暂无数据</div>
    );
  }

  if (vetoData.length === 0) {
    return null;
  }

  const getVetoLabel = (type: string) => {
    if (type === "left") return "DECIDER";
    const isPick = type.includes("pick");
    const isBan = type.includes("ban");
    if (isPick) return "PICK";
    if (isBan) return "BAN";
    return type.toUpperCase();
  };

  const mapsWithScores = vetoData.map((mapInfo, i) => {
    let type = mapInfo.bp_type;
    let side = mapInfo.team_side;
    if (!side) {
      if (type.startsWith("t1_")) {
        side = "t1";
        type = type.replace("t1_", "");
      }
      if (type.startsWith("t2_")) {
        side = "t2";
        type = type.replace("t2_", "");
      }
    }

    const isBan = type.includes("ban");
    const isPick = type.includes("pick");
    const isLeft = type === "left";
    const isCurrentlyPlaying = isPick || isLeft;
    const bgm = mapInfo.bgm || mapInfo.map_logo;
    const icon = mapInfo.icon || mapInfo.map_icon;
    const name = mapInfo.name || mapInfo.map_name;
    const nameZh = mapTranslations[name] || mapInfo.name_zh || name;

    let activeTeam = null;
    let actualSide = side;
    if (isReversed) {
      if (side === "t1") actualSide = "t2";
      else if (side === "t2") actualSide = "t1";
    }

    if (actualSide === "t1") activeTeam = t1;
    else if (actualSide === "t2") activeTeam = t2;

    let scoreItem = undefined;
    if (isCurrentlyPlaying) {
      const playedBefore = vetoData.slice(0, i).filter((m) => {
        const t = m.bp_type || "";
        return t.includes("pick") || t === "left";
      }).length;

      if (matchData?.bouts_state) {
        const bout = matchData?.bouts_state?.[playedBefore];
        if (bout?.t1_stats?.all_score !== undefined && bout?.t2_stats?.all_score !== undefined && bout?.t1_stats?.all_score !== "") {
          const h1 = bout.t1_stats.half_score?.split(",") || [];
          const h2 = bout.t2_stats.half_score?.split(",") || [];
          
          if (isReversed) {
            scoreItem = {
              score1: parseInt(bout.t2_stats.all_score, 10),
              score2: parseInt(bout.t1_stats.all_score, 10),
              half1: h2,
              half2: h1,
            };
          } else {
            scoreItem = {
              score1: parseInt(bout.t1_stats.all_score, 10),
              score2: parseInt(bout.t2_stats.all_score, 10),
              half1: h1,
              half2: h2,
            };
          }
        }
      }
      if (!scoreItem && maps) {
        scoreItem = maps[playedBefore];
        if (scoreItem && isReversed && scoreItem.score1 !== undefined && scoreItem.score2 !== undefined) {
           scoreItem = {
               ...scoreItem,
               score1: scoreItem.score2,
               score2: scoreItem.score1
           };
        }
      }
    }

    return {
      mapInfo, type, side, isBan, isPick, isLeft, isCurrentlyPlaying,
      bgm, icon, name, nameZh, activeTeam, scoreItem
    };
  });

  const playMaps = mapsWithScores.filter(m => m.isCurrentlyPlaying);
  const banMaps = mapsWithScores.filter(m => m.isBan);

  return (
    <div className="flex flex-col gap-5 mt-5 w-full px-1">
      {/* Played Maps Header */}
      <h4 className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
        <span className="h-[1px] flex-1 bg-black/5 dark:bg-white/5"></span>
        对阵地图
        <span className="h-[1px] flex-1 bg-black/5 dark:bg-white/5"></span>
      </h4>
      
      <div className="flex flex-col gap-3">
        {playMaps.map((m, i) => (
          <div
            key={i}
            className={cn(
              "relative h-20 sm:h-24 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-md flex flex-col group",
              isLive ? "ring-1 ring-emerald-500/30" : ""
            )}
          >
            {m.bgm && (
              <div className="absolute inset-0 z-0 select-none pointer-events-none">
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-white/90 via-white/70 to-white/90 dark:from-zinc-950/90 dark:via-zinc-950/60 dark:to-zinc-950/90"></div>
                <img
                  src={m.bgm}
                  className="w-full h-full object-cover opacity-60 dark:opacity-50 grayscale-[0.6] group-hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            
            <div className="relative z-10 flex items-center justify-between px-3 sm:px-5 h-full">
              {/* Team 1 area */}
              <div className="flex items-center gap-3 w-[25%] sm:w-[20%] justify-start">
                <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex items-center justify-center bg-white/50 dark:bg-black/30 rounded-full shadow-sm border border-black/5 dark:border-white/5 p-1 backdrop-blur-sm">
                  {t1 ? <TeamLogo team={t1 as any} fallbackClasses="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow" /> : null}
                </div>
              </div>
              
              {/* Center Map Info & Score */}
              <div className="flex flex-col items-center justify-center flex-1">
                <div className="flex items-center gap-1.5 mb-1 sm:mb-1.5">
                  {m.icon && <img src={m.icon} className="w-3.5 h-3.5 invert opacity-60 dark:opacity-70 dark:brightness-200" referrerPolicy="no-referrer" />}
                  <span className="text-[11px] sm:text-[12px] font-bold text-zinc-900 dark:text-zinc-100 tracking-widest drop-shadow-sm">{m.nameZh}</span>
                  {m.activeTeam && (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded leading-none ml-1 transform -translate-y-[0.5px]">
                      {m.isLeft ? "DECIDER" : `${m.activeTeam.shortName || m.activeTeam.name} PICK`}
                    </span>
                  )}
                  {!m.activeTeam && m.isLeft && (
                     <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded leading-none ml-1 transform -translate-y-[0.5px]">
                      DECIDER
                    </span>
                  )}
                </div>
                
                {m.scoreItem ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-end gap-3 text-2xl sm:text-3xl font-mono font-black tabular-nums drop-shadow-md">
                      <span className={cn((m.scoreItem.score1 ?? 0) > (m.scoreItem.score2 ?? 0) ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-800 dark:text-white/90")}>
                        {m.scoreItem.score1}
                      </span>
                      <span className="text-zinc-400 dark:text-white/30 text-xl font-light pb-0.5">-</span>
                      <span className={cn((m.scoreItem.score2 ?? 0) > (m.scoreItem.score1 ?? 0) ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-800 dark:text-white/90")}>
                        {m.scoreItem.score2}
                      </span>
                    </div>
                    {/* Half-time scores */}
                    {m.scoreItem.half1 && m.scoreItem.half1.length > 0 && (
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-medium tracking-tighter">
                        {m.scoreItem.half1.map((h: string, idx: number) => (
                           <span key={idx} className="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-sm border border-black/5 dark:border-white/5">
                              {h}:{m.scoreItem.half2?.[idx] || 0}
                           </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-zinc-400 dark:text-zinc-500 text-xs font-medium tracking-widest mt-1">未开始</div>
                )}
              </div>

              {/* Team 2 area */}
              <div className="flex items-center gap-3 w-[25%] sm:w-[20%] justify-end">
                 <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex items-center justify-center bg-white/50 dark:bg-black/30 rounded-full shadow-sm border border-black/5 dark:border-white/5 p-1 backdrop-blur-sm">
                  {t2 ? <TeamLogo team={t2 as any} fallbackClasses="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow" /> : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ban Maps Footer */}
      {banMaps.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5 justify-center">
            {banMaps.map((m, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-md text-[10px] text-zinc-600 dark:text-zinc-400">
                {m.activeTeam && (
                   <div className="w-3.5 h-3.5 flex items-center justify-center opacity-80">
                      <TeamLogo team={m.activeTeam as any} fallbackClasses="w-3 h-3" />
                   </div>
                )}
                <span className="font-bold text-rose-500/80 mr-0.5">BAN</span>
                <span className="tracking-wide">{m.nameZh}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MatchPrediction: React.FC<{
  match: BracketMatch | null;
}> = ({ match }) => {
  if (!match || !match.team1Id || !match.team2Id || match.team1Id === "tbd" || match.team2Id === "tbd") {
    return null;
  }

  const t1Data = TEAMS.find(t => t.id === match.team1Id);
  const t2Data = TEAMS.find(t => t.id === match.team2Id);
  if (!t1Data || !t2Data) return null;

  const fallbackS1 = getLocalStrength(match.team1Id) || (2000 - (GLOBAL_SEEDING[match.team1Id] || 32) * 30);
  const fallbackS2 = getLocalStrength(match.team2Id) || (2000 - (GLOBAL_SEEDING[match.team2Id] || 32) * 30);
  const s1 = t1Data.strength || fallbackS1;
  const s2 = t2Data.strength || fallbackS2;

  const getSingleMapProb = (strength1: number, strength2: number) => {
    const M = 1300;
    return 1 / (1 + Math.pow(10, (strength2 - strength1) / M));
  };

  let probT1 = 0;
  if (match.format === "bo3") {
    const mapAdv = 150;
    const pMap1 = getSingleMapProb(s1 + mapAdv, s2);
    const pMap2 = getSingleMapProb(s1, s2 + mapAdv);
    const pMap3 = getSingleMapProb(s1, s2);
    probT1 = pMap1 * pMap2 + pMap1 * (1 - pMap2) * pMap3 + (1 - pMap1) * pMap2 * pMap3;
  } else if (match.format === "bo5") {
    const p = getSingleMapProb(s1, s2);
    const q = 1 - p;
    probT1 = p * p * p * (1 + 3 * q + 6 * q * q);
  } else {
    probT1 = getSingleMapProb(s1, s2);
  }

  let isFinished = match.status === "past";
  if (!isFinished && match.score1 !== undefined && match.score2 !== undefined) {
    if (match.format === "bo3") {
      isFinished = match.score1 === 2 || match.score2 === 2;
    } else if (match.format === "bo5") {
      isFinished = match.score1 === 3 || match.score2 === 3;
    } else {
      isFinished = (match.score1 > 0 || match.score2 > 0) && match.score1 !== match.score2;
    }
  }
  let winner = 0;
  if (isFinished) {
    winner = (match.score1 ?? 0) > (match.score2 ?? 0) ? 1 : 2;
  }

  let t1BarColor = "bg-blue-500/60";
  let t2BarColor = "bg-amber-500/60";
  let t1TextColor = "text-blue-600 dark:text-blue-400";
  let t2TextColor = "text-amber-600 dark:text-amber-400";

  if (winner === 1) {
    t1BarColor = "bg-emerald-500";
    t2BarColor = "bg-zinc-200 dark:bg-zinc-700";
    t1TextColor = "text-emerald-600 dark:text-emerald-400 font-bold";
    t2TextColor = "text-zinc-500 dark:text-zinc-500";
  } else if (winner === 2) {
    t1BarColor = "bg-zinc-200 dark:bg-zinc-700";
    t2BarColor = "bg-emerald-500";
    t1TextColor = "text-zinc-500 dark:text-zinc-500";
    t2TextColor = "text-emerald-600 dark:text-emerald-400 font-bold";
  }

  return (
    <div className="flex flex-col gap-1 w-full px-2">
      <div className="flex items-center justify-between px-1 mb-1">
         <span className={cn("text-[11px] font-mono font-medium tracking-wide", t1TextColor)}>
          {winner === 1 && "✓ "}
          {(probT1 * 100).toFixed(1)}%
        </span>
        <h4 className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-[0.2em]">
          预测体量
        </h4>
        <span className={cn("text-[11px] font-mono font-medium tracking-wide", t2TextColor)}>
          {((1 - probT1) * 100).toFixed(1)}%
          {winner === 2 && " ✓"}
        </span>
      </div>
      <div className="flex items-center w-full h-1.5 sm:h-2 rounded-full overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 mx-1">
        <div style={{ width: `${(probT1 * 100).toFixed(1)}%` }} className={`h-full ${t1BarColor} transition-all`}></div>
        <div style={{ width: `${((1 - probT1) * 100).toFixed(1)}%` }} className={`h-full ${t2BarColor} transition-all`}></div>
      </div>
    </div>
  );
};

export const MatchDialog: React.FC<{
  match: BracketMatch | null;
  onClose: () => void;
}> = ({ match, onClose }) => {
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [activeStreamIndex, setActiveStreamIndex] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const prevMatchId = React.useRef<string>("");

  const t1 = match?.team1Id ? TEAMS.find((t) => t.id === match.team1Id) : null;
  const t2 = match?.team2Id ? TEAMS.find((t) => t.id === match.team2Id) : null;
  const t1NameStr = t1 ? t1.shortName || t1.name : match?.team1Id || "待定";
  const t2NameStr = t2 ? t2.shortName || t2.name : match?.team2Id || "待定";

  const isReversedApi = useMemo(() => {
    if (!matchData?.result?.t1_name) return false;
    const apiT1 = matchData.result.t1_name.toLowerCase();
    const apiT2 = matchData.result.t2_name?.toLowerCase() || '';
    const uiT1 = t1NameStr.toLowerCase();
    const uiT2 = t2NameStr.toLowerCase();
    
    const uiT1_full = t1?.name?.toLowerCase() || uiT1;
    const uiT2_full = t2?.name?.toLowerCase() || uiT2;
    
    const getScore = (a: string, b: string, fullB: string) => {
      if (!a || !b) return 0;
      if (a === b || a === fullB) return 100;
      if (a.includes(b) || b.includes(a) || a.includes(fullB) || fullB.includes(a)) return 50;
      return 0;
    };

    const directScore = getScore(apiT1, uiT1, uiT1_full) + getScore(apiT2, uiT2, uiT2_full);
    const crossScore = getScore(apiT1, uiT2, uiT2_full) + getScore(apiT2, uiT1, uiT1_full);
    
    return crossScore > directScore;
  }, [matchData, t1NameStr, t2NameStr, t1, t2]);

  const isActuallyReversed = useMemo(() => {
    if (!match) return false;
    
    let t1MapWins = 0;
    let t2MapWins = 0;
    
    if (matchData?.bouts_state) {
      Object.keys(matchData.bouts_state).forEach(key => {
        const bout = matchData.bouts_state[key];
        if (bout?.t1_stats?.all_score !== undefined && bout?.t2_stats?.all_score !== undefined) {
          const s1 = parseInt(bout.t1_stats.all_score, 10);
          const s2 = parseInt(bout.t2_stats.all_score, 10);
          if (s1 > s2) t1MapWins++;
          else if (s2 > s1) t2MapWins++;
        }
      });
    } else if (match.maps) {
      match.maps.forEach(map => {
        if (map.score1 !== undefined && map.score2 !== undefined) {
           if (map.score1 > map.score2) t1MapWins++;
           else if (map.score2 > map.score1) t2MapWins++;
        }
      });
    }

    const s1 = match.score1 ?? 0;
    const s2 = match.score2 ?? 0;
    
    if ((t1MapWins > 0 || t2MapWins > 0) && (s1 > 0 || s2 > 0)) {
       if (t1MapWins === s2 && t2MapWins === s1 && t1MapWins !== t2MapWins) {
          return true; 
       }
       if (t1MapWins === s1 && t2MapWins === s2 && t1MapWins !== t2MapWins) {
          return false;
       }
    }
    
    return isReversedApi;
  }, [matchData, match?.maps, match?.score1, match?.score2, isReversedApi]);

  const fetchLiveStreams = async () => {
    if (!match?.externalId) return;
    const formattedId = match.externalId.startsWith("csgo_mc_")
      ? match.externalId
      : `csgo_mc_${match.externalId}`;
    try {
      const [resData, resAnalysis] = await Promise.all([
        fetch(
          `https://esports-data.5eplaycdn.com/v1/api/csgo/matches/${formattedId}/data?_t=${Date.now()}`,
        ).then((r) => r.json()),
        fetch(
          `https://esports-data.5eplaycdn.com/v1/api/csgo/matches/${formattedId}/analysis_v1?_t=${Date.now()}`,
        ).then((r) => r.json()),
      ]);

      if (resData?.data?.match) {
        setMatchData(resData.data.match);
      }
      if (resAnalysis?.data?.result) {
        setAnalysisData(resAnalysis.data.result);
      }
      if (resData?.data?.match?.mc_info?.live_cfg_list) {
        setLiveStreams(resData.data.match.mc_info.live_cfg_list);
      } else if (resAnalysis?.data?.result?.mc_info?.live_cfg_list) {
        setLiveStreams(resAnalysis.data.result.mc_info.live_cfg_list);
      } else {
        setLiveStreams([]);
      }
    } catch (err) {
      console.warn("Failed to fetch match data:", err);
    }
  };

  useEffect(() => {
    if (match) {
      if (prevMatchId.current !== match.externalId) {
        setMatchData(null);
        setAnalysisData(null);
        prevMatchId.current = match.externalId || "";
      }
      fetchLiveStreams();
    }
  }, [match]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLiveStreams();
    // Also the global refresh runs every 10s when here, so match data itself updates via App.tsx logic.
    setTimeout(() => setIsRefreshing(false), 500); // UI feedback
  };

  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (match) {
      const t = setInterval(() => {
        window.dispatchEvent(new CustomEvent("force-refresh-matches"));
      }, 10000);
      return () => clearInterval(t);
    }
  }, [match]);

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

  if (!match) return null;

  const getStatusText = (status?: string) => {
    if (status === "past") return "已结束";
    if (status === "live") return "进行中";
    return "未开始";
  };

  const hasLiveStream = liveStreams.length > 0 && match.status === "live";
  const modalWidth = hasLiveStream
    ? "max-w-md md:max-w-3xl lg:max-w-[1000px] xl:max-w-[1200px]"
    : "max-w-md md:max-w-2xl lg:max-w-[700px]";

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

  const targetTime = parseTime(match.time);
  const tLabel =
    targetTime > 0
      ? new Date(targetTime).toLocaleString("zh-CN", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <Modal
      isOpen={!!match}
      onClose={onClose}
      title="赛况概览"
      maxWidthClass={modalWidth}
      fullScreenOnMobile
      headerExtras={
        <button
          onClick={handleRefresh}
          className="p-1 text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white transition-colors"
          title="刷新数据"
        >
          <RefreshCw
            className={cn("w-4 h-4", isRefreshing && "animate-spin")}
          />
        </button>
      }
    >
      <div
        className={cn(
          "flex flex-col gap-6",
          hasLiveStream ? "lg:flex-row" : "",
        )}
      >
        {hasLiveStream && (
          <div className="flex flex-col gap-3 flex-1 lg:w-[60%] xl:w-[65%] shrink-0">
            <div className="w-full aspect-video bg-white dark:bg-black rounded-lg overflow-hidden border border-black/10 dark:border-white/10 shadow-2xl relative group">
              <iframe
                className="w-full h-full absolute inset-0 border-none bg-zinc-50 dark:bg-zinc-950"
                src={liveStreams[activeStreamIndex]?.url}
                allowFullScreen
                scrolling="no"
              />
            </div>
            <div className="flex flex-wrap gap-2 pb-1 hide-scrollbar">
              {liveStreams.map((stream, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStreamIndex(i)}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-bold rounded flex-shrink-0 whitespace-nowrap transition-colors border",
                    activeStreamIndex === i
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-zinc-100 dark:bg-zinc-900 border-black/5 dark:border-white/5 text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-200 hover:bg-white dark:bg-zinc-800",
                  )}
                >
                  {stream.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex flex-col gap-4",
            hasLiveStream
              ? "flex-1 lg:w-[40%] xl:w-[35%] shrink-0 lg:overflow-y-auto lg:pr-2 hide-scrollbar lg:max-h-[75vh]"
              : "w-full",
          )}
        >
          {match.format && (
            <div className="flex flex-col items-center justify-center text-[11px] font-sans text-zinc-500 dark:text-zinc-500 uppercase pb-3 border-b border-black/5 dark:border-white/5 shrink-0 gap-1.5">
              <div>
                赛制: {match.format.toUpperCase()} • 状态:{" "}
                <span
                  className={cn(
                    "ml-1 font-bold",
                    match.status === "live"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-800 dark:text-zinc-300",
                  )}
                >
                  {getStatusText(match.status)}
                </span>
              </div>
              {tLabel && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">{tLabel}</span>
                  {targetTime > 0 &&
                    match.status !== "past" &&
                    match.status !== "live" && (
                      <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded font-sans font-bold tracking-tight text-[12px]">
                        {formatCountdown(targetTime)}
                      </span>
                    )}
                </div>
              )}
            </div>
          )}

          <div className="relative overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-lg shrink-0 mt-2">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/5 dark:from-white/5 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10 flex items-center justify-between p-5 sm:p-6 pb-6">
              {/* Team 1 Panel */}
              <div className="flex flex-col items-center gap-3 w-[35%] shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center bg-white dark:bg-black/50 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 p-2 transition-transform hover:scale-[1.02]">
                  {t1 ? (
                    <TeamLogo team={t1} fallbackClasses="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
                  ) : (
                    <div className="opacity-20 flex items-center justify-center font-bold text-lg">TBD</div>
                  )}
                </div>
                <div className="text-sm sm:text-base leading-tight font-black text-zinc-900 dark:text-zinc-100 tracking-wider text-center break-words uppercase">
                  {t1NameStr}
                </div>
              </div>

              {/* Center Match Score Area */}
              <div className="flex flex-col items-center justify-center w-[30%] shrink-0 gap-1.5">
                <div className="text-4xl sm:text-6xl font-mono font-black tabular-nums tracking-tighter text-zinc-900 dark:text-white drop-shadow-md flex items-center gap-2">
                  <span className={cn((match.score1 ?? 0) > (match.score2 ?? 0) ? "text-emerald-500" : "opacity-90")}>
                    {match.score1 ?? "-"}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700 text-3xl sm:text-4xl pb-1 font-light -mt-1">:</span>
                  <span className={cn((match.score2 ?? 0) > (match.score1 ?? 0) ? "text-emerald-500" : "opacity-90")}>
                    {match.score2 ?? "-"}
                  </span>
                </div>
              </div>

              {/* Team 2 Panel */}
              <div className="flex flex-col items-center gap-3 w-[35%] shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center bg-white dark:bg-black/50 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 p-2 transition-transform hover:scale-[1.02]">
                  {t2 ? (
                    <TeamLogo team={t2} fallbackClasses="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
                  ) : (
                    <div className="opacity-20 flex items-center justify-center font-bold text-lg">TBD</div>
                  )}
                </div>
                <div className="text-sm sm:text-base leading-tight font-black text-zinc-900 dark:text-zinc-100 tracking-wider text-center break-words uppercase">
                  {t2NameStr}
                </div>
              </div>
            </div>
            
            <div className="border-t border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 pb-3 pt-1">
               <MatchPrediction match={match} />
            </div>
          </div>

          {/* BP SEQUENCE / ANALYTICS */}
          <div className="flex-1 pb-4">
            {match.status === "live" ||
            match.status === "past" ||
            matchData ||
            analysisData ? (
              <>
                <MapVetoDisplay
                  externalId={match.externalId}
                  isLive={match.status === "live"}
                  t1={t1 || { name: t1NameStr }}
                  t2={t2 || { name: t2NameStr }}
                  maps={match.maps}
                  matchData={matchData}
                  isReversed={isActuallyReversed}
                />
                <MatchStats matchData={matchData} t1={t1 || { name: t1NameStr }} t2={t2 || { name: t2NameStr }} isReversed={isActuallyReversed} />
                <MatchAnalytics
                  matchData={matchData}
                  analysisData={analysisData}
                  t1={t1 || { name: t1NameStr }}
                  t2={t2 || { name: t2NameStr }}
                  isReversed={isActuallyReversed}
                />
              </>
            ) : null}
            {match.status === "upcoming" && !matchData && !analysisData && (
              <div className="text-[11px] text-zinc-500 dark:text-zinc-500 text-center py-6">
                比赛尚未开始
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
