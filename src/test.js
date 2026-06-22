import fetch from "node-fetch";

fetch('https://esports-data.5eplaycdn.com/v1/api/csgo/matches/csgo_mc_2414748/data').then(r => r.json()).then(data => {
  console.log('result t1', data.data?.result?.t1_name);
  console.log('result t2', data.data?.result?.t2_name);
  console.log('team1 stats id', data.data?.bouts_state?.[0]?.t1_stats?.team_id);
  console.log('team2 stats id', data.data?.bouts_state?.[0]?.t2_stats?.team_id);
  console.log('result t1 id', data.data?.result?.team1_id);
  console.log('result t2 id', data.data?.result?.team2_id);
});
