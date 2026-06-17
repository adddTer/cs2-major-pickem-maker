import fs from "fs";

let body = fs.readFileSync("items_game.txt", "utf8");

let teamNames = {};

const regex = /"tournament_team_id"\s+"(\d+)"/g;
let match;
const teamIds = [];
while ((match = regex.exec(body)) !== null) {
  teamIds.push(match[1]);
}

console.log(Array.from(new Set(teamIds)).sort((a,b)=>parseInt(a)-parseInt(b)).slice(0, 30));
