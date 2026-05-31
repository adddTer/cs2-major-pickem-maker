import https from 'https';

https.get('https://liquipedia.net/counterstrike/Perfect_World/Major/2024/Shanghai', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const urls = [...new Set(Array.from(data.matchAll(/src="(\/commons\/images\/[^"]+)"/g)).map(m => m[1]))];
    console.log(urls.filter(u => u.includes('logo') || u.includes('Team')).join('\n'));
  });
}).on('error', console.error);
