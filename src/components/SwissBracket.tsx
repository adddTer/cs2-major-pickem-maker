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
            <div className="w-[28px] h-[28px] flex items-center justify-center relative zoom-in-95 animate-in">
                <TeamLogo team={team} fallbackClasses="rounded-[4px] text-[8px]" />
            </div>
        );
    }
    return (
        <div className="w-[28px] h-[28px] rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center font-bold text-zinc-500 text-[11px] shadow-inner pb-[1px]">
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
        <div className="bg-zinc-900/60 border border-white/5 rounded-[8px] p-4 pt-6 pb-4 flex flex-col items-center relative shadow-lg w-[130px] shrink-0 z-10 backdrop-blur-sm pointer-events-auto">
            <div className="absolute top-1.5 right-2 text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">{score}</div>
            <div className="flex flex-col gap-[10px] w-full items-center justify-center relative">
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

const AbsoluteBox = ({ p, children }: { p: any, children: React.ReactNode }) => (
    <div style={{left: p.x, top: p.y}} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 w-max">
        {children}
    </div>
);

export const SwissBracket = ({ activeStage }: { activeStage: string }) => {
    const pos = {
        g00: { id: 'g00', x: 90, y: 280, o1: 65, o2: 65 },
        
        g10: { id: 'g10', x: 260, y: 180, o1: 65, o2: 65 },
        g01: { id: 'g01', x: 260, y: 380, o1: 65, o2: 65 },
        
        g20: { id: 'g20', x: 430, y: 120, o1: 65, o2: 65 },
        g11: { id: 'g11', x: 430, y: 280, o1: 65, o2: 65 },
        g02: { id: 'g02', x: 430, y: 440, o1: 65, o2: 65 },
        
        g21: { id: 'g21', x: 600, y: 200, o1: 65, o2: 65 },
        g12: { id: 'g12', x: 600, y: 360, o1: 65, o2: 65 },
        
        g22:  { id: 'g22', x: 770, y: 280, o1: 65, o2: 65 },
    };

    const pathLines = [
        { p1: pos.g00, p2: pos.g10, win: true },
        { p1: pos.g00, p2: pos.g01, win: false },
        { p1: pos.g10, p2: pos.g20, win: true },
        { p1: pos.g10, p2: pos.g11, win: false },
        { p1: pos.g01, p2: pos.g11, win: true },
        { p1: pos.g01, p2: pos.g02, win: false },
        
        { p1: pos.g20, p2: pos.g21, win: false },
        
        { p1: pos.g11, p2: pos.g21, win: true },
        { p1: pos.g11, p2: pos.g12, win: false },
        
        { p1: pos.g02, p2: pos.g12, win: true },
        
        { p1: pos.g21, p2: pos.g22, win: false },
        
        { p1: pos.g12, p2: pos.g22, win: true },
    ];

    const getMatches = (score: string) => {
        return MATCHES[activeStage]?.[score] || [];
    };

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden z-10 relative">
            <TransformWrapper
                initialScale={1}
                minScale={0.3}
                maxScale={2}
                centerOnInit={true}
                wheel={{ step: 0.1 }}
                panning={{ velocityDisabled: false }}
            >
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%", cursor: "grab" }}>
                    <div className="w-[860px] h-[560px] relative pointer-events-none px-4 flex-shrink-0">
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
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
};
