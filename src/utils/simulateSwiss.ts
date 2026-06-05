export interface SwissSimulationResult {
    teams30: Set<string>;
    teams03: Set<string>;
    teamsAdvance: Set<string>;
}

export function simulateSwiss(
    allTeams: string[],
    pastMatches: { t1: string; t2: string; winner: string }[],
    scheduledMatches: { t1: string; t2: string }[],
    numSimulations: number = 200
): SwissSimulationResult[] {
    const initialRecords: Record<string, { w: number; l: number }> = {};
    const initialPlayed: Record<string, Set<string>> = {};

    for (const t of allTeams) {
        initialRecords[t] = { w: 0, l: 0 };
        initialPlayed[t] = new Set();
    }

    for (const m of pastMatches) {
        if (!initialRecords[m.t1]) initialRecords[m.t1] = { w: 0, l: 0 };
        if (!initialRecords[m.t2]) initialRecords[m.t2] = { w: 0, l: 0 };
        if (!initialPlayed[m.t1]) initialPlayed[m.t1] = new Set();
        if (!initialPlayed[m.t2]) initialPlayed[m.t2] = new Set();

        initialPlayed[m.t1].add(m.t2);
        initialPlayed[m.t2].add(m.t1);

        if (m.winner === m.t1) {
            initialRecords[m.t1].w++;
            initialRecords[m.t2].l++;
        } else if (m.winner === m.t2) {
            initialRecords[m.t2].w++;
            initialRecords[m.t1].l++;
        }
    }

    const results: SwissSimulationResult[] = [];

    for (let sim = 0; sim < numSimulations; sim++) {
        const records = { ...initialRecords };
        for (const t in records) records[t] = { ...records[t] };
        
        const played = { ...initialPlayed };
        for (const t in played) played[t] = new Set(played[t]);

        const getActiveTeams = () => Object.entries(records)
            .filter(([_, r]) => r.w < 3 && r.l < 3)
            .map(([t]) => t);

        let safetyCounter = 0;
        
        while (getActiveTeams().length > 0 && safetyCounter < 50) {
            safetyCounter++;
            const active = getActiveTeams();
            
            // First resolve any scheduled matches that involve active teams in the same bracket tier
            const matched = new Set<string>();

            // Only use scheduled matches if their current records match
            for (const m of scheduledMatches) {
                if (!matched.has(m.t1) && !matched.has(m.t2) && active.includes(m.t1) && active.includes(m.t2)) {
                    const r1 = records[m.t1];
                    const r2 = records[m.t2];
                    if (r1.w === r2.w && r1.l === r2.l) {
                        matched.add(m.t1);
                        matched.add(m.t2);
                        const winner = Math.random() > 0.5 ? m.t1 : m.t2;
                        const loser = winner === m.t1 ? m.t2 : m.t1;
                        records[winner].w++;
                        records[loser].l++;
                        played[m.t1].add(m.t2);
                        played[m.t2].add(m.t1);
                    }
                }
            }
            
            // Group the remaining active teams by record
            const groups: Record<string, string[]> = {};
            for (const t of active) {
                if (matched.has(t)) continue;
                const rec = records[t];
                const key = `${rec.w}-${rec.l}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(t);
            }

            // For each group, do a greedy matching
            for (const key in groups) {
                const groupTeams = groups[key];
                
                // Buchholz score calculation
                const getBuchholz = (t: string) => {
                    let score = 0;
                    for (const opp of played[t]) {
                        score += (records[opp].w - records[opp].l);
                    }
                    return score;
                };

                const getInitialSeed = (t: string) => {
                    return allTeams.indexOf(t);
                };

                // Sort teams by Buchholz, then Initial Seed
                groupTeams.sort((a, b) => {
                    const bA = getBuchholz(a);
                    const bB = getBuchholz(b);
                    if (bA !== bB) {
                        return bB - bA; // Higher Buchholz first
                    }
                    return getInitialSeed(a) - getInitialSeed(b); // Lower index is better seed
                });
                
                while (groupTeams.length > 0) {
                    const t1 = groupTeams.shift()!;
                    if (matched.has(t1)) continue;
                    
                    let matchIdx = -1;
                    // Match Highest vs Lowest: iterate from the end (lowest)
                    for (let j = groupTeams.length - 1; j >= 0; j--) {
                        const t2 = groupTeams[j];
                        if (!matched.has(t2) && !played[t1].has(t2)) {
                            matchIdx = j;
                            break;
                        }
                    }
                    
                    // If couldn't find unplayed, pick the lowest unmatched
                    if (matchIdx === -1) {
                        for (let j = groupTeams.length - 1; j >= 0; j--) {
                            const t2 = groupTeams[j];
                            if (!matched.has(t2)) {
                                matchIdx = j;
                                break;
                            }
                        }
                    }

                    if (matchIdx !== -1) {
                        const bestMatch = groupTeams[matchIdx];
                        groupTeams.splice(matchIdx, 1); // remove from array
                        
                        matched.add(t1);
                        matched.add(bestMatch);
                        
                        // Simulate match (50/50 probability)
                        const winner = Math.random() > 0.5 ? t1 : bestMatch;
                        const loser = winner === t1 ? bestMatch : t1;
                        
                        records[winner].w++;
                        records[loser].l++;
                        played[t1].add(bestMatch);
                        played[bestMatch].add(t1);
                    } else {
                        matched.add(t1);
                        records[t1].w++; // pseudo win for the odd one
                    }
                }
            }
        }

        const teams30 = new Set<string>();
        const teams03 = new Set<string>();
        const teamsAdvance = new Set<string>();

        for (const [t, r] of Object.entries(records)) {
            if (r.w === 3 && r.l === 0) teams30.add(t);
            else if (r.w === 0 && r.l === 3) teams03.add(t);
            else if (r.w === 3) teamsAdvance.add(t);
        }

        results.push({ teams30, teams03, teamsAdvance });
    }

    return results;
}
