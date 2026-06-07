const url3 = 'https://esports.5eplay.com/api/csgo/tournaments/csgo_tt_9029/stages';
fetch(url3).then(r => console.log('esports.5eplay status:', r.status)).catch(e => console.log('esports failed'));
