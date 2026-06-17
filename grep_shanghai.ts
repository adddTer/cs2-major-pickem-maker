import fs from "fs";
const lines = fs.readFileSync("items_game.txt", "utf8").split("\n");
const matches = lines.filter(l => l.toLowerCase().includes("shanghai"));
console.log(matches.slice(0, 10));
