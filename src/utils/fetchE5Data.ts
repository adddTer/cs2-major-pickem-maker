import { MATCHES, ACTUAL_RESULTS } from "../data/matches";
import { PickSlot, Team, TournamentEvent } from "../types";
import { TEAMS } from "../data/teams";
import { GLOBAL_SEEDING } from "../data/seedings";
import { LOCAL_POINTS, getLocalStrength } from "../data/localPoints";

export const E5_TEAM_MAP: Record<string, string> = {
  // Stage 3
  csgo_tm_7185: "vitality",
  csgo_tm_4608: "navi",
  hltv_team_12414: "parivision",
  hltv_team_11811: "aurora",
  hltv_team_11271: "falcons",
  csgo_tm_4494: "mouz",
  csgo_tm_8135: "furia",
  csgo_tm_6248: "mongolz",

  // Stage 2
  csgo_tm_7020: "spirit",
  csgo_tm_6665: "astralis",
  csgo_tm_5995: "g2",
  hltv_team_11835: "fut",
  hltv_team_11811_monte: "monte",
  csgo_tm_9996: "9z",
  csgo_tm_4773: "pain",
  hltv_team_12468: "legacy",

  // Stage 1
  csgo_tm_9928: "gamerlegion",
  csgo_tm_7532: "big",
  hltv_team_12394: "betboom",
  csgo_tm_11241: "b8",
  csgo_tm_7175: "heroic",
  csgo_tm_10577: "sinners",
  hltv_team_12376: "m80",
  csgo_tm_6673: "nrg",
  csgo_tm_8113: "sharks",
  csgo_tm_11571: "gaimin",
  csgo_tm_9215: "mibr",
  csgo_tm_5973: "liquid",
  csgo_tm_4863: "tyloo",
  csgo_tm_8840: "lynn",
  hltv_team_13486: "thunder",
  hltv_team_12774: "flyquest",
  hltv_team_9999999: "tbd",
};

function getTeamId(t1: any): string | undefined {
  if (!t1) return undefined;
  if (t1.absId && E5_TEAM_MAP[t1.absId]) return E5_TEAM_MAP[t1.absId];

  // Dynamic matching
  const matched = TEAMS.find((t) => {
    const idLower = t.id.toLowerCase();
    const shortLower = t.shortName.toLowerCase();

    const cleanStr = (s: string) =>
      s
        .toLowerCase()
        .replace(/^(team|the)\s+/i, "")
        .replace(/\s+(esports|gaming|club)$/i, "")
        .replace(/\s+/g, "");

    const t1NameClean = cleanStr(t1.nameEn || t1.nameZh || t1.name || "");
    const t1AbbrClean = cleanStr(t1.abbrEn || t1.abbrZh || t1.tag || "");
    const tNameClean = cleanStr(t.name);

    return (
      idLower === t1NameClean ||
      tNameClean === t1NameClean ||
      (t1AbbrClean && (shortLower === t1AbbrClean || idLower === t1AbbrClean))
    );
  });

  if (matched) {
    // Cache it
    if (t1.absId) E5_TEAM_MAP[t1.absId] = matched.id;
    return matched.id;
  }
  return undefined;
}

function parseSwissGraph(
  stageData: any,
  matchesMap: Record<string, { plan_ts?: string; star?: number }> = {},
  oldMatchesMap: Record<string, any[]> = {},
  isStage3: boolean = false,
  isSwissAllBo3: boolean = false
) {
  let graphData: any = {};
  try {
    graphData = JSON.parse(stageData.groups[0].graph);
  } catch (e) {
    return null;
  }
  const swiss = graphData.swiss;
  if (!swiss) return null;

  const newMatches: Record<string, any[]> = {
    "0:0": [],
    "1:0": [],
    "0:1": [],
    "2:0": [],
    "1:1": [],
    "0:2": [],
    "2:1": [],
    "1:2": [],
    "2:2": [],
  };

  const GROUP_TO_BRACKET: Record<string, Record<string, string>> = {
    r1: { groupAll: "0:0" },
    r2: { groupHigh: "1:0", groupLow: "0:1" },
    r3: { groupHigh: "2:0", groupMid: "1:1", groupLow: "0:2" },
    r4: { groupHigh: "2:1", groupLow: "1:2" },
    r5: { groupAll: "2:2", groupMid: "2:2" },
  };

  const rounds = ["r1", "r2", "r3", "r4", "r5"];
  rounds.forEach((r) => {
    const roundData = swiss[r];
    if (!roundData) return;

    ["groupAll", "groupLow", "groupMid", "groupHigh"].forEach((gKey) => {
      const group = roundData[gKey];
      if (!group || !group.matches) return;

      const bracket = group.name
        ? group.name.replace("-", ":")
        : GROUP_TO_BRACKET[r]?.[gKey];
      if (!bracket) return;

      group.matches.forEach((m: any) => {
        const t1Id = getTeamId(m.t1);
        const t2Id = getTeamId(m.t2);
        if ((!t1Id && !t2Id) || (t1Id === "tbd" && t2Id === "tbd")) return;

        const format =
          (isStage3 || isSwissAllBo3) ? "bo3" : (m.format === "3" ? "bo3" : m.format === "5" ? "bo5" : "bo1");
        const externalId = m.absId || m.id || m.matchId || m.match_id;

        let matchTime =
          m.time || m.start_time || m.startTime || m.scheduledTime;
        let star = 0;

        let tags;
        if (externalId && matchesMap[externalId]) {
          if (matchesMap[externalId].plan_ts) {
            matchTime = matchesMap[externalId].plan_ts;
          }
          star = matchesMap[externalId].star || 0;
          if ((matchesMap[externalId] as any).tags) {
            tags = (matchesMap[externalId] as any).tags;
          }
        }

        let matchObj: any = {
          externalId,
          team1Id: t1Id,
          team2Id: t2Id,
          format,
          status: m.status,
          time: matchTime,
          star: star,
        };

        if (tags) {
          matchObj.tags = tags;
        }

        if (oldMatchesMap && oldMatchesMap[bracket]) {
          const oldM = oldMatchesMap[bracket].find(
            (om: any) => om.team1Id === t1Id && om.team2Id === t2Id
          );
          if (oldM) {
            const os = oldM.status;
            const ns = matchObj.status;
            // Prevent reverting from live/past to upcoming(-1, 0, or undef)
            if ((os === "live" || os === "past") && (ns === "-1" || ns === "0" || !ns)) {
              matchObj = oldM; 
            } else if (os === "past" && ns === "live") {
              matchObj = oldM;
            }
          }
        }

        if (matchObj.status === "past" || matchObj.status === "live") {
          if (format === "bo1") {
            const map1 = parseInt(m.t1Score, 10) || 0;
            const map2 = parseInt(m.t2Score, 10) || 0;
            if (matchObj.status === "past") {
              matchObj.score1 = map1 > map2 ? 1 : 0;
              matchObj.score2 = map2 > map1 ? 1 : 0;
            } else {
              matchObj.score1 = 0;
              matchObj.score2 = 0;
            }
            matchObj.maps = [{ score1: map1, score2: map2 }];
          } else {
            let s1 = parseInt(m.t1Score, 10) || 0;
            let s2 = parseInt(m.t2Score, 10) || 0;
            if (s1 > 3 || s2 > 3) {
              if (matchObj.status === "past") {
                s1 = s1 > s2 ? 2 : 0;
                s2 = s2 > s1 ? 2 : 0;
              } else {
                s1 = 0;
                s2 = 0;
              }
            }
            matchObj.score1 = s1;
            matchObj.score2 = s2;

            const maps = [];
            if (m.t1?.bo1Score || m.t2?.bo1Score)
              maps.push({
                score1: parseInt(m.t1?.bo1Score, 10) || 0,
                score2: parseInt(m.t2?.bo1Score, 10) || 0,
              });
            if (m.t1?.bo2Score || m.t2?.bo2Score)
              maps.push({
                score1: parseInt(m.t1?.bo2Score, 10) || 0,
                score2: parseInt(m.t2?.bo2Score, 10) || 0,
              });
            if (m.t1?.bo3Score || m.t2?.bo3Score)
              maps.push({
                score1: parseInt(m.t1?.bo3Score, 10) || 0,
                score2: parseInt(m.t2?.bo3Score, 10) || 0,
              });
            if (m.t1?.bo4Score || m.t2?.bo4Score)
              maps.push({
                score1: parseInt(m.t1?.bo4Score, 10) || 0,
                score2: parseInt(m.t2?.bo4Score, 10) || 0,
              });
            if (m.t1?.bo5Score || m.t2?.bo5Score)
              maps.push({
                score1: parseInt(m.t1?.bo5Score, 10) || 0,
                score2: parseInt(m.t2?.bo5Score, 10) || 0,
              });
            if (maps.length > 0 && !matchObj.maps) matchObj.maps = maps;
          }
        }

        if (
          newMatches[bracket] &&
          !(t1Id === undefined && t2Id === undefined)
        ) {
          newMatches[bracket].push(matchObj);
        }
      });
    });
  });

  return newMatches;
}

let globalRankingCacheSuccess = false;

export async function fetchAndPatchCSGOData(currentEvent?: TournamentEvent, isAutoRefresh: boolean = false) {
  try {
    MATCHES.stage1 = {};
    MATCHES.stage2 = {};
    MATCHES.stage3 = {};
    MATCHES.playoffs = {};
    
    // Pre-populate matches natively using TEAMS data so the UI doesn't crash if 5E Play fails
    const initLocalStage = (stageStr: string, stageNum: number) => {
      let stageTeams = TEAMS.filter((t) => t.startStage === stageNum).sort((a,b) => {
        const aRank = LOCAL_POINTS[a.id]?.vRank || GLOBAL_SEEDING[a.id] || 99;
        const bRank = LOCAL_POINTS[b.id]?.vRank || GLOBAL_SEEDING[b.id] || 99;
        return aRank - bRank;
      });
      if (currentEvent && currentEvent.id !== "iem_cologne_2026") {
        stageTeams = [];
      }
      const pool = [...stageTeams.map(t => t.id)];
      // Pad to 16 if necessary
      while (pool.length < 16) pool.push("tbd");
      
      const m00: any[] = [];
      const half = 8;
      for (let i = 0; i < half; i++) {
        m00.push({
          team1Id: pool[i],
          team2Id: pool[i + half],
          format: currentEvent?.isSwissAllBo3 ? "bo3" : "bo1", // overriden in rendering for stage3 natively
          status: "upcoming"
        });
      }
      MATCHES[stageStr] = { "0:0": m00 };
    };
    initLocalStage("stage1", 1);
    initLocalStage("stage2", 2);
    initLocalStage("stage3", 3);

    const fetchStage = async (id: string) => {
      const res = await fetch(
        `https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/${id}/stages?_t=${Date.now()}`,
      );
      return await res.json();
    };

    const fetchEventMatches = async (id: string) => {
      try {
        const res = await fetch(
          `https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/${id}/matches?_t=${Date.now()}`,
        );
        const json = await res.json();
        const map: Record<
          string,
          { plan_ts?: string; star?: number; tags?: string }
        > = {};
        if (json?.data?.matches) {
          json.data.matches.forEach((m: any) => {
            const matchId = m.mc_info ? m.mc_info.id : m.id;
            const matchPlanTs = m.mc_info ? m.mc_info.plan_ts : m.plan_ts;
            const matchStar = m.mc_info ? m.mc_info.star : m.star;

            if (matchId) {
              const val: any = {
                plan_ts: matchPlanTs,
                star: parseInt(matchStar || "0", 10),
              };
              if (m.tags) val.tags = m.tags;
              else if (m.mc_info && m.mc_info.tags) val.tags = m.mc_info.tags;

              map[matchId] = val;
              map[matchId.replace("csgo_mc_", "")] = val;
            }
          });
        }

        try {
          const resExtra = await fetch(
            `https://esports-data.5eplaycdn.com/v1/api/csgo/matches?tt_ids=${id}&limit=100&page=1&_t=${Date.now()}`,
          );
          const jsonExtra = await resExtra.json();
          if (jsonExtra?.data?.matches) {
            jsonExtra.data.matches.forEach((m: any) => {
              const matchId = m.mc_info ? m.mc_info.id : m.id;
              const tags = m.mc_info ? m.mc_info.tags : m.tags;
              if (matchId && tags) {
                if (map[matchId]) map[matchId].tags = tags;
                if (map[matchId.replace("csgo_mc_", "")])
                  map[matchId.replace("csgo_mc_", "")].tags = tags;
              }
            });
          }
        } catch (e) {
          console.error("Failed fetching extra matches for tags", e);
        }

        return map;
      } catch (e) {
        return {};
      }
    };

    const fetchTeamRankings = async () => {
      // Initialize with local data to ensure we have fallback
      TEAMS.forEach(t => {
        const local = LOCAL_POINTS[t.id];
        if (local) {
          t.valveRank = local.vRank;
          t.valvePoints = local.vPoints;
          t.hltvRank = local.hRank;
          t.hltvPoints = local.hPoints;
          t.strength = getLocalStrength(t.id);
        } else {
          t.valveRank = undefined;
          t.valvePoints = undefined;
          t.hltvRank = undefined;
          t.hltvPoints = undefined;
          t.strength = undefined;
        }
      });
      
      // If we already succeeded fetching ranking previously, DO NOT fetch again ever.
      if (globalRankingCacheSuccess) return true;
      // If this is an auto refresh from setInterval, DO NOT try to re-fetch ranking if it failed previously to avoid spamming.
      if (isAutoRefresh) return false;

      try {
        const res = await fetch(`/api/hltv-rankings`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            
            const updateLocalData = (items: any[], type: "valve" | "hltv") => {
                if (!Array.isArray(items)) return;
                const updatedIds = new Set<string>();
                items.forEach((teamData: any) => {
                  const name = teamData.name;
                  const id = getTeamId({ nameEn: name, nameZh: name });
                  if (id) {
                    const t = TEAMS.find(x => x.id === id);
                    if (t) {
                      if (type === "valve") {
                          if (!updatedIds.has(id + "_valve") || (t.valveRank !== undefined && teamData.rank < t.valveRank)) {
                              t.valveRank = teamData.rank;
                              t.valvePoints = teamData.points;
                              updatedIds.add(id + "_valve");
                          }
                      } else {
                          if (!updatedIds.has(id + "_hltv") || (t.hltvRank !== undefined && teamData.rank < t.hltvRank)) {
                              t.hltvRank = teamData.rank;
                              t.hltvPoints = teamData.points;
                              updatedIds.add(id + "_hltv");
                          }
                      }
                    }
                  }
                });
            };

            updateLocalData(data.valve, "valve");
            updateLocalData(data.hltv, "hltv");

            console.log("Team rankings fetched successfully from HLTV via API proxy.");
            globalRankingCacheSuccess = true;
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error("Failed to fetch rankings entirely", err);
        return false;
      }
    };

    const s1Id = currentEvent?.stages?.stage1?.externalId;
    const s2Id = currentEvent?.stages?.stage2?.externalId;
    const s3Id = currentEvent?.stages?.stage3?.externalId;

    const fetchPromises: Promise<any>[] = [
      s1Id ? fetchStage(s1Id) : Promise.resolve(null),
      s2Id ? fetchStage(s2Id) : Promise.resolve(null),
      s3Id ? fetchStage(s3Id) : Promise.resolve(null),
      s1Id ? fetchEventMatches(s1Id) : Promise.resolve({}),
      s2Id ? fetchEventMatches(s2Id) : Promise.resolve({}),
      s3Id ? fetchEventMatches(s3Id) : Promise.resolve({}),
      fetchTeamRankings(),
    ];

    const [r9028, r9029, r8301, m9028, m9029, m8301, _rankData] = await Promise.allSettled(fetchPromises).then((results) =>
      results.map((r) => (r.status === "fulfilled" ? r.value : null))
    );

    if (r9028?.success && r9028.data?.[0]) {
      const s1 = parseSwissGraph(r9028.data[0], m9028, MATCHES.stage1, false, currentEvent?.isSwissAllBo3);
      if (s1) MATCHES.stage1 = s1;
    }

    if (r9029?.success && r9029.data?.[0]) {
      const s2 = parseSwissGraph(r9029.data[0], m9029, MATCHES.stage2, false, currentEvent?.isSwissAllBo3);
      if (s2) MATCHES.stage2 = s2;
    }

      if (r8301?.success) {
      if (r8301.data?.[0]) {
        const s3 = parseSwissGraph(r8301.data[0], m8301, MATCHES.stage3, true, currentEvent?.isSwissAllBo3);
        if (s3) {
           MATCHES.stage3 = s3;
        }
      }

      // Playoffs (sEB bracket in 8301)
      if (r8301.data?.[1]?.groups?.[0]?.graph) {
        try {
          const g = JSON.parse(r8301.data[1].groups[0].graph);
          const eb = g?.sEB?.EB;
          if (eb && eb.rounds) {
            const playoffs: Record<string, any[]> = {
              qf: [],
              sf: [],
              final: [],
            };
            const roundDesc = ["qf", "sf", "final"];
            eb.rounds.forEach((r: any, idx: number) => {
              if (!roundDesc[idx]) return;
              const matches = r.matches || [];
              matches.forEach((m: any) => {
                if (!m) {
                  playoffs[roundDesc[idx]].push({});
                  return;
                }
                const t1Id = getTeamId(m.t1);
                const t2Id = getTeamId(m.t2);

                const externalId = m.absId || m.id || m.matchId;
                let matchTime =
                  m.time || m.start_time || m.startTime || m.scheduledTime;
                let star = 0;

                if (externalId && m8301[externalId]) {
                  if (m8301[externalId].plan_ts)
                    matchTime = m8301[externalId].plan_ts;
                  star = m8301[externalId].star || 0;
                }

                let matchObj: any = {
                  externalId,
                  team1Id: t1Id,
                  team2Id: t2Id,
                  format: "bo3",
                  status: m.status,
                  time: matchTime,
                  star: star,
                };

                const currentBracket = roundDesc[idx];
                if (MATCHES.playoffs && MATCHES.playoffs[currentBracket]) {
                  const oldM = MATCHES.playoffs[currentBracket].find(
                    (om: any) => om.team1Id === t1Id && om.team2Id === t2Id
                  );
                  if (oldM) {
                    const os = oldM.status;
                    const ns = matchObj.status;
                    // Prevent reverting from live/past to upcoming(-1, 0, or undef)
                    if ((os === "live" || os === "past") && (ns === "-1" || ns === "0" || !ns)) {
                      matchObj = oldM; 
                    } else if (os === "past" && ns === "live") {
                      matchObj = oldM;
                    }
                  }
                }

                if (
                  externalId &&
                  m8301[externalId] &&
                  (m8301[externalId] as any).tags
                ) {
                  matchObj.tags = (m8301[externalId] as any).tags;
                }
                if (matchObj.status === "past" || matchObj.status === "live") {
                  matchObj.score1 = parseInt(m.t1Score, 10) || 0;
                  matchObj.score2 = parseInt(m.t2Score, 10) || 0;
                }

                const maps = [];
                if (m.t1?.bo1Score || m.t2?.bo1Score)
                  maps.push({
                    score1: parseInt(m.t1?.bo1Score, 10) || 0,
                    score2: parseInt(m.t2?.bo1Score, 10) || 0,
                  });
                if (m.t1?.bo2Score || m.t2?.bo2Score)
                  maps.push({
                    score1: parseInt(m.t1?.bo2Score, 10) || 0,
                    score2: parseInt(m.t2?.bo2Score, 10) || 0,
                  });
                if (m.t1?.bo3Score || m.t2?.bo3Score)
                  maps.push({
                    score1: parseInt(m.t1?.bo3Score, 10) || 0,
                    score2: parseInt(m.t2?.bo3Score, 10) || 0,
                  });
                if (m.t1?.bo4Score || m.t2?.bo4Score)
                  maps.push({
                    score1: parseInt(m.t1?.bo4Score, 10) || 0,
                    score2: parseInt(m.t2?.bo4Score, 10) || 0,
                  });
                if (m.t1?.bo5Score || m.t2?.bo5Score)
                  maps.push({
                    score1: parseInt(m.t1?.bo5Score, 10) || 0,
                    score2: parseInt(m.t2?.bo5Score, 10) || 0,
                  });
                if (maps.length > 0) matchObj.maps = maps;

                playoffs[roundDesc[idx]].push(matchObj);
              });
            });
            // Pre-process playoffs.qf to match structural seeds if stage3 has 8 advanced teams
            const records: Record<string, {w: number, l: number}> = {};
            const played: Record<string, Set<string>> = {};
            
            if (MATCHES.stage3) {
              Object.values(MATCHES.stage3).forEach((arr: any) => {
                arr.forEach((m: any) => {
                  const t1 = m.team1Id;
                  const t2 = m.team2Id;
                  if (t1 && t2 && t1 !== "tbd" && t2 !== "tbd") {
                    if (!records[t1]) records[t1] = {w:0, l:0};
                    if (!records[t2]) records[t2] = {w:0, l:0};
                    if (!played[t1]) played[t1] = new Set();
                    if (!played[t2]) played[t2] = new Set();
                    played[t1].add(t2);
                    played[t2].add(t1);
                    if (m.score1 !== undefined && m.score2 !== undefined && m.score1 !== m.score2) {
                      if (m.score1 > m.score2) { records[t1].w++; records[t2].l++; }
                      else { records[t2].w++; records[t1].l++; }
                    }
                  }
                });
              });
            }

            const getBuchholz = (t: string) => {
              let score = 0;
              for (const opp of (played[t] || [])) {
                if (records[opp]) score += (records[opp].w - records[opp].l);
              }
              return score;
            };

            const advanced = Object.keys(records).filter(t => records[t].w === 3);
            if (advanced.length === 8) {
              const seeds = advanced.sort((a, b) => {
                if (records[a].l !== records[b].l) return records[a].l - records[b].l;
                const bA = getBuchholz(a);
                const bB = getBuchholz(b);
                if (bA !== bB) return bB - bA; // Higher Buchholz is better
                const sA = GLOBAL_SEEDING[a] || 99;
                const sB = GLOBAL_SEEDING[b] || 99;
                return sA - sB; // Lower initial seed is better
              });

              // qfMatchups: 1v8, 4v5, 2v7, 3v6
              const stQf = [
                new Set([seeds[0], seeds[7]]),
                new Set([seeds[3], seeds[4]]),
                new Set([seeds[1], seeds[6]]),
                new Set([seeds[2], seeds[5]])
              ];
              
              let hasTbds = false;
              if (!playoffs.qf || playoffs.qf.length < 4) {
                 hasTbds = true;
              } else {
                 hasTbds = playoffs.qf.some(m => !m.team1Id || !m.team2Id || m.team1Id === "tbd" || m.team2Id === "tbd");
              }
              
              const newQf = Array(4).fill(null);
              if (hasTbds) {
                stQf.forEach((set, idx) => {
                  const arr = Array.from(set);
                  let time = "0";
                  if (playoffs.qf && playoffs.qf[idx]) time = playoffs.qf[idx].time || "0";
                  newQf[idx] = { team1Id: arr[0], team2Id: arr[1], format: "bo3", status: "upcoming", time };
                });
                playoffs.qf = newQf;
              } else if (playoffs.qf && playoffs.qf.length === 4) {
                playoffs.qf.forEach(m => {
                   const mSet = new Set([m.team1Id, m.team2Id]);
                   const idx = stQf.findIndex(s => {
                       const arr = Array.from(s);
                       return mSet.has(arr[0]) && mSet.has(arr[1]);
                   });
                   if (idx !== -1) newQf[idx] = m;
                });
                for (let i = 0; i < 4; i++) {
                   if (!newQf[i]) {
                      newQf[i] = playoffs.qf.find(m => !newQf.includes(m));
                   }
                }
                playoffs.qf = newQf;
              }
            }

            MATCHES.playoffs = playoffs;

            // Derive ACTUAL_RESULTS.playoffs
            const actualPlayoffs: PickSlot[] = [];
            let pId = 1;

            const pushSlot = (
              type: string,
              teamId: string | undefined | null,
            ) => {
              if (teamId && teamId !== "tbd") {
                actualPlayoffs.push({
                  id: `act-p-${pId++}`,
                  type: type as any,
                  teamId: teamId,
                });
              } else {
                pId++; // skip index
              }
            };

            if (playoffs.qf) {
              playoffs.qf.forEach((m) => {
                pushSlot("qf", m.team1Id);
                pushSlot("qf", m.team2Id);
              });
            }
            if (playoffs.sf) {
              playoffs.sf.forEach((m) => {
                pushSlot("sf", m.team1Id);
                pushSlot("sf", m.team2Id);
              });
            }
            if (playoffs.final) {
              playoffs.final.forEach((m) => {
                pushSlot("final", m.team1Id);
                pushSlot("final", m.team2Id);

                // Champion logic: if final is played and has a winner
                if (
                  m.score1 !== undefined &&
                  m.score2 !== undefined &&
                  (m.score1 === 2 || m.score2 === 2)
                ) {
                  pushSlot(
                    "champion",
                    m.score1 > m.score2 ? m.team1Id : m.team2Id,
                  );
                }
              });
            }
            // Assigning to ACTUAL_RESULTS by filtering out the gaps
            // Wait, actualPlayoffs needs to just contain the ones that exist, but how does SummaryView use it?
            // SummaryView actually aligns them via sTypeIdx!
            // Ah! SummaryView does:
            // const sTypeIdx = PLAYOFFS_SLOTS.filter(x => x.type === s.type).findIndex(x => x.id === s.id);
            // teamId: ACTUAL_RESULTS[activeStage]?.filter((x: any) => x.type === s.type)[sTypeIdx]?.teamId
            // This assumes ACTUAL_RESULTS has all slots, even empty ones!

            const actualPlayoffsWithGaps: PickSlot[] = [];
            pId = 1;
            if (playoffs.qf) {
              playoffs.qf.forEach((m) => {
                actualPlayoffsWithGaps.push({
                  id: `act-p-${pId++}`,
                  type: "qf",
                  teamId: m.team1Id === "tbd" ? undefined : m.team1Id,
                });
                actualPlayoffsWithGaps.push({
                  id: `act-p-${pId++}`,
                  type: "qf",
                  teamId: m.team2Id === "tbd" ? undefined : m.team2Id,
                });
              });
            }
            if (playoffs.sf) {
              playoffs.sf.forEach((m) => {
                actualPlayoffsWithGaps.push({
                  id: `act-p-${pId++}`,
                  type: "sf",
                  teamId: m.team1Id === "tbd" ? undefined : m.team1Id,
                });
                actualPlayoffsWithGaps.push({
                  id: `act-p-${pId++}`,
                  type: "sf",
                  teamId: m.team2Id === "tbd" ? undefined : m.team2Id,
                });
              });
            }
            if (playoffs.final) {
              playoffs.final.forEach((m) => {
                actualPlayoffsWithGaps.push({
                  id: `act-p-${pId++}`,
                  type: "final",
                  teamId: m.team1Id === "tbd" ? undefined : m.team1Id,
                });
                actualPlayoffsWithGaps.push({
                  id: `act-p-${pId++}`,
                  type: "final",
                  teamId: m.team2Id === "tbd" ? undefined : m.team2Id,
                });

                if (
                  m.score1 !== undefined &&
                  m.score2 !== undefined &&
                  (m.score1 === 2 || m.score2 === 2)
                ) {
                  actualPlayoffsWithGaps.push({
                    id: `act-p-${pId++}`,
                    type: "champion",
                    teamId: m.score1 > m.score2 ? m.team1Id : m.team2Id,
                  });
                } else {
                  actualPlayoffsWithGaps.push({
                    id: `act-p-${pId++}`,
                    type: "champion",
                    teamId: undefined,
                  });
                }
              });
            }
            ACTUAL_RESULTS.playoffs = actualPlayoffsWithGaps;
          }
        } catch (e) {
          console.error("Failed to parse 8301 Playoffs", e);
        }
      }
    }

    const hasAnySuccess = (r9028?.success) || (r9029?.success) || (r8301?.success);
    const matchSuccess = !!hasAnySuccess || (r9028 !== null || r9029 !== null || r8301 !== null); // If null, it means Promise was rejected
    
    // We explicitly hardcoded fetchTeamRankings to return false for ranking degraded testing
    return { matchSuccess: matchSuccess, rankingSuccess: _rankData === true };
  } catch (err) {
    console.error("Failed to fetch E5 data:", err);
    return { matchSuccess: false, rankingSuccess: false };
  }
}
