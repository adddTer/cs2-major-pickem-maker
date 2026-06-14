import https from 'https';
https.get('https://app-api.5eplay.com/v1/api/csgo/tournaments/csgo_tt_8302/stages', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
