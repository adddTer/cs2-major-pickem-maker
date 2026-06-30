import React from "react";
import { AlertCircle } from "lucide-react";
import { StageKey, TournamentEvent } from "../types";
import { cn } from "../lib/utils";
import { TEAMS } from "../data/teams";
import { MATCHES, ACTUAL_RESULTS } from "../data/matches";
import { GLOBAL_SEEDING } from "../data/seedings";
import { getLocalStrength } from "../data/localPoints";
import { TeamLogo } from "../components/TeamLogo";

interface RankingsViewProps {
  activeStage: StageKey;
  setActiveStage: (val: StageKey) => void;
  isDegraded?: boolean;
  getComputedActuals?: (stage: string) => any[];
  currentEvent?: TournamentEvent;
}

export const RankingsView: React.FC<RankingsViewProps> = ({ activeStage, setActiveStage, isDegraded, getComputedActuals, currentEvent }) => {
    // Get teams participating in the active stage
    const getTeamsForStage = (stage: StageKey) => {
      let stageTeams = new Set<string>();

      if (stage === "playoffs") {
        ['qf', 'sf', 'final'].forEach((round) => {
          (MATCHES.playoffs?.[round as any] || []).forEach((m: any) => {
            if (m.team1Id && m.team1Id !== 'tbd') stageTeams.add(m.team1Id);
            if (m.team2Id && m.team2Id !== 'tbd') stageTeams.add(m.team2Id);
          });
        });
      } else {
        ['0-0', '1-0', '0-1', '2-0', '1-1', '0-2', '2-1', '1-2', '2-2'].forEach((group) => {
          (MATCHES[stage]?.[group as any] || []).forEach((m: any) => {
            if (m.team1Id && m.team1Id !== 'tbd') stageTeams.add(m.team1Id);
            if (m.team2Id && m.team2Id !== 'tbd') stageTeams.add(m.team2Id);
          });
        });
      }

      // If we have teams actively scheduled in this stage, we can include them
      let foundTeams = TEAMS.filter((t) => stageTeams.has(t.id));

      // As to not lose teams that definitely belong in this stage but haven't played yet
      // we combine with teams that natively start in this stage
      if (!currentEvent || currentEvent.id === "iem_cologne_2026") {
        if (stage === "stage1") {
          const nativeTeams = TEAMS.filter(t => t.startStage === 1);
          nativeTeams.forEach(t => { if (!stageTeams.has(t.id)) foundTeams.push(t); });
        }
        
        if (stage === "stage2") {
          const nativeTeams = TEAMS.filter(t => t.startStage === 2);
          nativeTeams.forEach(t => { if (!stageTeams.has(t.id)) foundTeams.push(t); });
          
          // Add anyone who officially advanced from stage 1
          const advStage1 = getComputedActuals ? getComputedActuals("stage1") : ACTUAL_RESULTS.stage1 || [];
          advStage1.forEach((slot: any) => {
            if (slot.teamId && (slot.type === "advance" || slot.type === "3-0") && !stageTeams.has(slot.teamId)) {
              const team = TEAMS.find(t => t.id === slot.teamId);
              if (team) foundTeams.push(team);
            }
          });
        }
        
        if (stage === "stage3") {
          const nativeTeams = TEAMS.filter(t => t.startStage === 3);
          nativeTeams.forEach(t => { if (!stageTeams.has(t.id)) foundTeams.push(t); });
          
          // Add anyone who officially advanced from stage 2
          const advStage2 = getComputedActuals ? getComputedActuals("stage2") : ACTUAL_RESULTS.stage2 || [];
          advStage2.forEach((slot: any) => {
            if (slot.teamId && (slot.type === "advance" || slot.type === "3-0") && !stageTeams.has(slot.teamId)) {
              const team = TEAMS.find(t => t.id === slot.teamId);
              if (team) foundTeams.push(team);
            }
          });
        }
      }
      
      if (stage === "playoffs") {
        // Add anyone who officially advanced from stage 3
        const advStage3 = getComputedActuals ? getComputedActuals("stage3") : ACTUAL_RESULTS.stage3 || [];
        advStage3.forEach((slot: any) => {
          if (slot.teamId && (slot.type === "advance" || slot.type === "3-0") && !stageTeams.has(slot.teamId)) {
            const team = TEAMS.find(t => t.id === slot.teamId);
            if (team) foundTeams.push(team);
          }
        });
      }

      // Deduplicate before returning
      const finalIds = new Set(foundTeams.map(t => t.id));
      return Array.from(finalIds)
        .map(id => TEAMS.find(t => t.id === id))
        .filter((t): t is (typeof TEAMS)[0] => !!t);
    };

    const currentTeams = getTeamsForStage(activeStage);
    
    // Sort teams by overall strength
    const sortedTeams = [...currentTeams].sort((a, b) => {
        const fallbackSA = getLocalStrength(a.id) || (2000 - (GLOBAL_SEEDING[a.id] || 32) * 30);
        const fallbackSB = getLocalStrength(b.id) || (2000 - (GLOBAL_SEEDING[b.id] || 32) * 30);
        const sA = a.strength || fallbackSA;
        const sB = b.strength || fallbackSB;
        return sB - sA;
    });

    return (
      <div className="flex-1 flex flex-col bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] shadow-sm relative backdrop-blur-xl overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-display">参赛队伍排名</h2>
            {isDegraded && (
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-500 text-[13px] bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-500/20 w-fit font-medium shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>无法获取实时数据，已降级为本地预设排名</span>
              </div>
            )}
          </div>
          <div className="flex bg-white/60 dark:bg-zinc-950/60 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner overflow-x-auto custom-scrollbar shrink-0 max-w-full">
            {["stage1", "stage2", "stage3", "playoffs"].map((tabId) => {
              const stageLabel =
                tabId === "stage1"
                  ? "第一阶段"
                  : tabId === "stage2"
                    ? "第二阶段"
                    : tabId === "stage3"
                      ? "第三阶段"
                      : "决胜阶段";
              return (
                <div
                  key={`rankings-${tabId}`}
                  onClick={() => setActiveStage(tabId as StageKey)}
                  className={cn(
                    "px-5 py-2 text-[13px] font-display font-bold rounded-xl cursor-pointer transition-all duration-300 whitespace-nowrap shrink-0 flex items-center",
                    activeStage === tabId
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md ring-1 ring-zinc-900/5 dark:ring-white/10"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                  )}
                >
                  {stageLabel}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white/60 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner custom-scrollbar">
          <table className="w-full text-left text-[13px] text-zinc-800 dark:text-zinc-300 relative border-collapse">
            <thead className="text-[11px] font-display uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/90 dark:bg-zinc-900/90 sticky top-0 z-10 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
              <tr>
                <th className="px-5 py-4 font-bold w-16 text-center border-b border-zinc-200/50 dark:border-zinc-800/50">综合排序</th>
                <th className="px-5 py-4 text-left font-bold border-b border-zinc-200/50 dark:border-zinc-800/50">队伍</th>
                <th className="px-5 py-4 font-bold text-right border-b border-zinc-200/50 dark:border-zinc-800/50">综合实力</th>
                <th className="px-5 py-4 font-bold text-right border-b border-zinc-200/50 dark:border-zinc-800/50">V社排名</th>
                <th className="px-5 py-4 font-bold text-right border-b border-zinc-200/50 dark:border-zinc-800/50">V社积分</th>
                <th className="px-5 py-4 font-bold text-right border-b border-zinc-200/50 dark:border-zinc-800/50">HLTV排名</th>
                <th className="px-5 py-4 font-bold text-right border-b border-zinc-200/50 dark:border-zinc-800/50">HLTV积分</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
              {sortedTeams.map((team, idx) => {
                const hasData =
                  team.valveRank !== undefined || team.hltvRank !== undefined;

                return (
                  <tr
                    key={team.id}
                    className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors group"
                  >
                    <td className="px-5 py-3 text-center text-zinc-400 dark:text-zinc-500 font-mono font-bold">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 flex-shrink-0 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-700 shadow-sm">
                          <TeamLogo team={team} fallbackClasses="text-[10px] rounded-full" />
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">
                          {team.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {hasData && team.strength ? (
                        <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                          {team.strength.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 font-medium">暂无</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {team.valveRank !== undefined && team.valveRank <= 1000 ? (
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          #{team.valveRank}
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 font-medium">暂无</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {team.valvePoints !== undefined ? (
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {team.valvePoints}
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 font-medium">暂无</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {team.hltvRank !== undefined && team.hltvRank <= 1000 ? (
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          #{team.hltvRank}
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 font-medium">暂无</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {team.hltvPoints !== undefined ? (
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {team.hltvPoints}
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 font-medium">暂无</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sortedTeams.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-50/50 dark:bg-zinc-900/50">
                    此阶段暂无参赛队伍
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

