import fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf-8');
const ts = await import('typescript');
const sourceFile = ts.createSourceFile('App.tsx', code, ts.ScriptTarget.Latest, true);

let found = false;
function visit(node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        // check if it's fine
    }
    ts.forEachChild(node, visit);
}

try {
    visit(sourceFile);
} catch (e) {
    console.log(e);
}
console.log("Parsed using TS parser");
