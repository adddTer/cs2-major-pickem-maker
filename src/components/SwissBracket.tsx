import React from 'react';
import { TEAMS } from '../data/teams';
import { MATCHES } from '../data/matches';
import { BracketMatch } from '../types';
import { cn } from '../lib/utils';
import { useFitScale } from '../utils/hooks';
import { TeamLogo } from './TeamLogo';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const MatchParticipant = ({ teamId }: { teamId?: string }) => {
    const team = TEAMS.find(t => t.id === teamId);
    if (team) {
        return (
            <div className="w-[32px] h-[32px] shrink-0 flex items-center justify-center relative zoom-in-95 animate-in">
                <TeamLogo team={team} fallbackClasses="rounded-[4px] text-[9px]" />
            </div>
        );
    }
    return (
        <div className="w-[32px] h-[32px] shrink-0 rounded-full bg-zinc-950/80 border border-white/10 flex items-center justify-center font-bold text-zinc-500 text-[11px] shadow-inner pb-[1px] relative zoom-in-95 animate-in">
            ?
        </div>
    );
};

const MatchLine: React.FC<{ match?: BracketMatch }> = ({ match }) => {
    const hasResult = match?.score1 !== undefined && match?.score2 !== undefined;
    
    let displayLeft = match?.score1;
    let displayRight = match?.score2;
    
    if (match?.format === 'bo1' && match.maps?.[0]) {
        displayLeft = match.maps[0].score1;
        displayRight = match.maps[0].score2;
    }

    return (
        <div className="flex items-center gap-2 mx-auto relative z-10 w-full px-2 justify-center">
            <MatchParticipant teamId={match?.team1Id} />
            {hasResult ? (
                <div className="flex flex-col items-center justify-center min-w-[28px] shrink-0">
                    <div className="flex items-center justify-center gap-1">
                        <span className={cn("text-[11px] font-bold", (displayLeft ?? 0) > (displayRight ?? 0) ? "text-emerald-400 drop-shadow-sm" : "text-zinc-500")}>{displayLeft}</span>
                        <span className="text-[9px] text-zinc-700">-</span>
                        <span className={cn("text-[11px] font-bold", (displayRight ?? 0) > (displayLeft ?? 0) ? "text-emerald-400 drop-shadow-sm" : "text-zinc-500")}>{displayRight}</span>
                    </div>
                    {match.format === 'bo3' && (
                         <span className="text-[8px] text-zinc-600 uppercase font-mono tracking-tighter -mt-1 scale-75">BO3</span>
                    )}
                </div>
            ) : (
                <span className="text-[10px] text-zinc-600/80 font-medium w-[28px] text-center uppercase tracking-widest shrink-0">vs</span>
            )}
            <MatchParticipant teamId={match?.team2Id} />
        </div>
    );
};

const GroupBox = ({ score, count, matches = [] }: { score: string, count: number, matches?: BracketMatch[] }) => {
    return (
        <div className="bg-zinc-900/60 border border-white/5 rounded-[8px] p-4 pt-6 pb-4 flex flex-col items-center relative shadow-lg w-[136px] shrink-0 z-10 backdrop-blur-sm pointer-events-auto">
            <div className="absolute top-1.5 right-2 text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">{score}</div>
            <div className="flex flex-col gap-[8px] w-full items-center justify-center relative">
                {Array.from({ length: count }).map((_, i) => (
                    <MatchLine key={i} match={matches[i]} />
                ))}
            </div>
        </div>
    )
};

const DrawPath: React.FC<{ p1: any, p2: any, win: boolean }> = ({ p1, p2, win }) => {
    let sx = p1.x + p1.o1;
    let sy = p1.y;
    let ex = p2.x - p2.o2;
    let ey = p2.y;
    
    const dist = Math.abs(ex - sx);
    const cx1 = sx + dist * 0.5;
    const cx2 = ex - dist * 0.5;
    
    return (
        <path d={`M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ey}, ${ex} ${ey}`} stroke={`url(#${win ? 'win' : 'loss'}-grad)`} strokeWidth="1.5" fill="none" strokeDasharray="5 3"/>
    );
};

const ResultGroup = ({ score, count, win, teams = [] }: { score: string, count: number, win: boolean, teams?: string[] }) => {
    return (
        <div className={cn(
            "border rounded-[8px] p-4 pt-6 pb-4 flex flex-col items-center relative shadow-lg w-[136px] shrink-0 z-10 backdrop-blur-sm pointer-events-auto",
            win ? "bg-emerald-900/60 border-emerald-500/20" : "bg-rose-950/60 border-rose-500/20"
        )}>
            <div className={cn("absolute top-1.5 right-2 text-[11px] font-bold uppercase tracking-tighter", win ? "text-emerald-500/80" : "text-rose-500/80")}>{score}</div>
            <div className="flex flex-col gap-[8px] w-full items-center justify-center relative">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex justify-center w-full min-h-[32px]">
                        <MatchParticipant teamId={teams[i]} />
                    </div>
                ))}
            </div>
        </div>
    )
};

const AbsoluteBox = ({ p, children }: { p: any, children: React.ReactNode }) => (
    <div style={{left: p.x, top: p.y}} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 w-max">
        {children}
    </div>
);

export const SwissBracket = ({ activeStage }: { activeStage: string }) => {
    const pos = {
        g00: { id: 'g00', x: 90, y: 360, o1: 65, o2: 65 },
        
        g10: { id: 'g10', x: 280, y: 244, o1: 65, o2: 65 },
        g01: { id: 'g01', x: 280, y: 476, o1: 65, o2: 65 },
        
        g20: { id: 'g20', x: 470, y: 168, o1: 65, o2: 65 },
        g11: { id: 'g11', x: 470, y: 360, o1: 65, o2: 65 },
        g02: { id: 'g02', x: 470, y: 552, o1: 65, o2: 65 },
        
        g30: { id: 'g30', x: 660, y: 92, o1: 65, o2: 65 },
        g21: { id: 'g21', x: 660, y: 264, o1: 65, o2: 65 },
        g12: { id: 'g12', x: 660, y: 456, o1: 65, o2: 65 },
        g03: { id: 'g03', x: 660, y: 628, o1: 65, o2: 65 },
        
        g31: { id: 'g31', x: 850, y: 168, o1: 65, o2: 65 },
        g22: { id: 'g22', x: 850, y: 360, o1: 65, o2: 65 },
        g13: { id: 'g13', x: 850, y: 552, o1: 65, o2: 65 },

        g32: { id: 'g32', x: 1040, y: 264, o1: 65, o2: 65 },
        g23: { id: 'g23', x: 1040, y: 456, o1: 65, o2: 65 },
    };

    const pathLines = [
        { p1: pos.g00, p2: pos.g10, win: true },
        { p1: pos.g00, p2: pos.g01, win: false },
        { p1: pos.g10, p2: pos.g20, win: true },
        { p1: pos.g10, p2: pos.g11, win: false },
        { p1: pos.g01, p2: pos.g11, win: true },
        { p1: pos.g01, p2: pos.g02, win: false },
        
        { p1: pos.g20, p2: pos.g30, win: true },
        { p1: pos.g20, p2: pos.g21, win: false },
        
        { p1: pos.g11, p2: pos.g21, win: true },
        { p1: pos.g11, p2: pos.g12, win: false },
        
        { p1: pos.g02, p2: pos.g12, win: true },
        { p1: pos.g02, p2: pos.g03, win: false },
        
        { p1: pos.g21, p2: pos.g31, win: true },
        { p1: pos.g21, p2: pos.g22, win: false },
        
        { p1: pos.g12, p2: pos.g22, win: true },
        { p1: pos.g12, p2: pos.g13, win: false },
        
        { p1: pos.g22, p2: pos.g32, win: true },
        { p1: pos.g22, p2: pos.g23, win: false },
    ];

    const getMatches = (score: string) => {
        return MATCHES[activeStage]?.[score] || [];
    };

    const getFinalTeams = (wins: number, losses: number) => {
        const records: Record<string, { w: number; l: number }> = {};
        const matchesMap = MATCHES[activeStage] || {};
        
        Object.values(matchesMap).flat().forEach(match => {
            if (match.score1 !== undefined && match.score2 !== undefined) {
                let s1 = match.score1;
                let s2 = match.score2;
                if (match.format === 'bo1' && match.maps && match.maps[0]) {
                    s1 = match.maps[0].score1;
                    s2 = match.maps[0].score2;
                }
                const team1Win = s1 > s2;
                
                if (match.team1Id) {
                    if (!records[match.team1Id]) records[match.team1Id] = { w: 0, l: 0 };
                    team1Win ? records[match.team1Id].w++ : records[match.team1Id].l++;
                }
                if (match.team2Id) {
                    if (!records[match.team2Id]) records[match.team2Id] = { w: 0, l: 0 };
                    team1Win ? records[match.team2Id].l++ : records[match.team2Id].w++;
                }
            }
        });

        return Object.entries(records)
            .filter(([_, r]) => r.w === wins && r.l === losses)
            .map(([id]) => id);
    };

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden z-10 relative">
            <TransformWrapper
                initialScale={1}
                minScale={0.3}
                maxScale={2}
                centerOnInit={true}
                wheel={{ step: 0.001 }}
                panning={{ velocityDisabled: false }}
            >
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%", cursor: "grab" }}>
                    <div className="w-[1200px] h-[800px] relative pointer-events-none px-4 flex-shrink-0">
                        {/* SVG Connections */}
                        <svg className="absolute inset-0 w-full h-full z-0 opacity-45 pointer-events-none" style={{ left: 0, top: 0 }}>
                            <defs>
                                <linearGradient id="win-grad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0"/>
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="1"/>
                                </linearGradient>
                                <linearGradient id="loss-grad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0"/>
                                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="1"/>
                                </linearGradient>
                            </defs>
                            {pathLines.map((l, i) => <DrawPath key={i} p1={l.p1} p2={l.p2} win={l.win} />)}
                        </svg>

                        {/* Swiss Bracket Boxes */}
                        <AbsoluteBox p={pos.g00}><GroupBox score="0:0" count={8} matches={getMatches('0:0')} /></AbsoluteBox>
                        <AbsoluteBox p={pos.g10}><GroupBox score="1:0" count={4} matches={getMatches('1:0')} /></AbsoluteBox>
                        <AbsoluteBox p={pos.g01}><GroupBox score="0:1" count={4} matches={getMatches('0:1')} /></AbsoluteBox>
                        <AbsoluteBox p={pos.g20}><GroupBox score="2:0" count={2} matches={getMatches('2:0')} /></AbsoluteBox>
                        <AbsoluteBox p={pos.g11}><GroupBox score="1:1" count={4} matches={getMatches('1:1')} /></AbsoluteBox>
                        <AbsoluteBox p={pos.g02}><GroupBox score="0:2" count={2} matches={getMatches('0:2')} /></AbsoluteBox>
                        <AbsoluteBox p={pos.g21}><GroupBox score="2:1" count={3} matches={getMatches('2:1')} /></AbsoluteBox>
                        <AbsoluteBox p={pos.g12}><GroupBox score="1:2" count={3} matches={getMatches('1:2')} /></AbsoluteBox>
                        <AbsoluteBox p={pos.g22}><GroupBox score="2:2" count={3} matches={getMatches('2:2')} /></AbsoluteBox>

                        {/* Advance / Eliminate Result Groups */}
                        <AbsoluteBox p={pos.g30}><ResultGroup score="3:0" count={2} win={true} teams={getFinalTeams(3, 0)} /></AbsoluteBox>
                        <AbsoluteBox p={pos.g31}><ResultGroup score="3:1" count={3} win={true} teams={getFinalTeams(3, 1)} /></AbsoluteBox>
                        <AbsoluteBox p={pos.g32}><ResultGroup score="3:2" count={3} win={true} teams={getFinalTeams(3, 2)} /></AbsoluteBox>
                        
                        <AbsoluteBox p={pos.g03}><ResultGroup score="0:3" count={2} win={false} teams={getFinalTeams(0, 3)} /></AbsoluteBox>
                        <AbsoluteBox p={pos.g13}><ResultGroup score="1:3" count={3} win={false} teams={getFinalTeams(1, 3)} /></AbsoluteBox>
                        <AbsoluteBox p={pos.g23}><ResultGroup score="2:3" count={3} win={false} teams={getFinalTeams(2, 3)} /></AbsoluteBox>
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
};
