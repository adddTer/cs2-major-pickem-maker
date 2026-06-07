import https from 'https';

https.get('https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/csgo_tt_9029/stages?_t=1', (res) => {
  console.log('CDN Domain Headers:');
  console.log(res.headers);
});

https.get('https://esports.5eplay.com/api/csgo/tournaments/csgo_tt_9029/stages?_t=1', (res) => {
  console.log('Main Domain Headers:');
  console.log(res.headers);
}).on('error', e => console.error(e));
