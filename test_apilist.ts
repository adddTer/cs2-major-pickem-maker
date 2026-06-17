import https from "https";

const options = {
  hostname: 'api.steampowered.com',
  port: 443,
  path: `/ISteamWebAPIUtil/GetSupportedAPIList/v1/`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { 
    if (body.includes("GetTournamentPredictions")) {
      const match = body.match(/.{0,200}GetTournamentPredictions.{0,300}/g);
      console.log(match);
    } else {
      console.log("No GetTournamentPredictions found in API list.");
    }
  });
});
req.end();
