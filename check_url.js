import https from 'https';

async function checkUrl(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve(res.statusCode);
    }).on('error', () => resolve(0));
  });
}

(async () => {
    console.log(await checkUrl('https://liquipedia.net/commons/images/a/a2/Team_Vitality_logo.png'));
})();
