import https from 'https';
https.get('https://arena.5eplay.com/api/v1/user/competitions/8301', {
  headers: {
      'User-Agent': 'Mozilla/5.0'
  }
}, (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
        const json = JSON.parse(data);
        console.log("Groups:", json.data[1].groups[0].id);
        const g = JSON.parse(json.data[1].groups[0].graph);
        const eb = g?.sEB?.EB;
        console.log("Found EB:", !!eb);
        console.log("Rounds:", eb?.rounds?.length);
    } catch(e) { console.error("Error parsing...", data.substring(0, 100)); }
  });
});
