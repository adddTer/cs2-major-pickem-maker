[
  'https://app-api.5eplay.com/v1/api/csgo/tournaments/csgo_tt_9029/stages',
  'https://api.5eplay.com/v1/api/csgo/tournaments/csgo_tt_9029/stages',
  'https://m.5eplay.com/api/csgo/tournaments/csgo_tt_9029/stages'
].forEach(url => {
  fetch(url).then(r => console.log(url, r.status)).catch(e => console.log(url, 'FAILED'));
});
