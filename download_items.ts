import https from "https";
import fs from "fs";

const options = {
  hostname: 'raw.githubusercontent.com',
  port: 443,
  path: `/SteamDatabase/GameTracking-CS2/master/game/csgo/scripts/items/items_game.txt`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { 
    fs.writeFileSync('items_game.txt', body);
    console.log("Downloaded items_game.txt");
  });
});
req.on('error', (e) => {
  console.error(e);
});
req.end();
