import fs from 'fs';
async function test() {
  const r1 = await fetch('https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/csgo_tt_9029/stages');
  fs.writeFileSync('dist/test_9029.json', await r1.text());

  const r2 = await fetch('https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/csgo_tt_8301/stages');
  fs.writeFileSync('dist/test_8301.json', await r2.text());

  const r3 = await fetch('https://esports-data.5eplaycdn.com/csgo/events/csgo_tt_9028?channel=matches');
  fs.writeFileSync('dist/test_9028_event.html', await r3.text());

  console.log("Done fetching!");
}
test();
