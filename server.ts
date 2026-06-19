import express from "express";
import path from "path";
import https from "node:https";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

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

  app.get("/api/config/steam", (req, res) => {
    const key = process.env.STEAM_API_KEY;
    const hasKey = key && key.trim().length === 32;
    console.log("Config/Steam API called. Found valid key?", !!hasKey, "Key length:", key?.length);
    res.json({ hasSteamApiKey: !!hasKey });
  });

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
        res.json({ success: false, valve: valveTeams, hltv: hltvTeams, error: "Failed to parse rankings" });
        return;
      }

      res.json({ success: true, valve: valveTeams, hltv: hltvTeams });
    } catch (e: any) {
      console.error(e);
      res.json({ success: false, valve: [], hltv: [], error: e.message });
    }
  });

  app.get("/api/steam-predictions", async (req, res) => {
    try {
      const { key } = req.query;
      if (!key) {
        res.json({ error: "Missing required parameter: key" });
        return;
      }
      
      let event = req.query.event || "22";
      let steamid = "";
      let steamidkey = "";
      let developerkey = ((req.query.developerkey as string) || process.env.STEAM_API_KEY || "").trim();

      const decodedKey = decodeURIComponent(key as string).trim();
      
      // Parse steamid and steamidkey from URL if provided
      if (decodedKey.includes("steamid=") && decodedKey.includes("steamidkey=")) {
        const urlString = decodedKey.startsWith("http") ? decodedKey : `https://api.steampowered.com${decodedKey.startsWith("/") ? "" : "/"}${decodedKey}`;
        try {
          const url = new URL(urlString);
          steamid = url.searchParams.get("steamid")?.trim() || "";
          steamidkey = url.searchParams.get("steamidkey")?.trim() || "";
          event = url.searchParams.get("event")?.trim() || event;
          const urlKey = url.searchParams.get("key")?.trim();
          if (urlKey && urlKey !== "undefined" && urlKey !== "null") {
            developerkey = urlKey;
          }
        } catch (e) {
           // Fallback if URL parsing fails
        }
      } else {
        steamidkey = decodedKey;
      }
      
      if (!steamid && req.query.steamid) {
        steamid = (req.query.steamid as string).trim();
      }

      if (!steamid || steamid === "0") {
        return res.json({ error: "官方接口强制要求提供 Steam ID。请在输入框中填入您的 Steam ID（形如 7656119...）。" });
      }

      // Steam keys are exactly 32 chars of hex. Extra chars might sneak in. Take only alphanumeric.
      developerkey = developerkey.replace(/[^A-Za-z0-9]/g, '');

      if (!developerkey || developerkey.length !== 32) {
        return res.json({ 
          error: `由于没有配置正确的 API Key，调用官方接口失败。当前收到的 Key 长度为 ${developerkey.length}。请配置正确的 32 位 Steam Developer API Key。`,
          needsDeveloperKey: true
        });
      }

      const apiUrl = `https://api.steampowered.com/ICSGOTournaments_730/GetTournamentPredictions/v1?event=${event}&steamid=${steamid}&steamidkey=${steamidkey}&key=${developerkey}`;
      const layoutUrl = `https://api.steampowered.com/ICSGOTournaments_730/GetTournamentLayout/v1?event=${event}&key=${developerkey}`;
      
      const [response, layoutResponse] = await Promise.all([
        fetch(apiUrl),
        fetch(layoutUrl)
      ]);

      const text = await response.text();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const isKeyMissing = !developerkey || developerkey.length !== 32;
          res.json({ 
            error: `Steam API 拒绝访问 (${response.status})。可能是您的 Auth Code 错误/已过期，也可能是 API Key 无效。`,
            needsDeveloperKey: isKeyMissing
          });
          return;
        }
        res.json({ error: `Steam API 报错 (${response.status})。请检查 Steam ID、Auth Code 或是 API Key 是否填写正确。` });
        return;
      }

      let steamData;
      let layoutData;
      try {
        steamData = JSON.parse(text);
        (global as any).lastSteamData = steamData; // Save for debugging
      } catch (err) {
        res.json({ error: "Steam返回了无效的数据格式（意外的网页内容）。请确认填写的鉴权链接正确无误。" });
        return;
      }

      if (layoutResponse.ok) {
        try {
          layoutData = await layoutResponse.json();
        } catch(e) {}
      }

      // Group predictions into our logical stages
      let stage1GroupId = null;
      let stage2GroupId = null;
      let stage3GroupId = null;
      let playoffsGroupIds = [] as number[];

      if (layoutData && layoutData.result && layoutData.result.sections) {
        const sections = layoutData.result.sections;
        for (const sec of sections) {
          const n = sec.name.toLowerCase();
          if (n.includes("stage i ") || n.endsWith("| 1")) {
             if (sec.groups[0]) stage1GroupId = sec.groups[0].groupid;
          } else if (n.includes("stage ii ") || n.endsWith("| 2")) {
             if (sec.groups[0]) stage2GroupId = sec.groups[0].groupid;
          } else if (n.includes("stage iii") || n.endsWith("| 3")) {
             if (sec.groups[0]) stage3GroupId = sec.groups[0].groupid;
          } else if (n.includes("quarter") || n.includes("semi") || n.includes("final")) {
             sec.groups.forEach((g: any) => playoffsGroupIds.push(g.groupid));
          }
        }
      }

      const allPicks = steamData.result?.picks || [];
      const groupedPicks: any = {
        stage1: [],
        stage2: [],
        stage3: [],
        playoffs: []
      };

      allPicks.forEach((p: any) => {
        if (stage1GroupId && p.groupid === stage1GroupId) groupedPicks.stage1.push(p);
        else if (stage2GroupId && p.groupid === stage2GroupId) groupedPicks.stage2.push(p);
        else if (stage3GroupId && p.groupid === stage3GroupId) groupedPicks.stage3.push(p);
        else if (playoffsGroupIds.includes(p.groupid)) groupedPicks.playoffs.push(p);
      });

      res.json({
         success: true,
         rawPicks: allPicks,
         groupedPicks,
         event,
         layout: layoutData?.result
      });
    } catch (e: any) {
      console.error(e);
      res.json({ error: e.message });
    }
  });

  app.get("/api/debug-steam", (req, res) => {
    res.json((global as any).lastSteamData || { message: "No data yet" });
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
