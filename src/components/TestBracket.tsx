import { useMemo } from "react";
import { BracketNode } from "../data/bracketConfigs";
import { TournamentBracketRenderer } from "./TournamentBracketRenderer";
import { BracketSlot } from "./PlayoffsBracket";
import { generateBracketConfig, parseFormatString } from "../utils/bracketGenerator";
import { GroupBox, ResultGroup } from "./SwissBracket";

export const TestBracket = ({ format, onMatchClick }: { format: string; onMatchClick?: (match: any) => void }) => {
  const parsedFormat = useMemo(() => parseFormatString(format), [format]);
  const isRoundRobin = parsedFormat.type === "round_robin" || parsedFormat.type === "double_round_robin";

  const config = useMemo(() => {
    if (isRoundRobin) return null;
    return generateBracketConfig(format);
  }, [format, isRoundRobin]);

  const renderNode = (node: BracketNode) => {
    if (node.type === "playoffsSlot") {
      return (
        <div className="z-10 pointer-events-auto shadow-xl rounded-[6px]">
          <BracketSlot 
            slot={{ id: node.id, type: "playoffs", teamId: null }}
            readOnly={false} 
            emptyTitle="待定" 
            disableDragDrop={node.disableDragDrop}
          />
        </div>
      );
    }
    if (node.type === "playoffsHeader") {
      return (
        <div
          className="absolute text-[12px] text-zinc-900 dark:text-zinc-200 bg-zinc-200/60 dark:bg-black/60 rounded-sm px-1 py-0.5 font-bold tracking-wider flex items-center justify-center pointer-events-auto cursor-default w-[180px] z-50 shadow-md transition-colors"
        >
          {node.title}
        </div>
      );
    }
    if (node.type === "swissGroup") {
      return (
        <GroupBox
          score={node.score!}
          count={node.count!}
        />
      );
    }
    if (node.type === "swissResult") {
      const wins = parseInt(node.score!.split(":")[0]);
      const losses = parseInt(node.score!.split(":")[1]);
      return (
        <ResultGroup
          score={node.score!}
          count={node.count!}
          win={node.win!}
        />
      );
    }
    return null;
  };

  if (isRoundRobin) {
    const teams = Array.from({ length: parsedFormat.teamsCount }, () => `待定`);
    const isSingle = parsedFormat.type === "round_robin";

    return (
      <div className="w-full h-full flex flex-col items-center flex-1 p-8 overflow-auto bg-zinc-50/50 dark:bg-zinc-900/50">
        <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100 shrink-0 pt-4">
          对阵图
        </h2>
        
        <div className="w-full max-w-[1200px] overflow-auto shadow-2xl rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1a1b] p-6 shrink-0 relative">
          <table className="w-full text-sm text-center border-collapse table-fixed min-w-[max-content]">
            <thead>
              <tr>
                <th className="p-4 border-b-2 border-r-2 border-black/10 dark:border-white/10 font-bold w-[120px] bg-zinc-50 dark:bg-black/20 sticky top-0 left-0 z-20" />
                {teams.map((t, i) => (
                  <th key={i} className="p-5 border-b-2 border-black/10 dark:border-white/10 font-bold tracking-wider min-w-[200px] bg-zinc-50 dark:bg-black/20 sticky top-0 z-10 text-zinc-700 dark:text-zinc-300">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((rowTeam, rIdx) => (
                <tr key={rIdx} className="group">
                  <th className="p-5 border-r-2 border-b border-black/10 dark:border-white/10 font-bold text-left bg-zinc-50 dark:bg-black/20 sticky left-0 z-10 group-last:border-b-0 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    {rowTeam}
                  </th>
                  {teams.map((colTeam, cIdx) => {
                    const isSelf = rIdx === cIdx;
                    let showMatch = false;
                    
                    if (!isSelf) {
                      if (isSingle) {
                        showMatch = rIdx < cIdx;
                      } else {
                        showMatch = true;
                      }
                    }

                    return (
                      <td key={cIdx} className={`p-4 border-b border-black/10 dark:border-white/10 ${isSelf ? 'bg-zinc-100/50 dark:bg-white/5' : ''} group-last:border-b-0`}>
                        {isSelf ? (
                          <div className="flex items-center justify-center h-full text-zinc-300 dark:text-zinc-600 font-light text-2xl rotate-45 select-none">
                            +
                          </div>
                        ) : showMatch ? (
                          <div 
                            className="bg-zinc-50 dark:bg-zinc-800/80 rounded-md border border-black/10 dark:border-zinc-700/80 p-3 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col mx-auto w-full group/match relative overflow-hidden"
                            onClick={() => onMatchClick?.({ team1: rowTeam, team2: colTeam, type: parsedFormat.type })}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover/match:from-emerald-500/5 group-hover/match:to-transparent transition-colors z-0" />
                            <div className="flex items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-2 mb-2 relative z-10">
                              <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">{rowTeam}</span>
                              <span className="text-sm font-mono text-zinc-400 dark:text-zinc-500">-</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 relative z-10">
                              <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">{colTeam}</span>
                              <span className="text-sm font-mono text-zinc-400 dark:text-zinc-500">-</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-zinc-300 dark:text-zinc-700 text-lg font-mono select-none">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 relative flex flex-col overflow-hidden z-10">
      {config && (
        <TournamentBracketRenderer
          config={config}
          renderNode={renderNode}
          initialScale={0.8}
          svgDefs={(
            <defs>
              <linearGradient id="win-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.5)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          )}
        />
      )}
    </div>
  );
};
