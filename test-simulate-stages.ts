import { simulateSwiss } from './src/utils/simulateSwiss';
import { fetchAndPatchCSGOData } from './src/utils/fetchE5Data';
import { MATCHES } from './src/data/matches';

async function run() {
    await fetchAndPatchCSGOData();
    for (const stage of ['stage1', 'stage2', 'stage3']) {
        const stageMatchesMap = MATCHES[stage];
        const allTeamsSet = new Set<string>();
        Object.values(stageMatchesMap).forEach(batch => {
            batch.forEach(m => {
                if (m.team1Id) allTeamsSet.add(m.team1Id);
                if (m.team2Id) allTeamsSet.add(m.team2Id);
            });
        });
        const allTeams = Array.from(allTeamsSet);
        console.log(`Stage: ${stage}, Teams: ${allTeams.length}`);
    }
}

run();
