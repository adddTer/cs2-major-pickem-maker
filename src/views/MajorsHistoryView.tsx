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

const TeamDisplay = ({ name, isLarge = false }: { name: string; isLarge?: boolean }) => {
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
        let champion = "tbd";
        let runnerUp = "tbd";
        let thirdFourth = ["tbd", "tbd"];
        let fifthEighth = ["tbd", "tbd", "tbd", "tbd"];

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
            fifthEighth = [...losers, ...Array(4 - losers.length).fill("tbd")];
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
            thirdFourth = [...losers, ...Array(2 - losers.length).fill("tbd")];
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
    <div className="w-full h-full p-4 lg:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6 text-zinc-200">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
        {updatedMajorHistory.map((major, index) => (
          <div
            key={index}
            className="flex flex-col rounded-xl overflow-hidden bg-[#0a0f0d]/80 border border-white/5 shadow-2xl backdrop-blur-md"
          >
            <div className="px-5 py-4 border-b border-white/10 bg-black/40 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-bold text-zinc-100 leading-tight">
                  {major.name}
                </h2>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded whitespace-nowrap",
                    major.game === "CS2"
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  )}
                >
                  {major.game}
                </span>
              </div>
              <div className="flex items-center gap-5 text-xs font-medium text-zinc-400">
                <div className="flex items-center gap-1.5" title="举办时间">
                  <Calendar className="w-3.5 h-3.5 opacity-70" />
                  {major.date}
                </div>
                <div className="flex items-center gap-1.5" title="举办地点">
                  <MapPin className="w-3.5 h-3.5 opacity-70" />
                  {major.location}
                </div>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-5">
              {/* Champion & Runner-up */}
              <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/10 gap-4 sm:gap-0">
                <div className="flex-1 flex flex-col gap-2 sm:pr-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-500/80 uppercase tracking-widest">
                    <Trophy className="w-3.5 h-3.5" /> 冠军
                  </div>
                  <div className="text-yellow-400">
                    <TeamDisplay name={major.champion} isLarge={true} />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2 pt-4 sm:pt-0 sm:pl-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <Medal className="w-3.5 h-3.5" /> 亚军
                  </div>
                  <div className="text-zinc-200">
                    <TeamDisplay name={major.runnerUp} isLarge={true} />
                  </div>
                </div>
              </div>

              {/* 3rd-4th */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                <div className="text-xs font-bold text-orange-400/80 uppercase tracking-widest flex items-center gap-1.5">
                  <Star className="w-3 h-3" /> 3-4名
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  {major.thirdFourth.map((team, idx) => (
                    <TeamDisplay key={idx} name={team} />
                  ))}
                </div>
              </div>

              {/* 5th-8th */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  5-8名
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
