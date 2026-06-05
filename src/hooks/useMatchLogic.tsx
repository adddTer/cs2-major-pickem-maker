import { useMemo, useCallback, useState, useEffect } from 'react';
import { MATCHES, ACTUAL_RESULTS } from '../data/matches';
import { PickSlot, SlotType } from '../types';

export function useMatchLogic(activeStage: string, dataLoaded?: boolean) {
    const [simulatedFutures, setSimulatedFutures] = useState<any>([]);

    const getScheduledMatches = (stage: string) => {
        const stageMatchesMap = MATCHES[stage];
        if (!stageMatchesMap) return [];
        
        const scheduledMatches: { t1: string, t2: string }[] = [];
        Object.values(stageMatchesMap).forEach(batch => {
            batch.forEach(m => {
                if (m.team1Id && m.team2Id && m.score1 === undefined && m.score2 === undefined) {
                    scheduledMatches.push({ t1: m.team1Id, t2: m.team2Id });
                }
            });
        });
        return scheduledMatches;
    };

    const runSimulationAsync = useCallback((numSimulations: number, onProgress?: (progress: number) => void): Promise<any> => {
        return new Promise((resolve) => {
            if (activeStage === 'playoffs') {
                resolve([]);
                return;
            }
            
            const stageMatchesMap = MATCHES[activeStage];
            if (!stageMatchesMap) {
                resolve([]);
                return;
            }
            
            const allTeamsSet = new Set<string>();
            const pastMatches: { t1: string, t2: string, winner: string }[] = [];
            const scheduledMatches: { t1: string, t2: string }[] = [];
            
            Object.values(stageMatchesMap).forEach(batch => {
                batch.forEach(m => {
                    if (m.team1Id) allTeamsSet.add(m.team1Id);
                    if (m.team2Id) allTeamsSet.add(m.team2Id);
                    
                    if (m.team1Id && m.team2Id) {
                        if (m.score1 !== undefined && m.score2 !== undefined) {
                            let isComplete = false;
                            if (m.format === 'bo1') isComplete = m.score1 === 1 || m.score2 === 1;
                            else if (m.format === 'bo3') isComplete = m.score1 === 2 || m.score2 === 2;
                            else if (m.format === 'bo5') isComplete = m.score1 === 3 || m.score2 === 3;

                            if (isComplete) {
                                const winner = m.score1 > m.score2 ? m.team1Id : (m.score2 > m.score1 ? m.team2Id : '');
                                if (winner) {
                                    pastMatches.push({ t1: m.team1Id, t2: m.team2Id, winner });
                                }
                            } else {
                                scheduledMatches.push({ t1: m.team1Id, t2: m.team2Id });
                            }
                        } else {
                            scheduledMatches.push({ t1: m.team1Id, t2: m.team2Id });
                        }
                    }
                });
            });
            
            const allTeams = Array.from(allTeamsSet);
            if (allTeams.length !== 16) {
                resolve([]);
                return;
            }

            const worker = new Worker(new URL('../workers/simulateWorker.ts', import.meta.url), { type: 'module' });
            worker.onmessage = (e) => {
                if (e.data.type === 'progress') {
                    if (onProgress) onProgress(e.data.progress);
                } else if (e.data.type === 'done') {
                    resolve({
                        isPacked: true,
                        allTeams: e.data.allTeams,
                        data: e.data.data
                    });
                    worker.terminate();
                }
            };
            worker.postMessage({ allTeams, pastMatches, scheduledMatches, numSimulations });
        });
    }, [activeStage, dataLoaded]);

    useEffect(() => {
        let isMounted = true;
        setSimulatedFutures([]);
        
        runSimulationAsync(300).then(results => {
            if (isMounted) {
                setSimulatedFutures(results);
            }
        });
        
        return () => { isMounted = false; };
    }, [runSimulationAsync]);

    const getTeamRecords = useCallback((stage: string) => {
        const records: Record<string, { w: number; l: number }> = {};
        const matchesMap = MATCHES[stage] || {};
        
        Object.entries(matchesMap).forEach(([bracket, matches]) => {
            const [wStr, lStr] = bracket.split(':');
            const w = parseInt(wStr, 10);
            const l = parseInt(lStr, 10);
            if (isNaN(w) || isNaN(l)) return;
            
            matches.forEach(m => {
                let hasResult = m.score1 !== undefined && m.score2 !== undefined;
                let t1Win = false;
                let t2Win = false;
                if (hasResult) {
                   if (m.format === 'bo1') {
                       t1Win = m.score1 === 1;
                       t2Win = m.score2 === 1;
                   } else if (m.format === 'bo5') {
                       t1Win = m.score1 === 3;
                       t2Win = m.score2 === 3;
                   } else {
                       t1Win = m.score1 === 2;
                       t2Win = m.score2 === 2;
                   }
                   
                   if (!t1Win && !t2Win) {
                       hasResult = false;
                   }
                }

                if (m.team1Id) {
                    const newW = w + (t1Win ? 1 : 0);
                    const newL = l + (hasResult && !t1Win ? 1 : 0);
                    const cur = records[m.team1Id] || { w: 0, l: 0 };
                    if (newW + newL >= cur.w + cur.l) records[m.team1Id] = { w: newW, l: newL };
                }
                if (m.team2Id) {
                    const newW = w + (t2Win ? 1 : 0);
                    const newL = l + (hasResult && !t2Win ? 1 : 0);
                    const cur = records[m.team2Id] || { w: 0, l: 0 };
                    if (newW + newL >= cur.w + cur.l) records[m.team2Id] = { w: newW, l: newL };
                }
            });
        });
        
        const actuals = ACTUAL_RESULTS[stage] || [];
        actuals.forEach(a => {
            if (a.teamId) {
                if (a.type === '3-0') records[a.teamId] = { w: 3, l: 0 };
                else if (a.type === '0-3') records[a.teamId] = { w: 0, l: 3 };
                else if (a.type === 'advance') {
                    const cur = records[a.teamId] || { w: 0, l: 0 };
                    records[a.teamId] = { w: 3, l: cur.l > 0 ? cur.l : 1 };
                }
            }
        });
        return records;
    }, [dataLoaded]);

    const getComputedActuals = useCallback((stage: string) => {
        let actuals = ACTUAL_RESULTS[stage] || [];
        const records = getTeamRecords(stage) as Record<string, { w: number; l: number }>;
        
        if (stage !== 'playoffs') {
            const computedActuals: PickSlot[] = [];
            Object.entries(records).forEach(([tid, r]) => {
                if (actuals.some(a => a.teamId === tid)) return;
                
                if (r.w === 3 && r.l === 0) computedActuals.push({ id: `r30-${tid}`, type: '3-0', teamId: tid });
                else if (r.w === 3 && r.l > 0) computedActuals.push({ id: `ra-${tid}`, type: 'advance', teamId: tid });
                else if (r.l === 3 && r.w === 0) computedActuals.push({ id: `r03-${tid}`, type: '0-3', teamId: tid });
                else if (r.l === 3 && r.w > 0) computedActuals.push({ id: `rx-${tid}`, type: 'eliminated' as any, teamId: tid });
            });
            actuals = [ ...actuals, ...computedActuals ];
        }
        return actuals;
    }, [getTeamRecords]);

    const activeStageActuals = useMemo(() => getComputedActuals(activeStage), [activeStage, getComputedActuals]);

    const checkPrediction = useCallback((teamId: string | null, type: SlotType, stage: string): 'correct' | 'incorrect' | 'unknown' => {
        if (!teamId) return 'unknown';
        
        const actuals = getComputedActuals(stage);
        
        if (stage === 'playoffs') {
            if (!actuals || actuals.length === 0) return 'unknown';
            const isInActuals = actuals.some(a => a.teamId === teamId && a.type === type);
            const typeCount = actuals.filter(a => a.type === type).length;
            const maxForType = type === 'qf' ? 8 : type === 'sf' ? 4 : type === 'final' ? 2 : 1;
            if (isInActuals) return 'correct';
            if (typeCount >= maxForType) return 'incorrect'; 
            return 'unknown';
        }

        const isInActuals = actuals.some(a => a.teamId === teamId);
        if (isInActuals) {
            const isCorrect = actuals.some(a => a.teamId === teamId && a.type === type);
            if (isCorrect) return 'correct';
            
            if (type === 'advance') {
                const actualType = actuals.find(a => a.teamId === teamId)?.type;
                if (actualType === 'advance') return 'correct';
                if (actualType === '3-0') return 'incorrect'; 
                if (actualType === '0-3') return 'incorrect';
            }
            return 'incorrect';
        }
        
        const records = getTeamRecords(stage);
        const record = records[teamId];
        if (!record) return 'unknown'; 
        
        if (type === '3-0') {
            if (record.l > 0) return 'incorrect'; 
            if (record.w === 3 && record.l === 0) return 'correct';
        } else if (type === '0-3') {
            if (record.w > 0) return 'incorrect'; 
            if (record.l === 3 && record.w === 0) return 'correct';
        } else if (type === 'advance') {
            if (record.l === 3) return 'incorrect'; 
            if (record.w === 3 && record.l > 0) return 'correct';
            if (record.w === 3 && record.l === 0) return 'incorrect'; 
        }
        
        if (type === '3-0' && actuals.filter(a => a.type === '3-0').length >= 2) return 'incorrect';
        if (type === '0-3' && actuals.filter(a => a.type === '0-3').length >= 2) return 'incorrect';
        if (type === 'advance' && actuals.filter(a => a.type === 'advance' || a.type === '3-0').length >= 8) return 'incorrect';
        
        return 'unknown';
    }, [getComputedActuals, getTeamRecords]);

    const getSetStatus = useCallback((theirPicks: PickSlot[], stage: string, customFutures?: any[]) => {
        if (stage === 'playoffs') return null;
        
        const records = getTeamRecords(stage) as Record<string, { w: number; l: number }>;
        
        const teamsWithRecords = Object.values(records).filter(r => (r.w + r.l) > 0);
        if (teamsWithRecords.length === 0) {
            return null; 
        }
        
        const completedMatchesCount = Object.values(records).reduce((sum, r) => sum + r.w + r.l, 0) / 2;

        const filledPicks = theirPicks.filter(p => p.teamId);
        if (filledPicks.length < 10) {
            return null;
        }

        const clashes: { slotId: string, withSlotId: string, type: 'x-one' | 'x-fail' | 'x-pass' }[] = [];
        const scheduled = getScheduledMatches(stage);
        
        for (let i = 0; i < theirPicks.length; i++) {
          for (let j = i + 1; j < theirPicks.length; j++) {
              const p1 = theirPicks[i];
              const p2 = theirPicks[j];
              if (!p1.teamId || !p2.teamId) continue;
              if (checkPrediction(p1.teamId, p1.type, stage) !== 'unknown') continue;
              if (checkPrediction(p2.teamId, p2.type, stage) !== 'unknown') continue;
              
              const isPlaying = scheduled.some(m => 
                  (m.t1 === p1.teamId && m.t2 === p2.teamId) ||
                  (m.t1 === p2.teamId && m.t2 === p1.teamId)
              );
              
              if (isPlaying) {
                  const r1 = records[p1.teamId];
                  if (r1) {
                      if (r1.w === 2 && r1.l === 0) {
                         if (p1.type === '3-0' && p2.type === '3-0') {
                             clashes.push({ slotId: p1.id, withSlotId: p2.id, type: 'x-one' });
                             clashes.push({ slotId: p2.id, withSlotId: p1.id, type: 'x-one' });
                         } else if (p1.type === 'advance' && p2.type === 'advance') {
                             clashes.push({ slotId: p1.id, withSlotId: p2.id, type: 'x-fail' });
                             clashes.push({ slotId: p2.id, withSlotId: p1.id, type: 'x-fail' });
                         }
                      } else if (r1.w === 0 && r1.l === 2) {
                         if (p1.type === '0-3' && p2.type === '0-3') {
                             clashes.push({ slotId: p1.id, withSlotId: p2.id, type: 'x-one' });
                             clashes.push({ slotId: p2.id, withSlotId: p1.id, type: 'x-one' });
                         } else if (p1.type === 'advance' && p2.type === 'advance') {
                             clashes.push({ slotId: p1.id, withSlotId: p2.id, type: 'x-fail' });
                             clashes.push({ slotId: p2.id, withSlotId: p1.id, type: 'x-fail' });
                         }
                      } else if (r1.w === 2 && r1.l === 1) {
                         if (p1.type === 'advance' && p2.type === 'advance') {
                             clashes.push({ slotId: p1.id, withSlotId: p2.id, type: 'x-pass' });
                             clashes.push({ slotId: p2.id, withSlotId: p1.id, type: 'x-pass' });
                         }
                      } else if (r1.w === 1 && r1.l === 2) {
                         if (p1.type === 'advance' && p2.type === 'advance') {
                             clashes.push({ slotId: p1.id, withSlotId: p2.id, type: 'x-fail' });
                             clashes.push({ slotId: p2.id, withSlotId: p1.id, type: 'x-fail' });
                         }
                      } else if (r1.w === 2 && r1.l === 2) {
                         if (p1.type === 'advance' && p2.type === 'advance') {
                             clashes.push({ slotId: p1.id, withSlotId: p2.id, type: 'x-one' });
                             clashes.push({ slotId: p2.id, withSlotId: p1.id, type: 'x-one' });
                         }
                      } else {
                         if ((r1.w === 0 || r1.w === 1) && r1.l === 0 && p1.type === '3-0' && p2.type === '3-0') {
                             clashes.push({ slotId: p1.id, withSlotId: p2.id, type: 'x-fail' });
                             clashes.push({ slotId: p2.id, withSlotId: p1.id, type: 'x-fail' });
                         }
                         if (r1.w === 0 && (r1.l === 0 || r1.l === 1) && p1.type === '0-3' && p2.type === '0-3') {
                             clashes.push({ slotId: p1.id, withSlotId: p2.id, type: 'x-fail' });
                             clashes.push({ slotId: p2.id, withSlotId: p1.id, type: 'x-fail' });
                         }
                      }
                  }
              }
          }
        }

        let guaranteed = 0;
        let mathematicallyIncorrect = 0;
        theirPicks.forEach(p => {
            if (!p.teamId) {
               mathematicallyIncorrect++;
               return;
            }
            const status = checkPrediction(p.teamId, p.type, stage);
            if (status === 'correct') {
                guaranteed++;
            }
            else if (status === 'incorrect') {
                mathematicallyIncorrect++;
            }
        });
        
        const processedClashes = new Set<string>();
        clashes.forEach(c => {
            const pairKey = [c.slotId, c.withSlotId].sort().join('-');
            if (processedClashes.has(pairKey)) return;
            processedClashes.add(pairKey);
            
            if (c.type === 'x-pass') {
                guaranteed++;
            } else if (c.type === 'x-fail') {
                mathematicallyIncorrect++;
            } else if (c.type === 'x-one') {
                guaranteed++;
                mathematicallyIncorrect++;
            }
        });
        
        let possible = 10 - guaranteed - mathematicallyIncorrect;
        if (possible < 0) possible = 0;
        
        let passingProbability = 0;
        
        const checkValidFutures = (f: any) => f && (f.isPacked ? f.data.length > 0 : f.length > 0);
        const futuresToUse = checkValidFutures(customFutures) ? customFutures : simulatedFutures;
        
        if (checkValidFutures(futuresToUse)) {
            let maxPossibleScore = 0;
            let minPossibleScore = 15;
            let passingFuturesCount = 0;

            if (futuresToUse.isPacked) {
                const picksMasks = theirPicks.map(p => {
                    if (!p.teamId) return null;
                    const teamIdx = futuresToUse.allTeams.indexOf(p.teamId);
                    const status = checkPrediction(p.teamId, p.type, stage);
                    return { type: p.type, teamIdx, status };
                }).filter(Boolean);

                const numSims = futuresToUse.data.length / 3;
                let curPassing = 0, curMax = 0, curMin = 15;
                for (let i = 0; i < numSims; i++) {
                    let score = 0;
                    const mask30 = futuresToUse.data[i * 3];
                    const mask03 = futuresToUse.data[i * 3 + 1];
                    const maskAdv = futuresToUse.data[i * 3 + 2];

                    for (let j = 0; j < picksMasks.length; j++) {
                        const pm = picksMasks[j]!;
                        if (pm.status === 'correct') {
                            score++;
                        } else if (pm.status === 'unknown' && pm.teamIdx >= 0) {
                            const bit = 1 << pm.teamIdx;
                            if (pm.type === '3-0' && (mask30 & bit)) score++;
                            else if (pm.type === '0-3' && (mask03 & bit)) score++;
                            else if (pm.type === 'advance' && (maskAdv & bit)) score++;
                        }
                    }
                    
                    if (score >= 5) curPassing++;
                    if (score > curMax) curMax = score;
                    if (score < curMin) curMin = score;
                }
                passingFuturesCount = curPassing;
                maxPossibleScore = curMax;
                minPossibleScore = curMin;
                passingProbability = curPassing / numSims;
            } else {
                futuresToUse.forEach(future => {
                    let score = 0;
                    theirPicks.forEach(p => {
                        if (!p.teamId) return;
                        const status = checkPrediction(p.teamId, p.type, stage);
                        if (status === 'correct') {
                            score++;
                        } else if (status === 'unknown') {
                            if (p.type === '3-0' && future.teams30.has(p.teamId)) score++;
                            else if (p.type === '0-3' && future.teams03.has(p.teamId)) score++;
                            else if (p.type === 'advance' && future.teamsAdvance.has(p.teamId)) score++;
                        }
                    });
                    if (score >= 5) passingFuturesCount++;
                    if (score > maxPossibleScore) maxPossibleScore = score;
                    if (score < minPossibleScore) minPossibleScore = score;
                });
                
                passingProbability = passingFuturesCount / futuresToUse.length;
            }

            const simulatedPossible = Math.max(0, maxPossibleScore - guaranteed);
            if (simulatedPossible < possible) {
                possible = simulatedPossible;
            }
        }
        
        let statusId = 'unknown';
        if (guaranteed >= 5) statusId = 'passed';
        else if (guaranteed + possible < 5) statusId = 'failed';
        else {
            if (checkValidFutures(futuresToUse)) {
                if (passingProbability >= 0.9 || (passingProbability >= 0.7 && completedMatchesCount >= 8)) statusId = 'great_chance';
                else if ((passingProbability <= 0.01 && completedMatchesCount >= 4) || (passingProbability <= 0.1 && completedMatchesCount >= 10)) statusId = 'slim_chance';
                else statusId = 'uncertain';
            } else {
                const needed = 5 - Math.max(guaranteed, 0);
                const margin = possible - needed;
                if (margin >= 3) statusId = 'great_chance';
                else if (margin === 0 && completedMatchesCount >= 4) statusId = 'slim_chance';
                else statusId = 'uncertain';
            }
        }
        return { statusId, guaranteed, mathematicallyIncorrect, possible, passingProbability, clashes };
    }, [getTeamRecords, getScheduledMatches, checkPrediction, simulatedFutures]);

    return {
        getScheduledMatches,
        simulatedFutures,
        runSimulationAsync,
        getTeamRecords,
        getComputedActuals,
        activeStageActuals,
        checkPrediction,
        getSetStatus,
    };
}
