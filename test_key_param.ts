import https from "https";

const options = {
  hostname: 'api.steampowered.com',
  port: 443,
  path: `/ICSGOTournaments_730/GetTournamentPredictions/v1?event=22&steamid=76561199076230314&key=6TE7-HL9HY-C9MB`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log(`STATUS: ${res.statusCode} HEAD: ${body.substring(0, 100)}`); });
});
req.end();
