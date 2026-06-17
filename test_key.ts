import https from "https";

const options = {
  hostname: 'api.steampowered.com',
  port: 443,
  path: `/ISteamUser/GetPlayerSummaries/v0002/?steamids=76561198000000000`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log(`STATUS: ${res.statusCode} HEAD: ${body.substring(0, 100)}`); });
});
req.end();
