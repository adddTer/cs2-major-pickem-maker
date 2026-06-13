import React from "react";
import { AlertCircle } from "lucide-react";
import { StageKey } from "../types";
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
}

export const RankingsView: React.FC<RankingsViewProps> = ({ activeStage, setActiveStage, isDegraded, getComputedActuals }) => {
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
          if (slot.teamId && !stageTeams.has(slot.teamId)) {
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
          if (slot.teamId && !stageTeams.has(slot.teamId)) {
            const team = TEAMS.find(t => t.id === slot.teamId);
            if (team) foundTeams.push(team);
          }
        });
      }
      
      if (stage === "playoffs") {
        // Add anyone who officially advanced from stage 3
        const advStage3 = getComputedActuals ? getComputedActuals("stage3") : ACTUAL_RESULTS.stage3 || [];
        advStage3.forEach((slot: any) => {
          if (slot.teamId && !stageTeams.has(slot.teamId)) {
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
      <div className="flex-1 flex flex-col bg-zinc-900/60 border border-white/5 rounded-lg shadow-xl relative backdrop-blur-md overflow-hidden p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 shrink-0">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-zinc-100">参赛队伍排名</h2>
            {isDegraded && (
              <div className="flex items-center gap-1.5 text-yellow-500/90 text-[11px] bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/20 w-fit">
                <AlertCircle className="w-3 h-3" />
                <span>无法获取实时数据，已降级为本地预设排名</span>
              </div>
            )}
          </div>
          <div className="flex bg-black/40 p-1 rounded-md border border-white/5 overflow-x-auto custom-scrollbar shrink-0 max-w-full">
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
                    "px-3 py-1 text-[11px] font-bold rounded-[2px] cursor-pointer transition-colors whitespace-nowrap shrink-0",
                    activeStage === tabId
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  {stageLabel}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-black/20 rounded-md border border-white/5">
          <table className="w-full text-left text-[13px] text-zinc-300 relative border-collapse">
            <thead className="text-[11px] uppercase tracking-wider text-zinc-500 bg-zinc-800/80 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 border-b border-white/5 font-medium w-16 text-center">综合排序</th>
                <th className="px-4 py-3 border-b border-white/5 text-left font-medium">队伍</th>
                <th className="px-4 py-3 border-b border-white/5 font-medium text-right">综合实力</th>
                <th className="px-4 py-3 border-b border-white/5 font-medium text-right">V社排名</th>
                <th className="px-4 py-3 border-b border-white/5 font-medium text-right">V社积分</th>
                <th className="px-4 py-3 border-b border-white/5 font-medium text-right">HLTV排名</th>
                <th className="px-4 py-3 border-b border-white/5 font-medium text-right">HLTV积分</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedTeams.map((team, idx) => {
                const hasData =
                  team.valveRank !== undefined || team.hltvRank !== undefined;

                return (
                  <tr
                    key={team.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-4 py-3 text-center text-zinc-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex-shrink-0">
                          <TeamLogo team={team} fallbackClasses="text-[9px] rounded-sm" />
                        </div>
                        <span className="font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">
                          {team.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasData && team.strength ? (
                        <span className="font-mono text-zinc-300">
                          {team.strength.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-zinc-600">暂无</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {team.valveRank !== undefined && team.valveRank <= 1000 ? (
                        <span className="font-mono text-zinc-300">
                          #{team.valveRank}
                        </span>
                      ) : (
                        <span className="text-zinc-600">暂无</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {team.valvePoints !== undefined ? (
                        <span className="font-mono text-emerald-400/80">
                          {team.valvePoints}
                        </span>
                      ) : (
                        <span className="text-zinc-600">暂无</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {team.hltvRank !== undefined && team.hltvRank <= 1000 ? (
                        <span className="font-mono text-zinc-300">
                          #{team.hltvRank}
                        </span>
                      ) : (
                        <span className="text-zinc-600">暂无</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {team.hltvPoints !== undefined ? (
                        <span className="font-mono text-blue-400/80">
                          {team.hltvPoints}
                        </span>
                      ) : (
                        <span className="text-zinc-600">暂无</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sortedTeams.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
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

