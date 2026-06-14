import express from "express";
import path from "path";
import https from "node:https";
import { createServer as createViteServer } from "vite";

async function fetchHltv(pathUrl: string): Promise<string> {
  let currentPath = pathUrl;
  
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
    
    const res: any = await new Promise((resolve, reject) => {
        const hreq = https.request(options, (hres) => {
          let text = '';
          hres.on('data', (d) => { text += d; });
          hres.on('end', () => resolve({ status: hres.statusCode, headers: hres.headers, data: text }));
        });
        hreq.on('error', reject);
        hreq.end();
    });
    
    if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
        currentPath = res.headers.location;
        continue;
    }
    
    return res.data;
  }
  return "";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/hltv-rankings", async (req, res) => {
    try {
      const [valveHtml, hltvHtml] = await Promise.all([
         fetchHltv(`/valve-ranking/teams`),
         fetchHltv(`/ranking/teams/`)
      ]);
      
      const valveTeams: any[] = [];
      const hltvTeams: any[] = [];
      const blockRegex = /<span class="position[^>]*>#(\d+)<\/span>[\s\S]*?<span class="name">([^<]+)<\/span>[\s\S]*?<span class="points">\(([\d,]+)[\s\S]*?points\)<\/span>/g;
      
      let match;
      while ((match = blockRegex.exec(valveHtml)) !== null) {
        valveTeams.push({
          rank: parseInt(match[1], 10),
          name: match[2].trim(),
          points: parseInt(match[3].replace(/,/g, ''), 10)
        });
      }

      // Reset regex index for the second string
      blockRegex.lastIndex = 0;
      while ((match = blockRegex.exec(hltvHtml)) !== null) {
        hltvTeams.push({
          rank: parseInt(match[1], 10),
          name: match[2].trim(),
          points: parseInt(match[3].replace(/,/g, ''), 10)
        });
      }
      
      if (valveTeams.length < 20 || hltvTeams.length < 20) {
        res.status(500).json({ success: false, valve: valveTeams, hltv: hltvTeams, error: "Failed to parse rankings" });
        return;
      }

      res.json({ success: true, valve: valveTeams, hltv: hltvTeams });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, valve: [], hltv: [], error: e.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
