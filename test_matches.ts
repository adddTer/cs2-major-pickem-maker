const id = 'csgo_tt_9029'
fetch(`https://esports-data.5eplaycdn.com/v1/api/csgo/matches?tt_ids=${id}&limit=1`).then(async r => {
  r.headers.forEach((v, k) => console.log(k, v));
})
