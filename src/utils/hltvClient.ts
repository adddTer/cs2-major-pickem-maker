import https from "node:https";

export async function fetchHltv(path: string) {
  let currentPath = path;
  
  for (let i = 0; i < 3; i++) {
    const options = {
      hostname: 'www.hltv.org',
      port: 443,
      path: currentPath,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      }
    };
    
    const { status, headers, data } = await new Promise((resolve, reject) => {
        const hreq = https.request(options, (hres) => {
          let text = '';
          hres.on('data', (d) => { text += d; });
          hres.on('end', () => resolve({ status: hres.statusCode, headers: hres.headers, data: text }));
        });
        hreq.on('error', reject);
        hreq.end();
    });
    
    if (status === 301 || status === 302 || status === 307 || status === 308) {
        currentPath = headers.location;
        continue;
    }
    
    return data;
  }
}
