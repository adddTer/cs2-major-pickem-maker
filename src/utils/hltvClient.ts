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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.hltv.org/'
      }
    };
    
    const { status, headers, data } = await new Promise<{status: number | undefined, headers: any, data: string}>((resolve, reject) => {
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
        if (currentPath.startsWith('http')) {
            currentPath = new URL(currentPath).pathname;
        }
        continue;
    }
    
    return data;
  }
}
