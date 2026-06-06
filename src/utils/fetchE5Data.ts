import { MATCHES, ACTUAL_RESULTS } from "../data/matches";
import { PickSlot, Team } from "../types";
import { TEAMS } from "../data/teams";

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
        .replace(/^team\s+/i, "")
        .replace(/\s+/g, "");

    const t1NameClean = cleanStr(t1.nameEn || t1.nameZh || t1.name || "");
    const t1AbbrClean = cleanStr(t1.abbrEn || t1.abbrZh || t1.tag || "");
    const tNameClean = cleanStr(t.name);

    return (
      idLower === t1NameClean ||
      shortLower === t1AbbrClean ||
      idLower === t1AbbrClean ||
      tNameClean === t1NameClean ||
      t1NameClean.includes(idLower) ||
      idLower.includes(t1NameClean) ||
      (t1AbbrClean &&
        (shortLower.includes(t1AbbrClean) || t1AbbrClean.includes(shortLower)))
    );
  });

  if (matched) {
    // Cache it
    if (t1.absId) E5_TEAM_MAP[t1.absId] = matched.id;
    return matched.id;
  }
  return undefined;
}

function parseSwissGraph(stageData: any) {
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
          m.format === "3" ? "bo3" : m.format === "5" ? "bo5" : "bo1";
        const matchObj: any = { 
          externalId: m.absId || m.id || m.matchId || m.match_id, 
          team1Id: t1Id, 
          team2Id: t2Id, 
          format, 
          status: m.status 
        };

        if (m.status === "past" || m.status === "live") {
          if (format === "bo1") {
            const map1 = parseInt(m.t1Score, 10) || 0;
            const map2 = parseInt(m.t2Score, 10) || 0;
            if (m.status === "past") {
              matchObj.score1 = map1 > map2 ? 1 : 0;
              matchObj.score2 = map2 > map1 ? 1 : 0;
            } else {
              matchObj.score1 = 0;
              matchObj.score2 = 0;
            }
            matchObj.maps = [{ score1: map1, score2: map2 }];
          } else {
            if (m.status === "past") {
              matchObj.score1 = parseInt(m.t1Score, 10) || 0;
              matchObj.score2 = parseInt(m.t2Score, 10) || 0;
            } else {
              matchObj.score1 = 0;
              matchObj.score2 = 0;
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

export async function fetchAndPatchCSGOData() {
  try {
    const fetchStage = async (id: string) => {
      const res = await fetch(
        `https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/${id}/stages`,
      );
      return await res.json();
    };

    const [r9028, r9029, r8301] = await Promise.all([
      fetchStage("csgo_tt_9028"),
      fetchStage("csgo_tt_9029"),
      fetchStage("csgo_tt_8301"),
    ]);

    if (r9028?.success && r9028.data?.[0]) {
      const s1 = parseSwissGraph(r9028.data[0]);
      if (s1) MATCHES.stage1 = s1;
    }

    if (r9029?.success && r9029.data?.[0]) {
      const s2 = parseSwissGraph(r9029.data[0]);
      if (s2) MATCHES.stage2 = s2;
    }

    if (r8301?.success) {
      // Stage 3 (Elimination stage which is actually the first swiss in 8301)
      if (r8301.data?.[0]) {
        const s3 = parseSwissGraph(r8301.data[0]);
        if (s3) MATCHES.stage3 = s3;
      }

      // Playoffs (sEB bracket in 8301)
      if (r8301.data?.[1]?.groups?.[0]?.graph) {
        try {
          const g = JSON.parse(r8301.data[1].groups[0].graph);
          const eb = g?.sEB?.EB;
          if (eb && eb.matches && eb.rounds) {
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

                const matchObj: any = {
                  externalId: m.absId || m.id || m.matchId,
                  team1Id: t1Id,
                  team2Id: t2Id,
                  format: "bo3",
                  status: m.status,
                };
                matchObj.time = undefined;
                if (m.status === "past") {
                  matchObj.score1 = parseInt(m.t1Score, 10) || 0;
                  matchObj.score2 = parseInt(m.t2Score, 10) || 0;
                } else if (m.status === "live") {
                  matchObj.score1 = 0;
                  matchObj.score2 = 0;
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

    return true;
  } catch (err) {
    console.error("Failed to fetch E5 data:", err);
    return false;
  }
}
