import { GLOBAL_SEEDING } from "../data/seedings";
import { LOCAL_POINTS, getLocalStrength } from "../data/localPoints";

export interface SwissSimulationResult {
  teams30: Set<string>;
  teams03: Set<string>;
  teamsAdvance: Set<string>;
}

export function simulateSwiss(
  allTeams: string[],
  pastMatches: { t1: string; t2: string; winner: string; w1?: number; w2?: number }[],
  scheduledMatches: { t1: string; t2: string }[],
  numSimulations: number = 200,
  teamStrengths: Record<string, number> = {},
  activeStage: string = "stage1"
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

    const getActiveTeams = () =>
      Object.entries(records)
        .filter(([_, r]) => r.w < 3 && r.l < 3)
        .map(([t]) => t);

    let safetyCounter = 0;

    while (getActiveTeams().length > 0 && safetyCounter < 50) {
      safetyCounter++;
      const active = getActiveTeams();

      const roundWinnerUpdates: string[] = [];
      const roundLoserUpdates: string[] = [];
      const playedUpdates: [string, string][] = [];

      const getFormat = (w: number, l: number) => {
        if (activeStage === "stage3") return "bo3";
        return w === 2 || l === 2 ? "bo3" : "bo1";
      };

      const getSingleMapProb = (s1: number, s2: number) => {
        // Determine single map probability using an M value optimized for the given BCGame odds.
        // M=1300 balances out the large strength difference bounds.
        const M = 1300;
        return 1 / (1 + Math.pow(10, (s2 - s1) / M));
      };

      const getWinner = (t1: string, t2: string, format: string) => {
        const fallbackS1 = getLocalStrength(t1) || (2000 - (GLOBAL_SEEDING[t1] || 32) * 30);
        const fallbackS2 = getLocalStrength(t2) || (2000 - (GLOBAL_SEEDING[t2] || 32) * 30);
        const s1 = teamStrengths[t1] || fallbackS1;
        const s2 = teamStrengths[t2] || fallbackS2;
        
        let w1 = 0;
        let w2 = 0;

        if (format === "bo3") {
          const mapAdv = 150;
          const pMap1 = getSingleMapProb(s1 + mapAdv, s2); // T1 pick
          const pMap2 = getSingleMapProb(s1, s2 + mapAdv); // T2 pick
          const pMap3 = getSingleMapProb(s1, s2);          // Decider

          if (Math.random() < pMap1) w1++; else w2++;
          if (Math.random() < pMap2) w1++; else w2++;
          if (w1 === 1 && w2 === 1) {
            if (Math.random() < pMap3) w1++; else w2++;
          }
        } else if (format === "bo5") {
          const p1 = getSingleMapProb(s1, s2);
          while (w1 < 3 && w2 < 3) {
            if (Math.random() < p1) w1++; else w2++;
          }
        } else {
          const p1 = getSingleMapProb(s1, s2);
          if (Math.random() < p1) w1++; else w2++;
        }
        
        return { winner: w1 > w2 ? t1 : t2, w1, w2 };
      };

      // First resolve any scheduled matches that involve active teams in the same bracket tier
      const matched = new Set<string>();

      // Only use scheduled matches if their current records match
      for (const m of scheduledMatches) {
        if (
          !matched.has(m.t1) &&
          !matched.has(m.t2) &&
          active.includes(m.t1) &&
          active.includes(m.t2)
        ) {
          const r1 = records[m.t1];
          const r2 = records[m.t2];
          if (r1.w === r2.w && r1.l === r2.l) {
            matched.add(m.t1);
            matched.add(m.t2);
            
            const format = getFormat(r1.w, r1.l);
            const { winner, w1, w2 } = getWinner(m.t1, m.t2, format);
            const loser = winner === m.t1 ? m.t2 : m.t1;
            
            roundWinnerUpdates.push(winner);
            roundLoserUpdates.push(loser);
            playedUpdates.push([m.t1, m.t2]);
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

        // Buchholz score calculation (Match Difference ONLY)
        const getBuchholz = (t: string) => {
          let score = 0;
          for (const opp of played[t]) {
            score += records[opp].w - records[opp].l;
          }
          return score;
        };

        const getInitialSeed = (t: string) => {
          return GLOBAL_SEEDING[t] || allTeams.indexOf(t) || 99;
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

        // Filter out already matched
        const pool = groupTeams.filter(t => !matched.has(t));
        let pairings: [string, string][] | null = null;
        
        // Check if this is Round 1 (no matches played yet)
        const sampleRecord = pool.length > 0 ? records[pool[0]] : { w: -1, l: -1 };
        if (sampleRecord.w === 0 && sampleRecord.l === 0) {
            pairings = [];
            const half = Math.floor(pool.length / 2);
            for (let i = 0; i < half; i++) {
                pairings.push([pool[i], pool[i + half]]);
            }
        } else {
            function findValidPairing(teams: string[]): [string, string][] | null {
              if (teams.length === 0) return [];
              const t1 = teams[0];
              for (let i = teams.length - 1; i >= 1; i--) {
                const t2 = teams[i];
                if (!played[t1].has(t2)) {
                  const rest = [...teams];
                  rest.splice(i, 1);
                  rest.splice(0, 1);
                  const sub = findValidPairing(rest);
                  if (sub !== null) {
                    return [[t1, t2], ...sub];
                  }
                }
              }
              return null;
            }

            pairings = findValidPairing([...pool]);
            if (!pairings) {
              // Fallback greedy
              pairings = [];
              const temp = [...pool];
              while (temp.length >= 2) {
                pairings.push([temp.shift()!, temp.pop()!]);
              }
              if (temp.length > 0) matched.add(temp[0]); // Odd logic
            }
        }

        for (const [t1, bestMatch] of pairings) {
            matched.add(t1);
            matched.add(bestMatch);

            const format = getFormat(records[t1].w, records[t1].l);
            const { winner, w1, w2 } = getWinner(t1, bestMatch, format);
            const loser = winner === t1 ? bestMatch : t1;

            roundWinnerUpdates.push(winner);
            roundLoserUpdates.push(loser);
            playedUpdates.push([t1, bestMatch]);
        }
      }

      for (const w of roundWinnerUpdates) records[w].w++;
      for (const l of roundLoserUpdates) records[l].l++;
      for (const [t1, t2] of playedUpdates) {
        played[t1].add(t2);
        played[t2].add(t1);
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
