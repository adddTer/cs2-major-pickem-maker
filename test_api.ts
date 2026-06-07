const url = 'https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/csgo_tt_9029/stages?_t=1';
fetch(url).then(r => console.log('CDN status:', r.status)).catch(e => console.error(e));

const url2 = 'https://esports-data.5eplay.com/v1/api/csgo/tournaments/csgo_tt_9029/stages?_t=1';
fetch(url2).then(r => console.log('Main status:', r.status)).catch(e => console.log('Main failed'));
