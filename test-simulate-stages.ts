import { simulateSwiss } from './src/utils/simulateSwiss';
import { fetchAndPatchCSGOData } from './src/utils/fetchE5Data';
import { MATCHES } from './src/data/matches';
import { TEAMS } from './src/data/teams';

async function run() {
    await fetchAndPatchCSGOData();
    for (const stage of ['stage1', 'stage2', 'stage3', 'playoffs']) {
        const stageMatchesMap = MATCHES[stage];
        const allTeamsSet = new Set<string>();
        if (stage === 'playoffs') {
            ['qf', 'sf', 'final'].forEach(r => {
                (stageMatchesMap[r] || []).forEach((m: any) => {
                    if (m.team1Id && m.team1Id !== 'tbd') allTeamsSet.add(m.team1Id);
                    if (m.team2Id && m.team2Id !== 'tbd') allTeamsSet.add(m.team2Id);
                });
            });
        } else {
            Object.values(stageMatchesMap).forEach(batch => {
                (batch as any[]).forEach(m => {
                    if (m.team1Id && m.team1Id !== 'tbd') allTeamsSet.add(m.team1Id);
                    if (m.team2Id && m.team2Id !== 'tbd') allTeamsSet.add(m.team2Id);
                });
            });
        }
        const allTeams = Array.from(allTeamsSet);
        console.log(`\nStage: ${stage}, Teams: ${allTeams.length}`);
        const names = allTeams.map(id => TEAMS.find(t => t.id === id)?.name || id).join(', ');
        console.log(names);
    }
}

run();

