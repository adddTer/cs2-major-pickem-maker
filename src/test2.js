import fetch from "node-fetch";

async function main() {
  const r = await fetch('https://esports-data.5eplaycdn.com/v1/api/csgo/events/9028/schedules?_t=1').then(r => r.json());
  console.log(r.data[0]);
}

main();
