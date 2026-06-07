const url = 'https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/csgo_tt_9029/stages?_t=' + Date.now();
fetch(url).then(async r => {
  r.headers.forEach((v, k) => console.log(k, v));
});
