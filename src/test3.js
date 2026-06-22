import fetch from "node-fetch";

async function main() {
  const r8301 = await fetch("https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/8301/stages?_t=1").then(r => r.json());
  const g = JSON.parse(r8301.data[1].groups[0].graph);
  
  const finalMatches = g.sEB.EB.rounds[2].matches;
  console.log(finalMatches);
}
main();
