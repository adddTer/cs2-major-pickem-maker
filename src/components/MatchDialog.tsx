import React, { useEffect, useState } from "react";
import { BracketMatch } from "../types";
import { Modal } from "./Modal";
import { cn } from "../lib/utils";
import { TEAMS } from "../data/teams";
import { TeamLogo } from "./TeamLogo";
import { RefreshCw } from "lucide-react";
import { MatchAnalytics } from "./MatchAnalytics";

interface MapVetoDisplayProps {
  externalId?: string;
  isLive?: boolean;
  t1?: { name: string; shortName?: string; logo?: string };
  t2?: { name: string; shortName?: string; logo?: string };
  maps?: { score1?: number; score2?: number }[];
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
      <div className="text-zinc-500 text-[11px] p-4 text-center">暂无数据</div>
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

  return (
    <div className="flex flex-col gap-3 mt-4 w-full px-1">
      <h4 className="text-[11px] font-medium text-white/50 tracking-widest px-1">
        地图 BP
      </h4>
      <div className="flex flex-col gap-2 relative">
        {vetoData.map((mapInfo, i) => {
          // handle both old format (bp_type: t1_ban) and new format (bp_type: ban, team_side: t1)
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
          if (side === "t1") activeTeam = t1;
          else if (side === "t2") activeTeam = t2;

          // Count played maps before this one to find score index
          let scoreItem = undefined;
          if (isCurrentlyPlaying && maps) {
            const playedBefore = vetoData.slice(0, i).filter((m) => {
              const t = m.bp_type || "";
              return t.includes("pick") || t === "left";
            }).length;
            scoreItem = maps[playedBefore];
          }

          return (
            <div
              key={i}
              className={cn(
                "relative group overflow-hidden rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-between",
                isLive && isCurrentlyPlaying
                  ? "ring-1 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  : "h-[42px]",
              )}
            >
              {bgm && (
                <div className="absolute inset-0 z-0 select-none pointer-events-none">
                  <div
                    className={cn(
                      "absolute inset-0 z-10",
                      isBan
                        ? "bg-zinc-950/90"
                        : "bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent",
                    )}
                  ></div>
                  <img
                    src={bgm}
                    className={cn(
                      "w-full h-full object-cover",
                      isBan
                        ? "opacity-10 grayscale"
                        : "opacity-30 grayscale-[0.8] group-hover:grayscale-0",
                    )}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="relative z-10 px-3 py-2 flex items-center gap-3">
                {icon && (
                  <img
                    src={icon}
                    className={cn(
                      "w-6 h-6 invert drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
                      isCurrentlyPlaying
                        ? "opacity-100"
                        : isBan
                          ? "opacity-20"
                          : "opacity-60",
                    )}
                    referrerPolicy="no-referrer"
                  />
                )}
                <span
                  className={cn(
                    "text-sm font-medium tracking-wide",
                    isBan
                      ? "text-zinc-400"
                      : isCurrentlyPlaying
                        ? "text-emerald-400 font-bold"
                        : "text-zinc-200",
                  )}
                >
                  {nameZh}
                </span>
              </div>

              <div className="relative z-10 flex items-center gap-3 pr-3">
                {scoreItem && (
                  <div className="flex items-center gap-1.5 font-mono text-[13px] bg-black/40 px-2.5 py-0.5 rounded border border-white/5">
                    <span
                      className={cn(
                        (scoreItem.score1 ?? 0) > (scoreItem.score2 ?? 0)
                          ? "text-emerald-400 font-bold"
                          : "text-zinc-300",
                      )}
                    >
                      {scoreItem.score1}
                    </span>
                    <span className="text-zinc-600">-</span>
                    <span
                      className={cn(
                        (scoreItem.score2 ?? 0) > (scoreItem.score1 ?? 0)
                          ? "text-emerald-400 font-bold"
                          : "text-zinc-300",
                      )}
                    >
                      {scoreItem.score2}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    "flex items-center gap-2 pl-2 pr-2 py-1 rounded backdrop-blur-sm border",
                    isBan
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : isLeft
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  )}
                >
                  {activeTeam && activeTeam.logo && (
                    <img
                      src={activeTeam.logo}
                      className="w-4 h-4 object-contain"
                      alt={activeTeam.shortName || activeTeam.name}
                    />
                  )}
                  <span className="text-[10px] font-bold tracking-widest leading-none pt-[1px]">
                    {getVetoLabel(type)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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

  const fetchLiveStreams = async () => {
    if (!match?.externalId) return;
    const formattedId = match.externalId.startsWith("csgo_mc_")
      ? match.externalId
      : `csgo_mc_${match.externalId}`;
    try {
      const [resData, resAnalysis] = await Promise.all([
        fetch(
          `https://esports-data.5eplaycdn.com/v1/api/csgo/matches/${formattedId}/data`,
        ).then((r) => r.json()),
        fetch(
          `https://esports-data.5eplaycdn.com/v1/api/csgo/matches/${formattedId}/analysis_v1`,
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
    fetchLiveStreams();
  }, [match?.externalId]);

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

  const t1 = match.team1Id ? TEAMS.find((t) => t.id === match.team1Id) : null;
  const t2 = match.team2Id ? TEAMS.find((t) => t.id === match.team2Id) : null;
  const t1NameStr = t1 ? t1.shortName || t1.name : match.team1Id || "待定";
  const t2NameStr = t2 ? t2.shortName || t2.name : match.team2Id || "待定";

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
          className="p-1 text-zinc-400 hover:text-white transition-colors"
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
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl relative group">
              <iframe
                className="w-full h-full absolute inset-0 border-none bg-zinc-950"
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
                      : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
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
            <div className="flex flex-col items-center justify-center text-[11px] font-sans text-zinc-500 uppercase pb-3 border-b border-white/5 shrink-0 gap-1.5">
              <div>
                赛制: {match.format.toUpperCase()} • 状态:{" "}
                <span
                  className={cn(
                    "ml-1 font-bold",
                    match.status === "live"
                      ? "text-emerald-400"
                      : "text-zinc-300",
                  )}
                >
                  {getStatusText(match.status)}
                </span>
              </div>
              {tLabel && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">{tLabel}</span>
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

          <div className="flex items-stretch justify-between px-4 py-5 bg-zinc-900/50 rounded-xl border border-white/5 shadow-inner shrink-0 mt-2">
            <div className="flex flex-col justify-between items-center gap-2 w-[35%] shrink-0">
              {t1 ? (
                <div className="w-14 h-14 relative flex items-center justify-center bg-black/30 rounded-full shadow-lg border border-white/5 p-1.5">
                  <TeamLogo
                    team={t1}
                    fallbackClasses="w-10 h-10 object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 bg-zinc-900 rounded-full border border-dashed border-white/10" />
              )}
              <div className="flex-1 flex items-center">
                <div className="text-[13px] leading-tight font-bold text-zinc-100 tracking-wide text-center whitespace-normal break-words max-w-[100px]">
                  {t1NameStr}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 w-[30%] shrink-0 px-1">
              <div className="text-3xl font-mono font-black tabular-nums tracking-tighter text-white drop-shadow-md flex items-center gap-1.5">
                <span
                  className={cn(
                    (match.score1 ?? 0) > (match.score2 ?? 0) &&
                      "text-emerald-400",
                  )}
                >
                  {match.score1 ?? "-"}
                </span>
                <span className="text-zinc-600 text-xl pb-1">:</span>
                <span
                  className={cn(
                    (match.score2 ?? 0) > (match.score1 ?? 0) &&
                      "text-emerald-400",
                  )}
                >
                  {match.score2 ?? "-"}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between items-center gap-2 w-[35%] shrink-0">
              {t2 ? (
                <div className="w-14 h-14 relative flex items-center justify-center bg-black/30 rounded-full shadow-lg border border-white/5 p-1.5">
                  <TeamLogo
                    team={t2}
                    fallbackClasses="w-10 h-10 object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 bg-zinc-900 rounded-full border border-dashed border-white/10" />
              )}
              <div className="flex-1 flex items-center">
                <div className="text-[13px] leading-tight font-bold text-zinc-100 tracking-wide text-center whitespace-normal break-words max-w-[100px]">
                  {t2NameStr}
                </div>
              </div>
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
                />
                <MatchAnalytics
                  matchData={matchData}
                  analysisData={analysisData}
                  t1={t1 || { name: t1NameStr }}
                  t2={t2 || { name: t2NameStr }}
                />
              </>
            ) : null}
            {match.status === "upcoming" && !matchData && !analysisData && (
              <div className="text-[11px] text-zinc-500 text-center py-6">
                比赛尚未开始
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
