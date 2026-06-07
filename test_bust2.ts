const url = `https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/csgo_tt_9029/stages?timestamp=${Date.now()}`;
fetch(url).then(r => r.headers.forEach((v, k) => console.log(k, v)));
