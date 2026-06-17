import https from "https";

const events = [26, 27, 28, 29, 30];

async function fetchEvent(event) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.steampowered.com',
      port: 443,
      path: `/ICSGOTournaments_730/GetTournamentLayout/v1?event=${event}&key=536BF84F671FD4E5733F314B0A2B76E1`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => { 
        console.log(`EVENT ${event} STATUS: ${res.statusCode} BODY: ${body.substring(0, 100)}`); 
        resolve();
      });
    });
    req.end();
  });
}

async function run() {
  for (const ev of events) {
    await fetchEvent(ev);
    await new Promise(r => setTimeout(r, 1000));
  }
}

run();
