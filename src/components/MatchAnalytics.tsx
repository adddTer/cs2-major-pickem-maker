import React from "react";
import { cn } from "../lib/utils";
import { TeamLogo } from "./TeamLogo";

interface MatchAnalyticsProps {
  matchData: any;
  analysisData?: any;
  t1: any;
  t2: any;
  isReversed?: boolean;
}

export const MatchAnalytics: React.FC<MatchAnalyticsProps> = ({
  matchData,
  analysisData,
  t1,
  t2,
  isReversed,
}) => {
  const currentBout =
    matchData?.bouts_state?.[matchData.bouts_state.length - 1];
  const prStats = currentBout?.pr_stats || [];

  const getTeamPowerAverages = () => {
    if (!analysisData?.power_comparison) return null;

    let t1PowerStats = analysisData.power_comparison.t1_player_stats;
    let t2PowerStats = analysisData.power_comparison.t2_player_stats;

    if (isReversed) {
      t1PowerStats = analysisData.power_comparison.t2_player_stats;
      t2PowerStats = analysisData.power_comparison.t1_player_stats;
    }

    if (
      !t1PowerStats ||
      !t2PowerStats ||
      t1PowerStats.length === 0 ||
      t2PowerStats.length === 0
    )
      return null;

    const categories = t1PowerStats[0].player_power_data_items.map(
      (i: any) => ({
        key: i.label_key,
        name: i.label_name,
      }),
    );

    const calculateAverage = (players: any[], categoryKey: string) => {
      const total = players.reduce((sum, p) => {
        const item = p.player_power_data_items.find(
          (i: any) => i.label_key === categoryKey,
        );
        return sum + (item ? parseFloat(item.score || 0) : 0);
      }, 0);
      return Math.round(total / players.length);
    };

    return categories.map((cat: any) => ({
      name: cat.name,
      t1: calculateAverage(t1PowerStats, cat.key),
      t2: calculateAverage(t2PowerStats, cat.key),
    }));
  };

  const powerAverages = getTeamPowerAverages();

  if (prStats.length === 0 && !powerAverages) return null;

  const getPlayerInfo = (playerId: string, teamSide: "t1" | "t2") => {
    let actualSide = teamSide;
    if (isReversed) {
      if (teamSide === "t1") actualSide = "t2";
      if (teamSide === "t2") actualSide = "t1";
    }
    const statsList =
      actualSide === "t1" ? currentBout?.t1_pr_stats : currentBout?.t2_pr_stats;
    if (!statsList) return null;
    return statsList.find((p: any) => p.id === playerId);
  };

  return (
    <div className="flex flex-col gap-4 mt-6 w-full px-1 pb-4">
      {powerAverages && (
        <div className="flex flex-col gap-3">
          <h4 className="text-[11px] font-medium text-white/50 tracking-widest px-1">
            队伍战力雷达
          </h4>
          <div className="bg-zinc-100/80 dark:bg-zinc-900/80 border border-black/5 dark:border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-center gap-3 mb-4 bg-zinc-50/40 dark:bg-zinc-950/40 py-2 rounded-lg border-t-2 border-emerald-500/50">
              {t1 ? (
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  <TeamLogo team={t1 as any} fallbackClasses="text-[10px]" />
                </div>
              ) : (
                <span className="text-zinc-800 dark:text-zinc-300 text-[11px] font-bold">{t1?.name}</span>
              )}
              {analysisData?.comparison && (
                <div className="flex gap-3 text-[10px] font-mono tracking-tighter">
                  <span className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">
                    WIN:{" "}
                    <span className="text-emerald-400 font-bold">
                      {isReversed ? analysisData.comparison.t2_stats?.win_rate : analysisData.comparison.t1_stats?.win_rate}%
                    </span>
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">
                    KD:{" "}
                    <span className="text-emerald-400 font-bold">
                      {isReversed ? analysisData.comparison.t2_stats?.kd : analysisData.comparison.t1_stats?.kd}
                    </span>
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {powerAverages.map((cat: any, i: number) => {
                const t1Adv = cat.t1 >= cat.t2;
                const t2Adv = cat.t2 >= cat.t1;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center gap-1 min-h-[120px]"
                  >
                    <div className="text-[10px] font-mono tracking-tighter text-emerald-400 font-bold">
                      {cat.t1}
                    </div>
                    <div className="w-1.5 relative border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-800 rounded-full h-[36px] overflow-hidden">
                      <div
                        className={cn(
                          "absolute bottom-0 left-0 w-full rounded-full transition-all",
                          t1Adv ? "bg-emerald-500" : "bg-emerald-500/30",
                        )}
                        style={{
                          height: `${Math.max(10, Math.min(100, cat.t1))}%`,
                        }}
                      ></div>
                    </div>

                    <div className="text-[10px] text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 my-0.5">
                      {cat.name}
                    </div>

                    <div className="w-1.5 relative border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-800 rounded-full h-[36px] overflow-hidden">
                      <div
                        className={cn(
                          "absolute top-0 left-0 w-full rounded-full transition-all",
                          t2Adv ? "bg-amber-500" : "bg-amber-500/30",
                        )}
                        style={{
                          height: `${Math.max(10, Math.min(100, cat.t2))}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-[10px] font-mono tracking-tighter text-amber-400 font-bold">
                      {cat.t2}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3 mt-4 bg-zinc-50/40 dark:bg-zinc-950/40 py-2 rounded-lg border-b-2 border-amber-500/50">
              {t2 ? (
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  <TeamLogo team={t2 as any} fallbackClasses="text-[10px]" />
                </div>
              ) : (
                <span className="text-zinc-800 dark:text-zinc-300 text-[11px] font-bold">{t2?.name}</span>
              )}
              {analysisData?.comparison && (
                <div className="flex gap-3 text-[10px] font-mono tracking-tighter">
                  <span className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">
                    WIN:{" "}
                    <span className="text-amber-400 font-bold">
                      {isReversed ? analysisData.comparison.t1_stats?.win_rate : analysisData.comparison.t2_stats?.win_rate}%
                    </span>
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">
                    KD:{" "}
                    <span className="text-amber-400 font-bold">
                      {isReversed ? analysisData.comparison.t1_stats?.kd : analysisData.comparison.t2_stats?.kd}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {prStats.length > 0 && (
        <div className="flex flex-col gap-3 mt-4">
          <h4 className="text-[11px] font-medium text-white/50 tracking-widest px-1">
            关键对决
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prStats.map((statItem: any, idx: number) => {
              const t1Player = getPlayerInfo(statItem.t1_player_id, "t1");
              const t2Player = getPlayerInfo(statItem.t2_player_id, "t2");

              return (
                <div
                  key={idx}
                  className="bg-zinc-100/80 dark:bg-zinc-900/80 border border-black/5 dark:border-white/5 rounded-xl p-3 flex flex-col gap-3 relative overflow-hidden"
                >
                  <div className="text-[13px] font-bold text-center text-zinc-900 dark:text-zinc-200">
                    {statItem.title}
                  </div>
                  <div className="flex justify-between items-stretch w-full relative">
                    {/* Team 1 Side */}
                    <div className="flex flex-col items-center flex-1 relative px-1">
                      <div className="relative mb-2">
                        <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full overflow-hidden border border-black/10 dark:border-white/10 flex items-center justify-center">
                          {t1Player?.half_portrait || t1Player?.portrait ? (
                            <img
                              src={t1Player.half_portrait || t1Player.portrait}
                              className="w-full h-full object-cover mt-1"
                            />
                          ) : t1 ? (
                            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                              <TeamLogo team={t1 as any} fallbackClasses="text-[10px]" />
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-[10px] font-bold text-black dark:text-white mb-2 max-w-[80px] truncate">
                        {t1Player?.name || "Player"}
                      </div>

                      {statItem.data.map((d: any, i: number) => (
                        <div
                          key={i}
                          className="flex flex-col items-center mt-1"
                        >
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-500">
                            {d.title}
                          </span>
                          <span
                            className={cn(
                              "text-[14px] font-bold font-mono tracking-tight",
                              parseFloat(d.t1_data) >= parseFloat(d.t2_data)
                                ? "text-emerald-400"
                                : "text-zinc-800 dark:text-zinc-300",
                            )}
                          >
                            {d.t1_data}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Divider Line */}
                    <div className="w-px h-[calc(100%-10px)] bg-black/5 dark:bg-white/5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

                    {/* Team 2 Side */}
                    <div className="flex flex-col items-center flex-1 relative px-1">
                      <div className="relative mb-2">
                        <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full overflow-hidden border border-black/10 dark:border-white/10 flex items-center justify-center">
                          {t2Player?.half_portrait || t2Player?.portrait ? (
                            <img
                              src={t2Player.half_portrait || t2Player.portrait}
                              className="w-full h-full object-cover mt-1"
                            />
                          ) : t2 ? (
                            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                              <TeamLogo team={t2 as any} fallbackClasses="text-[10px]" />
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-[10px] font-bold text-black dark:text-white mb-2 max-w-[80px] truncate">
                        {t2Player?.name || "Player"}
                      </div>

                      {statItem.data.map((d: any, i: number) => (
                        <div
                          key={i}
                          className="flex flex-col items-center mt-1"
                        >
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-500">
                            {d.title}
                          </span>
                          <span
                            className={cn(
                              "text-[14px] font-bold font-mono tracking-tight",
                              parseFloat(d.t2_data) >= parseFloat(d.t1_data)
                                ? "text-emerald-400"
                                : "text-zinc-800 dark:text-zinc-300",
                            )}
                          >
                            {d.t2_data}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
