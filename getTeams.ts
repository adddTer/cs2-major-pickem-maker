import fs from 'fs';
function printTeams(file) {
    console.log("--- Teams in", file, "---");
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    const teams = new Map();
    
    // For swiss format
    if (doc.swiss) {
        for (const p of Object.values(doc.swiss)) {
             for (const g of Object.values(p)) {
                 if (g.matches) {
                     for (const m of g.matches) {
                         if (m.t1 && m.t1.absId) teams.set(m.t1.absId, m.t1.name || m.t1.tag);
                         if (m.t2 && m.t2.absId) teams.set(m.t2.absId, m.t2.name || m.t2.tag);
                     }
                 }
             }
        }
    } else if (doc.stages) {
        // maybe single elim bracket?
        for (const stage of Object.values(doc.stages)) {
            for (const round of (stage.rounds || [])) {
                for (const m of (round.matches || [])) {
                     if (m.t1 && m.t1.absId) teams.set(m.t1.absId, m.t1.name || m.t1.tag);
                     if (m.t2 && m.t2.absId) teams.set(m.t2.absId, m.t2.name || m.t2.tag);
                }
            }
        }
    } else {
        console.log("Unrecognized graph structure: KEYS =", Object.keys(doc));
    }
    
    // Fallback: search whole object
    let foundCount = 0;
    function search(obj) {
        if (!obj || typeof obj !== 'object') return;
        if (obj.absId) {
            console.log("Team:", JSON.stringify(obj));
            foundCount++;
        }
        if (foundCount > 3) return;
        for (const k of Object.keys(obj)) {
            search(obj[k]);
        }
    }
    search(doc);
    
    for (const [id, name] of Array.from(teams.entries())) {
        console.log(id, ":", name);
    }
}

printTeams('dist/test_9029_graph.json');
printTeams('dist/test_8301_graph.json');
