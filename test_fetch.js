import https from 'https';

https.get('https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/csgo_tt_8301/stages', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
        const json = JSON.parse(data);
        const g = JSON.parse(json.data[1].groups[0].graph);
        const eb = g.sEB.EB;
        console.log(eb.rounds[0].matches);
    } catch(e) { console.error(e.message); }
  });
});
