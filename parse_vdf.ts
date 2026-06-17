import fs from "fs";

const text = fs.readFileSync("items_game.txt", "utf8");

const regex = /"(\d+)"\s*\{[^}]*"name"\s*"sticker_shanghai2024_[^"]*(navi|vitality|spirit|mouz|faze|g2|liquid|astralis|mibr|nrg|furia)[^"]*"/gi;

let match;
const found = [];
while ((match = regex.exec(text)) !== null) {
  found.push([match[1], match[0].replace(/\n/g, " ").substring(0, 100)]);
}
console.log(found.slice(0, 20));
