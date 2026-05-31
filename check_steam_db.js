import https from 'https';

const teams = ['vitality', 'navi', 'parivision', 'aurora', 'falcons', 'mouz', 'furia', 'mongolz', 'spirit', 'astralis', 'g2', 'fut', 'monte', '9z', 'pain', 'legacy', 'gamerlegion', 'big', 'betboom', 'b8', 'heroic', 'sinners', 'm80', 'nrg', 'sharks', 'gaimin', 'mibr', 'liquid', 'tyloo', 'lynn_vision', 'flyquest'];

async function checkUrl(url) {
  return new Promise(resolve => {
    https.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

(async () => {
  for (const team of teams) {
    const url = `https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/game/csgo/pak01_dir/materials/panorama/images/tournaments/teams/${team}.svg`;
    const ok = await checkUrl(url);
    if (!ok) {
       console.log('Miss: ' + team);
    }
  }
})();
