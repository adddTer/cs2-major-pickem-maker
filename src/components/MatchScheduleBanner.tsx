import React, { useEffect, useState } from 'react';
import { MATCHES } from '../data/matches';
import { StageKey } from '../types';
import { MatchParticipant } from './SwissBracket';

export const MatchScheduleBanner: React.FC<{ activeStage: StageKey }> = ({ activeStage }) => {
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const stageMatches = MATCHES[activeStage];
    if (!stageMatches) return null;

    let upcomingOrLive: any[] = [];
    
    if (activeStage === 'playoffs') {
        const rounds = ['qf', 'sf', 'final'];
        for (const round of rounds) {
            if (stageMatches[round]) {
                upcomingOrLive.push(...stageMatches[round].filter((m: any) => m.status === 'upcoming' || m.status === 'live'));
            }
        }
    } else {
        // swiss brackets
        Object.values(stageMatches).forEach((bracket: any) => {
            upcomingOrLive.push(...bracket.filter((m: any) => m.status === 'upcoming' || m.status === 'live'));
        });
    }

    // Filter valid ones
    upcomingOrLive = upcomingOrLive.filter(m => m.team1Id && m.team2Id && m.team1Id !== 'tbd' && m.team2Id !== 'tbd');

    if (upcomingOrLive.length === 0) return null;

    // sort by time
    upcomingOrLive.sort((a, b) => {
        const parseTime = (val: any) => {
            if (!val) return Infinity;
            if (typeof val === 'number') return val > 9999999999 ? val : val * 1000;
            if (typeof val === 'string') {
                if (/^\d+$/.test(val)) return parseInt(val, 10) * 1000;
                const tString = val.replace(' ', 'T');
                return new Date(tString).getTime() || Infinity;
            }
            return Infinity;
        };
        const ta = parseTime(a.time);
        const tb = parseTime(b.time);
        return ta - tb;
    });

    // Take up to 4
    upcomingOrLive = upcomingOrLive.slice(0, 4);

    const formatCountdown = (targetTime: number) => {
        const diff = targetTime - currentTime;
        if (diff <= 0) return '即将开始';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}天后`;
        }
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-zinc-900/80 border border-blue-500/20 p-4 rounded-lg shadow-sm flex flex-col gap-4 mt-2 mb-2 shrink-0 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-2 border-b border-blue-500/20 pb-3">
                <h3 className="text-sm font-bold text-blue-400 tracking-wider">焦点比赛</h3>
            </div>
            <div className="flex gap-4 min-w-min">
                {upcomingOrLive.map(m => {
                    const parseTime = (val: any) => {
                        if (!val) return 0;
                        if (typeof val === 'number') return val > 9999999999 ? val : val * 1000;
                        if (typeof val === 'string') {
                            if (/^\d+$/.test(val)) return parseInt(val, 10) * 1000;
                            const tString = val.replace(' ', 'T');
                            return new Date(tString).getTime() || 0;
                        }
                        return 0;
                    };
                    
                    const targetTime = parseTime(m.time);
                    const tLabel = targetTime > 0 ? new Date(targetTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                    const isLive = m.status === 'live';

                    return (
                        <div key={m.externalId || Math.random()} className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent shadow-md min-w-[220px] shrink-0 relative transition-transform hover:scale-[1.02]">
                            {isLive && (
                                <span className="absolute top-2 right-2 text-[10px] text-zinc-100 font-bold bg-rose-600/90 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(225,29,72,0.6)] tracking-tighter animate-pulse">
                                    LIVE
                                </span>
                            )}
                            {(tLabel || m.star > 0) && (
                                <div className="flex flex-col w-full mb-2.5">
                                    {tLabel && (
                                        <div className="text-[11px] font-sans text-zinc-400 flex items-center justify-between w-full min-h-[16px]">
                                            <span className="font-medium tracking-wide text-zinc-300">{tLabel}</span>
                                            {!isLive && targetTime > 0 && (
                                                <span className="text-amber-400 font-bold font-mono tracking-tighter bg-amber-500/10 px-1.5 py-0.5 rounded ml-2">{formatCountdown(targetTime)}</span>
                                            )}
                                        </div>
                                    )}
                                    {m.star > 0 && (
                                        <div className="text-[10px] text-yellow-400/80 flex items-center w-full mt-0.5 min-h-[14px]">
                                            {Array.from({ length: m.star }).map((_, i) => (
                                                <span key={i}>★</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center justify-between w-full px-2 mt-auto">
                                <div className="flex-1 flex justify-center"><MatchParticipant teamId={m.team1Id} /></div>
                                <div className="text-xs text-zinc-600 font-medium px-2 italic">VS</div>
                                <div className="flex-1 flex justify-center"><MatchParticipant teamId={m.team2Id} /></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
