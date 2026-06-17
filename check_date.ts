import fs from "fs";
const body = fs.readFileSync("items_game.txt", "utf8");
console.log(body.substring(0, 500));
