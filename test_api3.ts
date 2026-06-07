const url = 'https://esports.5eplay.com/v1/api/csgo/tournaments/csgo_tt_9029/stages';
fetch(url).then(r => console.log('v1 api status:', r.status)).catch(e => console.error(e));
