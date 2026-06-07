const url = `https://esports-data.5eplaycdn.com/v1/api/csgo/tournaments/csgo_tt_9029/stages?fixed=123`;
async function run() {
  const r1 = await fetch(url);
  console.log('r1', r1.headers.get('via'));
  const r2 = await fetch(url);
  console.log('r2', r2.headers.get('via'));
}
run();
