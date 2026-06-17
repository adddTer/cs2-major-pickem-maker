import https from "https";

const options = {
  hostname: 'api.steampowered.com',
  port: 443,
  path: `/ICSGOTournaments_730/GetTournamentPredictions/v1?event=22&steamid=76561199076230314&steamidkey=6TE7-HL9HY-C9MB`,
  method: 'GET',
  headers: {
    'User-Agent': 'Valve/Steam HTTP Client 1.0 (730)'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log(`STATUS: ${res.statusCode} HEAD: ${body.substring(0, 100)}`); });
});
req.end();
