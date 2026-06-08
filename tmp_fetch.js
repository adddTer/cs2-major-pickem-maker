fetch('https://esports-data.5eplaycdn.com/v1/api/csgo/matches/csgo_mc_2394882/data').then(r=>r.json()).then(d=>console.log(JSON.stringify(d.data.match.bouts_state[0].t1_pr_stats[0])));
