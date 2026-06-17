import https from "https";

const options = {
  hostname: 'api.steampowered.com',
  port: 443,
  path: `/ICSGOTournaments_730/GetTournamentPredictions/v1?event=22&steamid=0&steamidkey=https://help.steampowered.com/en/wizard/HelpWithGameIssue/?appid=730&issueid=128`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log(`BODY: ${body.substring(0, 200)}`); });
});
req.end();
