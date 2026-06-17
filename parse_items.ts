import fs from "fs";

let body = fs.readFileSync("items_game.txt", "utf8");
let matches = body.match(/"sticker_material"\s+"([^"]+shanghai2024[^"]+)"/g);
console.log(matches ? matches.slice(0, 10) : "no matches");
