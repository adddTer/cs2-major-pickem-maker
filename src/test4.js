import { MATCHES, ACTUAL_RESULTS } from "./utils/fetchE5Data.js";
import { fetchAndPatchCSGOData } from "./utils/fetchE5Data.js";

async function main() {
    await fetchAndPatchCSGOData();
    console.log("MATCHES.stage3:", JSON.stringify(global.MATCHES?.stage3));
}
main();
