import { GLOBAL_SEEDING } from "../data/seedings";
import { getLocalStrength } from "../data/localPoints";
import { TEAMS } from "../data/teams";

export interface GlobalSimulationResult {
  championFreq: Record<string, number>;
  finalFreq: Record<string, Record<string, number>>; // slot -> team -> count
  sfFreq: Record<string, Record<string, number>>;
  qfFreq: Record<string, Record<string, number>>;
  playoffsFreq: Record<string, number>;
  stage3Freq: Record<string, number>;
  stage2Freq: Record<string, number>;
  totalSims: number;
}

const getSingleMapProb = (s1: number, s2: number) => {
  const M = 1300;
  return 1 / (1 + Math.pow(10, (s2 - s1) / M));
};

const getWinner = (
  t1: string,
  t2: string,
  format: string,
  teamStrengths: Record<string, number>,
) => {
  const fallbackS1 =
    getLocalStrength(t1) || 2000 - (GLOBAL_SEEDING[t1] || 32) * 30;
  const fallbackS2 =
    getLocalStrength(t2) || 2000 - (GLOBAL_SEEDING[t2] || 32) * 30;
  const s1 = teamStrengths[t1] || fallbackS1;
  const s2 = teamStrengths[t2] || fallbackS2;

  let w1 = 0;
  let w2 = 0;

  if (format === "bo3") {
    const mapAdv = 150;
    const pMap1 = getSingleMapProb(s1 + mapAdv, s2);
    const pMap2 = getSingleMapProb(s1, s2 + mapAdv);
    const pMap3 = getSingleMapProb(s1, s2);

    if (Math.random() < pMap1) w1++;
    else w2++;
    if (Math.random() < pMap2) w1++;
    else w2++;
    if (w1 === 1 && w2 === 1) {
      if (Math.random() < pMap3) w1++;
      else w2++;
    }
  } else if (format === "bo5") {
    const p1 = getSingleMapProb(s1, s2);
    while (w1 < 3 && w2 < 3) {
      if (Math.random() < p1) w1++;
      else w2++;
    }
  } else {
    const p1 = getSingleMapProb(s1, s2);
    if (Math.random() < p1) w1++;
    else w2++;
  }

  return { winner: w1 > w2 ? t1 : t2, loser: w1 > w2 ? t2 : t1, w1, w2 };
};

function getBuchholzScore(
  team: string,
  records: Record<string, { w: number; l: number }>,
  played: Record<string, Set<string>>,
) {
  let score = 0;
  for (const opp of played[team] || []) {
    if (records[opp]) {
      score += records[opp].w - records[opp].l;
    }
  }
  return score;
}

function simulateOneStage(
  activeStage: string,
  allTeams: string[],
  pastMatches: { t1: string; t2: string; winner: string }[],
  scheduledMatches: { t1: string; t2: string }[],
  teamStrengths: Record<string, number>,
  stageSeeds: Record<string, number>,
) {
  const records: Record<string, { w: number; l: number }> = {};
  const played: Record<string, Set<string>> = {};

  for (const t of allTeams) {
    records[t] = { w: 0, l: 0 };
    played[t] = new Set();
  }

  for (const m of pastMatches) {
    if (!records[m.t1]) records[m.t1] = { w: 0, l: 0 };
    if (!records[m.t2]) records[m.t2] = { w: 0, l: 0 };
    if (!played[m.t1]) played[m.t1] = new Set();
    if (!played[m.t2]) played[m.t2] = new Set();

    played[m.t1].add(m.t2);
    played[m.t2].add(m.t1);

    if (m.winner === m.t1) {
      records[m.t1].w++;
      records[m.t2].l++;
    } else if (m.winner === m.t2) {
      records[m.t2].w++;
      records[m.t1].l++;
    }
  }

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

    const matched = new Set<string>();

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
          const { winner, loser } = getWinner(
            m.t1,
            m.t2,
            format,
            teamStrengths,
          );
          roundWinnerUpdates.push(winner);
          roundLoserUpdates.push(loser);
          playedUpdates.push([m.t1, m.t2]);
        }
      }
    }

    const groups: Record<string, string[]> = {};
    for (const t of active) {
      if (matched.has(t)) continue;
      const rec = records[t];
      const key = `${rec.w}-${rec.l}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }

    for (const key in groups) {
      const groupTeams = groups[key];
      groupTeams.sort((a, b) => {
        const bA = getBuchholzScore(a, records, played);
        const bB = getBuchholzScore(b, records, played);
        if (bA !== bB) return bB - bA;
        return (stageSeeds[a] || 99) - (stageSeeds[b] || 99);
      });

      const pool = groupTeams.filter((t) => !matched.has(t));
      let pairings: [string, string][] | null = null;

      const sampleRecord =
        pool.length > 0 ? records[pool[0]] : { w: -1, l: -1 };
      if (sampleRecord.w === 0 && sampleRecord.l === 0) {
        pairings = [];
        const half = Math.floor(pool.length / 2);
        for (let i = 0; i < half; i++) pairings.push([pool[i], pool[i + half]]);
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
              if (sub !== null) return [[t1, t2], ...sub];
            }
          }
          return null;
        }
        pairings = findValidPairing([...pool]);
        if (!pairings) {
          pairings = [];
          const temp = [...pool];
          while (temp.length >= 2) pairings.push([temp.shift()!, temp.pop()!]);
          if (temp.length > 0) matched.add(temp[0]);
        }
      }

      for (const [t1, bestMatch] of pairings) {
        matched.add(t1);
        matched.add(bestMatch);
        const format = getFormat(records[t1].w, records[t1].l);
        const { winner, loser } = getWinner(
          t1,
          bestMatch,
          format,
          teamStrengths,
        );
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

  const advanced: string[] = [];
  const teams30: string[] = [];
  const teams31: string[] = [];
  const teams32: string[] = [];

  for (const [t, r] of Object.entries(records)) {
    if (r.w === 3) {
      advanced.push(t);
      if (r.l === 0) teams30.push(t);
      else if (r.l === 1) teams31.push(t);
      else if (r.l === 2) teams32.push(t);
    }
  }

  const sortTeams = (group: string[]) => {
    return group.sort((a, b) => {
      const bA = getBuchholzScore(a, records, played);
      const bB = getBuchholzScore(b, records, played);
      if (bA !== bB) return bB - bA;
      return (stageSeeds[a] || 99) - (stageSeeds[b] || 99);
    });
  };

  return {
    advanced,
    seeds: [
      ...sortTeams(teams30),
      ...sortTeams(teams31),
      ...sortTeams(teams32),
    ],
    records,
    played,
  };
}

function simulatePlayoffs(
  seeds: string[],
  pastMatches: { t1: string; t2: string; winner: string }[],
  scheduledMatches: { t1: string; t2: string }[],
  teamStrengths: Record<string, number>,
) {
  let qfWinners: string[] = [];
  const qfMatchups: [string, string][] = [];

  const allPlayoffMatches = [...pastMatches, ...scheduledMatches];
  if (allPlayoffMatches.length >= 4) {
    qfMatchups.push([allPlayoffMatches[0].t1, allPlayoffMatches[0].t2]);
    qfMatchups.push([allPlayoffMatches[1].t1, allPlayoffMatches[1].t2]);
    qfMatchups.push([allPlayoffMatches[2].t1, allPlayoffMatches[2].t2]);
    qfMatchups.push([allPlayoffMatches[3].t1, allPlayoffMatches[3].t2]);
  } else {
    qfMatchups.push([seeds[0], seeds[7]]);
    qfMatchups.push([seeds[3], seeds[4]]);
    qfMatchups.push([seeds[1], seeds[6]]);
    qfMatchups.push([seeds[2], seeds[5]]);
  }

  const getMatchWinner = (t1: string, t2: string, format: string) => {
    const pm = pastMatches.find(
      (m) => (m.t1 === t1 && m.t2 === t2) || (m.t1 === t2 && m.t2 === t1),
    );
    if (pm) return pm.winner;
    return getWinner(t1, t2, format, teamStrengths).winner;
  };

  for (const [t1, t2] of qfMatchups) {
    if (!t1 || !t2) continue;
    qfWinners.push(getMatchWinner(t1, t2, "bo3"));
  }

  let sfWinners: string[] = [];
  if (qfWinners.length === 4) {
    const sfMatchups = [
      [qfWinners[0], qfWinners[1]],
      [qfWinners[2], qfWinners[3]],
    ];
    for (const [t1, t2] of sfMatchups) {
      sfWinners.push(getMatchWinner(t1, t2, "bo3"));
    }
  }

  let champion = "";
  if (sfWinners.length === 2) {
    champion = getMatchWinner(sfWinners[0], sfWinners[1], "bo5");
  }

  return { champion, final: sfWinners, sf: qfWinners, qf: qfMatchups.flat() };
}

export function simulateGlobal(
  currentMatches: any, // Matches grouped by stage
  computedActuals: any,
  numSimulations: number,
  onProgress: (p: number) => void,
): GlobalSimulationResult {
  const teamStrengths: Record<string, number> = {};
  TEAMS.forEach((t) => {
    if (t.strength) teamStrengths[t.id] = t.strength;
  });

  const res: GlobalSimulationResult = {
    championFreq: {},
    finalFreq: { "final-1": {}, "final-2": {} },
    sfFreq: { "sf-1": {}, "sf-2": {}, "sf-3": {}, "sf-4": {} },
    qfFreq: {
      "qf-1": {},
      "qf-2": {},
      "qf-3": {},
      "qf-4": {},
      "qf-5": {},
      "qf-6": {},
      "qf-7": {},
      "qf-8": {},
    },
    playoffsFreq: {},
    stage3Freq: {},
    stage2Freq: {},
    totalSims: numSimulations,
  };

  const getPastAndScheduled = (stage: string) => {
    const pastMatches: any[] = [];
    const scheduledMatches: any[] = [];
    const stageMatchesMap = currentMatches[stage] || {};

    Object.values(stageMatchesMap).forEach((batch: any) => {
      batch.forEach((m: any) => {
        if (
          m.team1Id &&
          m.team2Id &&
          m.team1Id !== "tbd" &&
          m.team2Id !== "tbd"
        ) {
          let hasResult = false;
          if (m.score1 !== undefined && m.score2 !== undefined) {
            if (m.format === "bo1" && (m.score1 === 1 || m.score2 === 1))
              hasResult = true;
            else if (m.format === "bo3" && (m.score1 === 2 || m.score2 === 2))
              hasResult = true;
            else if (m.format === "bo5" && (m.score1 === 3 || m.score2 === 3))
              hasResult = true;
          }
          if (hasResult) {
            const winner = m.score1 > m.score2 ? m.team1Id : m.team2Id;
            pastMatches.push({ t1: m.team1Id, t2: m.team2Id, winner });
          } else {
            scheduledMatches.push({ t1: m.team1Id, t2: m.team2Id });
          }
        }
      });
    });

    return { pastMatches, scheduledMatches };
  };

  const s1M = getPastAndScheduled("stage1");
  const s2M = getPastAndScheduled("stage2");
  const s3M = getPastAndScheduled("stage3");
  const playoffsM = getPastAndScheduled("playoffs");

  const startT1 = TEAMS.filter((t) => t.startStage === 1).map((t) => t.id);
  const startT2 = TEAMS.filter((t) => t.startStage === 2).map((t) => t.id);
  const startT3 = TEAMS.filter((t) => t.startStage === 3).map((t) => t.id);

  const s1Advanced =
    computedActuals["stage1"]
      ?.filter((a: any) => a.type === "advance" || a.type === "3-0")
      .map((a: any) => a.teamId) || [];
  const s2Advanced =
    computedActuals["stage2"]
      ?.filter((a: any) => a.type === "advance" || a.type === "3-0")
      .map((a: any) => a.teamId) || [];
  const s3Advanced =
    computedActuals["stage3"]
      ?.filter((a: any) => a.type === "advance" || a.type === "3-0")
      .map((a: any) => a.teamId) || [];

  const inc = (obj: any, key: string) => {
    if (!obj[key]) obj[key] = 0;
    obj[key]++;
  };
  const incSlot = (obj: any, slot: string, team: string) => {
    if (!obj[slot][team]) obj[slot][team] = 0;
    obj[slot][team]++;
  };

  const getStageSeeds = (directTeams: string[], advancingTeams: string[]) => {
    const seeds: Record<string, number> = {};
    const sortedDirect = [...directTeams].sort(
      (a, b) => (GLOBAL_SEEDING[a] || 99) - (GLOBAL_SEEDING[b] || 99),
    );
    let seedVal = 1;
    for (const t of sortedDirect) seeds[t] = seedVal++;
    for (const t of advancingTeams) seeds[t] = seedVal++;
    return seeds;
  };

  for (let i = 0; i < numSimulations; i++) {
    if (i % 100 === 0)
      onProgress(Math.min(100, Math.floor((i / numSimulations) * 100)));

    let advance1 = s1Advanced;
    let s1SeedsResult: string[] = [];
    if (advance1.length < 8) {
      const s1Seeds = getStageSeeds(startT1, []);
      const s1res = simulateOneStage(
        "stage1",
        startT1,
        s1M.pastMatches,
        s1M.scheduledMatches,
        teamStrengths,
        s1Seeds,
      );
      advance1 = s1res.advanced;
      s1SeedsResult = s1res.seeds;
    } else {
      s1SeedsResult = [...advance1];
    }

    advance1.forEach((t: string) => inc(res.stage2Freq, t));

    let advance2 = s2Advanced;
    let s2SeedsResult: string[] = [];
    if (advance2.length < 8 && advance1.length === 8) {
      const stage2Teams = [...advance1, ...startT2];
      const s2SeedsMap = getStageSeeds(startT2, s1SeedsResult);
      const s2res = simulateOneStage(
        "stage2",
        stage2Teams,
        s2M.pastMatches,
        s2M.scheduledMatches,
        teamStrengths,
        s2SeedsMap,
      );
      advance2 = s2res.advanced;
      s2SeedsResult = s2res.seeds;
    } else {
      s2SeedsResult = [...advance2];
    }

    advance2.forEach((t: string) => inc(res.stage3Freq, t));

    let advance3 = s3Advanced;
    let seeds = [...advance3];
    if (advance3.length < 8 && advance2.length === 8) {
      const stage3Teams = [...advance2, ...startT3];
      const s3SeedsMap = getStageSeeds(startT3, s2SeedsResult);
      const s3res = simulateOneStage(
        "stage3",
        stage3Teams,
        s3M.pastMatches,
        s3M.scheduledMatches,
        teamStrengths,
        s3SeedsMap,
      );
      advance3 = s3res.advanced;
      seeds = s3res.seeds;
    }

    advance3.forEach((t: string) => inc(res.playoffsFreq, t));

    if (advance3.length === 8) {
      const pRes = simulatePlayoffs(
        seeds,
        playoffsM.pastMatches,
        playoffsM.scheduledMatches,
        teamStrengths,
      );

      if (pRes.qf.length === 8) {
        incSlot(res.qfFreq, "qf-1", pRes.qf[0]);
        incSlot(res.qfFreq, "qf-2", pRes.qf[1]);
        incSlot(res.qfFreq, "qf-3", pRes.qf[2]);
        incSlot(res.qfFreq, "qf-4", pRes.qf[3]);
        incSlot(res.qfFreq, "qf-5", pRes.qf[4]);
        incSlot(res.qfFreq, "qf-6", pRes.qf[5]);
        incSlot(res.qfFreq, "qf-7", pRes.qf[6]);
        incSlot(res.qfFreq, "qf-8", pRes.qf[7]);
      }

      if (pRes.sf.length === 4) {
        incSlot(res.sfFreq, "sf-1", pRes.sf[0]);
        incSlot(res.sfFreq, "sf-2", pRes.sf[1]);
        incSlot(res.sfFreq, "sf-3", pRes.sf[2]);
        incSlot(res.sfFreq, "sf-4", pRes.sf[3]);
      }

      if (pRes.final.length === 2) {
        incSlot(res.finalFreq, "final-1", pRes.final[0]);
        incSlot(res.finalFreq, "final-2", pRes.final[1]);
      }

      if (pRes.champion) {
        inc(res.championFreq, pRes.champion);
      }
    }
  }

  onProgress(100);
  return res;
}
