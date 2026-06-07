const base = 'https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/csgo_tt_9029/stages';
const urls = [
  `${base}?timestamp=${Date.now()}`,
  `${base}?v=${Date.now()}`,
  `${base}?rnd=${Date.now()}`,
  `${base}?_5e=${Date.now()}`
];

urls.forEach(url => {
  fetch(url).then(r => console.log(url, r.headers.get('x-cache')));
});
