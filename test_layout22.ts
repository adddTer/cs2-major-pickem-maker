import https from "https";

const options = {
  hostname: 'api.steampowered.com',
  port: 443,
  path: `/ICSGOTournaments_730/GetTournamentLayout/v1?event=22&key=536BF84F671FD4E5733F314B0A2B76E1`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log(JSON.stringify(JSON.parse(body), null, 2).substring(0, 500)); });
});
req.end();
