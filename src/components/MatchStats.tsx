import React, { useState, useEffect, useMemo } from "react";
import { cn } from "../lib/utils";
import { TeamLogo } from "./TeamLogo";

interface MatchStatsProps {
  matchData: any;
  t1: any;
  t2: any;
  isReversed?: boolean;
}

const mapTranslation: Record<string, string> = {
  Mirage: "荒漠迷城",
  Inferno: "炼狱小镇",
  Overpass: "死亡游乐园",
  Vertigo: "殒命大厦",
  Nuke: "核子危机",
  Ancient: "远古遗迹",
  Anubis: "阿努比斯",
  Dust2: "炙热沙城2",
  Train: "列车停放站",
};

function computeOverallStats(boutsList: any[], isReversed?: boolean): any {
  if (boutsList.length <= 1) return null;

  const t1_players: Record<string, any> = {};
  const t2_players: Record<string, any> = {};

  let matchTotalRounds = 0;

  boutsList.forEach((b) => {
    let t1_sc = parseInt(b.t1_stats?.all_score || "0") || 0;
    let t2_sc = parseInt(b.t2_stats?.all_score || "0") || 0;
    let rounds = t1_sc + t2_sc;

    // If scores are missing but we have stats, estimate rounds from max deaths
    if (rounds === 0 && b.t1_pr_stats) {
      const maxDeaths = Math.max(
        ...b.t1_pr_stats.map((p: any) => parseInt(p.death || "0") || 0),
        ...b.t2_pr_stats.map((p: any) => parseInt(p.death || "0") || 0),
      );
      rounds = maxDeaths > 0 ? maxDeaths + 2 : 24; // Rough estimate
    }

    matchTotalRounds += rounds;

    const processTeam = (pr_stats: any[], playerMap: Record<string, any>) => {
      if (!pr_stats) return;
      pr_stats.forEach((p) => {
        if (!playerMap[p.id]) {
          playerMap[p.id] = {
            id: p.id,
            name: p.name,
            kill: 0,
            death: 0,
            assist: 0,
            headshot: 0,
            first_blood_num: 0,
            ratingTotal: 0,
            kastTotal: 0,
            adrTotal: 0,
            swingTotal: 0,
            mapsPlayed: 0,
            playerRounds: 0,
          };
        }
        const st = playerMap[p.id];
        st.mapsPlayed += 1;
        st.playerRounds += rounds;
        st.kill += parseInt(p.kill || "0") || 0;
        st.death += parseInt(p.death || "0") || 0;
        st.assist += parseInt(p.assist || "0") || 0;
        st.headshot += parseInt(p.headshot || "0") || 0;
        st.first_blood_num += parseInt(p.first_blood_num || "0") || 0;

        st.ratingTotal += (parseFloat(p.rating || "0") || 0) * rounds;
        st.kastTotal +=
          (parseFloat((p.kast || "0%").replace("%", "")) || 0) * rounds;
        st.adrTotal += (parseFloat(p.adr || "0") || 0) * rounds;
        st.swingTotal +=
          (parseFloat((p.swing || "0%").replace("%", "").replace("+", "")) ||
            0) * rounds;
      });
    };

    if (isReversed) {
      processTeam(b.t2_pr_stats, t1_players);
      processTeam(b.t1_pr_stats, t2_players);
    } else {
      processTeam(b.t1_pr_stats, t1_players);
      processTeam(b.t2_pr_stats, t2_players);
    }
  });

  const finalizeTeam = (playerMap: Record<string, any>) => {
    return Object.values(playerMap)
      .map((st: any) => {
        const pRounds = st.playerRounds > 0 ? st.playerRounds : 1;
        const kd_diff = st.kill - st.death;
        const hs_pct =
          st.kill > 0
            ? ((st.headshot / st.kill) * 100).toFixed(1) + "%"
            : "0.0%";
        const avgSwing = st.swingTotal / pRounds;
        const swingSign = avgSwing > 0 ? "+" : "";
        const diffSign = kd_diff > 0 ? "+" : "";
        return {
          id: st.id,
          name: st.name,
          kill: st.kill,
          death: st.death,
          assist: st.assist,
          kd_diff: `${diffSign}${kd_diff}`,
          rating: (st.ratingTotal / pRounds).toFixed(2),
          kast: (st.kastTotal / pRounds).toFixed(1) + "%",
          adr: (st.adrTotal / pRounds).toFixed(1),
          dpr: (st.death / pRounds).toFixed(2),
          kpr: (st.kill / pRounds).toFixed(2),
          swing: swingSign + avgSwing.toFixed(2) + "%",
          head_shot_rate: hs_pct,
          first_blood_num: st.first_blood_num,
        };
      })
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  };

  return {
    map_name: "All",
    display: "全部地图",
    t1_pr_stats: finalizeTeam(t1_players),
    t2_pr_stats: finalizeTeam(t2_players),
    isOverall: true,
  };
}

export const MatchStats: React.FC<MatchStatsProps> = ({
  matchData,
  t1,
  t2,
  isReversed,
}) => {
  const [activeBoutIndex, setActiveBoutIndex] = useState(0);

  useEffect(() => {
    setActiveBoutIndex(0);
  }, [matchData]);

  const bouts = useMemo(() => {
    if (!matchData?.bouts_state) return [];
    let bs = matchData.bouts_state.filter(
      (b: any) => b.t1_pr_stats?.length > 0 && b.t2_pr_stats?.length > 0,
    );
    if (bs.length > 1) {
      const overall = computeOverallStats(bs, isReversed);
      if (overall) {
        bs = [overall, ...bs];
      }
    }
    return bs;
  }, [matchData]);

  if (bouts.length === 0) {
    return null;
  }

  const activeBout = bouts[activeBoutIndex];
  const hasOverall = bouts.length > 1 && bouts[0].isOverall;

  const renderTable = (team: any, stats: any[], isT1: boolean) => {
    return (
      <div className="w-full flex justify-center mb-6">
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <div className="w-full min-w-max">
            <div
              className={`flex items-center gap-3 mb-2 px-3 py-2 rounded-xl border ${isT1 ? "border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5" : "border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5"}`}
            >
              {team && (
                <div className="w-6 h-6 shrink-0 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-full shadow-sm p-1">
                  <TeamLogo team={team} fallbackClasses="text-[0.625rem]" />
                </div>
              )}
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {team?.name || (isT1 ? "Team 1" : "Team 2")}
              </span>
            </div>
            <table className="w-full text-left text-[0.6875rem] whitespace-nowrap">
              <thead className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 uppercase font-medium">
                <tr>
                  <th className="font-bold p-3 pl-4">选手</th>
                  <th className="font-bold p-3 text-center text-zinc-900 dark:text-zinc-300 w-[50px]">
                    Rating
                  </th>
                  <th className="font-bold p-3 text-center w-[60px]">K-D-A</th>
                  <th className="font-bold p-3 text-center w-[40px]">+ / -</th>
                  <th className="font-bold p-3 text-center w-[50px]">KPR</th>
                  <th className="font-bold p-3 text-center w-[50px]">DPR</th>
                  <th className="font-bold p-3 text-center w-[50px]">KAST</th>
                  <th className="font-bold p-3 text-center w-[50px]">ADR</th>
                  <th className="font-bold p-3 text-center w-[50px]">Swing</th>
                  <th className="font-bold p-3 text-center w-[40px]">HS%</th>
                  <th className="font-bold p-3 text-center w-[40px]">FK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {stats.map((player, idx) => {
                  const rating = parseFloat(player.rating || "0");
                  // 1.00-1.10之间显示为普通颜色。往上显示为绿色，向下显示为红色。
                  let ratingColor = "text-zinc-900 dark:text-zinc-100";
                  if (rating > 1.1) {
                    ratingColor = "text-emerald-600 dark:text-emerald-400";
                  } else if (rating < 1.0) {
                    ratingColor = "text-rose-600 dark:text-rose-400";
                  }

                  const diff = player.kd_diff || "";
                  const diffColor = diff.startsWith("+")
                    ? "text-emerald-600 dark:text-emerald-400"
                    : diff.startsWith("-")
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-zinc-500 dark:text-zinc-400";

                  const swing = player.swing || "";
                  const swingColor = swing.startsWith("+")
                    ? "text-emerald-600 dark:text-emerald-400"
                    : swing.startsWith("-")
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-zinc-500 dark:text-zinc-400";
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="p-3 pl-4 font-bold text-zinc-900 dark:text-zinc-100">
                        {player.name}
                      </td>
                      <td
                        className={cn(
                          "p-3 text-center font-bold font-mono",
                          ratingColor,
                        )}
                      >
                        {player.rating}
                      </td>
                      <td className="p-3 text-center font-mono text-zinc-600 dark:text-zinc-400">
                        {player.kill}-{player.death}-{player.assist}
                      </td>
                      <td
                        className={cn(
                          "p-3 text-center font-mono font-bold",
                          diffColor,
                        )}
                      >
                        {player.kd_diff}
                      </td>
                      <td className="p-3 text-center font-mono text-zinc-500 dark:text-zinc-500">
                        {player.kpr}
                      </td>
                      <td className="p-3 text-center font-mono text-zinc-500 dark:text-zinc-500">
                        {player.dpr}
                      </td>
                      <td className="p-3 text-center font-mono text-zinc-500 dark:text-zinc-500">
                        {player.kast}
                      </td>
                      <td className="p-3 text-center font-mono text-zinc-500 dark:text-zinc-500">
                        {player.adr}
                      </td>
                      <td
                        className={cn("p-3 text-center font-mono", swingColor)}
                      >
                        {player.swing}
                      </td>
                      <td className="p-3 text-center font-mono text-zinc-500 dark:text-zinc-500">
                        {player.head_shot_rate}
                      </td>
                      <td className="p-3 text-center font-mono text-zinc-500 dark:text-zinc-500">
                        {player.first_blood_num}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const getBoutDisplay = (bout: any, idx: number) => {
    if (bout.isOverall) return "全部地图";
    const mname = mapTranslation[bout.map_name] || bout.map_name;
    const dispNumber = hasOverall ? idx : idx + 1;
    const disp = `第${dispNumber}局`;
    if (mname && mname !== "All" && mname !== "") {
      return `${disp} - ${mname}`;
    }
    return disp;
  };

  return (
    <div className="flex flex-col gap-4 mt-6 w-full px-1 pb-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest px-1 font-display">
          数据总览
        </h4>
        {bouts.length > 1 && (
          <div className="flex bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 mt-1 overflow-x-auto scrollbar-none shadow-sm">
            {bouts.map((bout: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveBoutIndex(idx)}
                className={cn(
                  "px-4 py-1.5 text-[0.6875rem] font-bold rounded-md transition-all whitespace-nowrap",
                  activeBoutIndex === idx
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                )}
              >
                {getBoutDisplay(bout, idx)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] p-4 pt-6 flex flex-col items-center shadow-sm">
        {renderTable(
          t1,
          isReversed ? activeBout.t2_pr_stats : activeBout.t1_pr_stats,
          true,
        )}
        {renderTable(
          t2,
          isReversed ? activeBout.t1_pr_stats : activeBout.t2_pr_stats,
          false,
        )}
      </div>
    </div>
  );
};
