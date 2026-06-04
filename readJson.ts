import fs from 'fs';
const d9029 = JSON.parse(fs.readFileSync('dist/test_9029.json', 'utf8'));
if (d9029.data && d9029.data[0]) {
    console.log("9029 success:", d9029.success);
    const groups = d9029.data[0].groups;
    if (groups && groups.length > 0) {
        console.log("9029 graph present:", !!groups[0].graph);
        fs.writeFileSync('dist/test_9029_graph.json', groups[0].graph);
    }
}
const d8301 = JSON.parse(fs.readFileSync('dist/test_8301.json', 'utf8'));
if (d8301.data && d8301.data[0]) {
    console.log("8301 success:", d8301.success);
    const groups = d8301.data[0].groups;
    if (groups && groups.length > 0) {
        console.log("8301 graph present:", !!groups[0].graph);
        fs.writeFileSync('dist/test_8301_graph.json', groups[0].graph);
    }
}
