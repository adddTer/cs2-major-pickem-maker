import React, { useMemo } from "react";
import { MAJOR_HISTORY } from "../data/majorHistory";
import { MATCHES } from "../data/matches";
import { Trophy, Medal, Star, Calendar, MapPin } from "lucide-react";
import { cn } from "../lib/utils";
import { TEAMS } from "../data/teams";
import { TeamLogo } from "../components/TeamLogo";

const findTeamByName = (name: string) => {
  return TEAMS.find(
    (t) =>
      t.name.toLowerCase() === name.toLowerCase() ||
      t.shortName.toLowerCase() === name.toLowerCase() ||
      t.id.toLowerCase() === name.toLowerCase()
  );
};

const TeamDisplay: React.FC<{ name: string; isLarge?: boolean }> = ({ name, isLarge = false }) => {
  const team = useMemo(() => findTeamByName(name), [name]);
  
  return (
    <div className={cn("flex items-center gap-2", isLarge ? "text-xl font-black" : "text-sm font-medium")}>
      {team ? (
        <>
          <div className={cn("flex-shrink-0 flex items-center justify-center", isLarge ? "w-8 h-8" : "w-5 h-5")}>
            <TeamLogo team={team} />
          </div>
          <span className="truncate">{team.name}</span>
        </>
      ) : (
        <span className="truncate">{name}</span>
      )}
    </div>
  );
};

export const MajorsHistoryView: React.FC = () => {
  const updatedMajorHistory = useMemo(() => {
    return MAJOR_HISTORY.map((major) => {
      if (major.name === "IEM Cologne Major 2026") {
        let champion = major.champion;
        let runnerUp = major.runnerUp;
        let thirdFourth = [...major.thirdFourth];
        let fifthEighth = [...major.fifthEighth];

        const playoffs = MATCHES.playoffs || {};
        
        const isMatchComplete = (m: any) => {
          if (m.score1 === undefined || m.score2 === undefined) return false;
          if (m.format === 'bo3' && (m.score1 >= 2 || m.score2 >= 2)) return true;
          if (m.format === 'bo5' && (m.score1 >= 3 || m.score2 >= 3)) return true;
          if (m.format === 'bo1' && (m.score1 >= 1 || m.score2 >= 1)) return true;
          if (m.score1 >= 2 || m.score2 >= 2) return true; // fallback
          return false;
        };

        if (playoffs.qf) {
          const losers: string[] = [];
          playoffs.qf.forEach((m: any) => {
            if (m.team1Id && m.team2Id && isMatchComplete(m)) {
              losers.push(m.score1 > m.score2 ? m.team2Id : m.team1Id);
            }
          });
          if (losers.length > 0) {
            fifthEighth = [...losers, ...major.fifthEighth.slice(losers.length)];
          }
        }

        if (playoffs.sf) {
          const losers: string[] = [];
          playoffs.sf.forEach((m: any) => {
            if (m.team1Id && m.team2Id && isMatchComplete(m)) {
              losers.push(m.score1 > m.score2 ? m.team2Id : m.team1Id);
            }
          });
          if (losers.length > 0) {
            thirdFourth = [...losers, ...major.thirdFourth.slice(losers.length)];
          }
        }

        if (playoffs.final && playoffs.final.length > 0) {
          const m = playoffs.final[0];
          if (m.team1Id && m.team2Id && isMatchComplete(m)) {
            champion = m.score1 > m.score2 ? m.team1Id : m.team2Id;
            runnerUp = m.score1 > m.score2 ? m.team2Id : m.team1Id;
          }
        }

        return {
          ...major,
          champion,
          runnerUp,
          thirdFourth,
          fifthEighth
        };
      }
      return major;
    });
  }, []);

  return (
    <div className="w-full h-full p-4 lg:p-10 overflow-y-auto custom-scrollbar flex flex-col gap-8 text-zinc-900 dark:text-zinc-200">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-20">
        {updatedMajorHistory.map((major, index) => (
          <div
            key={index}
            className="flex flex-col rounded-[2rem] overflow-hidden bg-white/40 dark:bg-zinc-900/40 border border-black/5 dark:border-white/5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)] hover:-translate-y-1"
          >
            <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/20 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 drop-shadow-sm leading-tight">
                  {major.name}
                </h2>
                <span
                  className={cn(
                    "text-[0.625rem] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm",
                    major.game === "CS2"
                      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  )}
                >
                  {major.game}
                </span>
              </div>
              <div className="flex items-center gap-6 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2" title="举办时间">
                  <Calendar className="w-4 h-4 opacity-70" />
                  {major.date}
                </div>
                <div className="flex items-center gap-2" title="举办地点">
                  <MapPin className="w-4 h-4 opacity-70" />
                  {major.location}
                </div>
              </div>
            </div>

            <div className="p-8 flex flex-col gap-8">
              {/* Champion & Runner-up */}
              <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-black/5 dark:divide-white/5 gap-6 sm:gap-0">
                <div className="flex-1 flex flex-col gap-3 sm:pr-6">
                  <div className="flex items-center gap-2 text-xs font-display font-bold text-yellow-600 dark:text-yellow-500/80 uppercase tracking-widest bg-yellow-500/10 dark:bg-yellow-500/5 w-max px-2.5 py-1 rounded-md border border-yellow-500/20">
                    <Trophy className="w-4 h-4" /> 冠军
                  </div>
                  <div className="text-yellow-700 dark:text-yellow-400 drop-shadow-sm">
                    <TeamDisplay name={major.champion} isLarge={true} />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-3 pt-6 sm:pt-0 sm:pl-6">
                  <div className="flex items-center gap-2 text-xs font-display font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-200/50 dark:bg-zinc-800/50 w-max px-2.5 py-1 rounded-md border border-black/5 dark:border-white/5">
                    <Medal className="w-4 h-4" /> 亚军
                  </div>
                  <div className="text-zinc-900 dark:text-zinc-100 drop-shadow-sm">
                    <TeamDisplay name={major.runnerUp} isLarge={true} />
                  </div>
                </div>
              </div>

              {/* 3rd-4th */}
              <div className="flex flex-col gap-4 pt-6 border-t border-black/5 dark:border-white/5">
                <div className="text-xs font-display font-bold text-orange-600 dark:text-orange-400/80 uppercase tracking-widest flex items-center gap-2 bg-orange-500/10 dark:bg-orange-500/5 w-max px-2.5 py-1 rounded-md border border-orange-500/20">
                  <Star className="w-4 h-4" /> 3-4名
                </div>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-1">
                  {major.thirdFourth.map((team, idx) => (
                    <TeamDisplay key={idx} name={team} />
                  ))}
                </div>
              </div>

              {/* 5th-8th */}
              <div className="flex flex-col gap-4 pt-6 border-t border-black/5 dark:border-white/5">
                <div className="text-xs font-display font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-200/50 dark:bg-zinc-800/50 w-max px-2.5 py-1 rounded-md border border-black/5 dark:border-white/5">
                  5-8名
                </div>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-1">
                  {major.fifthEighth.map((team, idx) => (
                    <TeamDisplay key={idx} name={team} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
