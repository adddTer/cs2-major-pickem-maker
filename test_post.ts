const url = 'https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/csgo_tt_9029/stages?_t=' + Date.now();
fetch(url, { method: 'POST' }).then(async r => {
  console.log('POST status:', r.status);
});

fetch(url, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } }).then(async r => {
  console.log('Headers status:', r.status);
  console.log('Headers via:', r.headers.get('via'));
});
