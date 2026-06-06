import { simulateSwiss } from './src/utils/simulateSwiss';
import { TEAMS } from './src/data/teams';

const allTeams = TEAMS.slice(0, 16).map(t => t.id);
console.log("Teams:", allTeams.length);

const start = Date.now();
const res = simulateSwiss(allTeams, [], [], 10000);
console.log("Done 10000 in", Date.now() - start, "ms");
