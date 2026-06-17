import https from "https";

const events = [19, 20, 21, 22, 23, 24, 25];

events.forEach(event => {
  const options = {
    hostname: 'api.steampowered.com',
    port: 443,
    path: `/ICSGOTournaments_730/GetTournamentPredictions/v1?event=${event}&steamid=76561199076230314&steamidkey=6TE7-HL9HY-C9MB&key=536BF84F671FD4E5733F314B0A2B76E1`,
    method: 'GET'
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => { console.log(`EVENT ${event} STATUS: ${res.statusCode} BODY: ${body.substring(0, 100)}`); });
  });
  req.end();
});
