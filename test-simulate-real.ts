import { simulateSwiss } from './src/utils/simulateSwiss';
import { fetchAndPatchCSGOData } from './src/utils/fetchE5Data';
import { MATCHES } from './src/data/matches';

async function run() {
    await fetchAndPatchCSGOData();
    const stageMatchesMap = MATCHES['stage1'];
    
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
    console.log("Teams:", allTeams.length);
    console.log("Past matches:", pastMatches.length);
    console.log("Scheduled matches:", scheduledMatches.length);

    if (allTeams.length !== 16) {
        console.log("Not exactly 16 teams. Exiting test.");
        return;
    }

    const start = Date.now();
    const res = simulateSwiss(allTeams, pastMatches, scheduledMatches, 1000); // 1000 just to test
    console.log("Done 1000 in", Date.now() - start, "ms");
}

run();
