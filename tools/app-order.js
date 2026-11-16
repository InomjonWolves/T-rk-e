// The app's scripts (js/*.js, in the order index.html loads them) share one global scope, like one big file — with one
// difference: a function declared in a later script does not exist yet while an earlier script runs. This check finds
// code that runs while a script loads (top-level statements, immediately called functions, and everything they call)
// and reports any name it needs from a later script.  node tools/app-order.js  → exit code 1 on a problem.
// Callbacks given to addEventListener, setTimeout, then() and the like run later and are not followed.
const fs = require("fs");
const path = require("path");
const acorn = require("acorn");
const ROOT = path.resolve(__dirname, "..");

// The app's scripts as index.html loads them
function appScripts(html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8")) {
  return [...html.matchAll(/<script src="(js\/[a-z0-9-]+\.js)"><\/script>/g)].map(m => m[1]);
}
const LATER = new Set(["addEventListener", "addListener", "setTimeout", "setInterval", "requestAnimationFrame", "requestIdleCallback", "then", "catch", "finally", "onAuthStateChanged", "afterPaint", "observe"]);

function check(files = appScripts()) {
  const owner = new Map(), fns = new Map(), problems = [];
  const asts = files.map((f, i) => {
    const ast = acorn.parse(fs.readFileSync(path.resolve(ROOT, f), "utf8"), { ecmaVersion: "latest", sourceType: "script", locations: true });
    for (const st of ast.body) {
      const decl = st.type === "FunctionDeclaration" || st.type === "ClassDeclaration" ? [st.id.name] : st.type === "VariableDeclaration" ? st.declarations.flatMap(d => d.id.type === "Identifier" ? [d.id.name] : []) : [];
      decl.forEach(n => { if (!owner.has(n)) owner.set(n, i); });
      if (st.type === "FunctionDeclaration") fns.set(st.id.name, st);
      if (st.type === "VariableDeclaration") st.declarations.forEach(d => { if (d.id.type === "Identifier" && d.init && /Function|Arrow/.test(d.init.type)) fns.set(d.id.name, d.init); });
    }
    return ast;
  });
  // Names a function (or a top-level statement) declares for itself: they hide the global ones of the same name
  function locals(fn) {
    const own = new Set(), pat = p => { if (!p) return; if (p.type === "Identifier") own.add(p.name); else if (p.type === "ObjectPattern") p.properties.forEach(q => pat(q.value || q.argument)); else if (p.type === "ArrayPattern") p.elements.forEach(pat); else if (p.type === "RestElement") pat(p.argument); else if (p.type === "AssignmentPattern") pat(p.left); };
    (fn.params || []).forEach(pat);
    const walk = n => {
      if (!n || typeof n.type !== "string") return;
      if (n.type === "VariableDeclarator") pat(n.id);
      if (n.type === "FunctionDeclaration" && n.id) { own.add(n.id.name); return; }
      if (/Function|Arrow/.test(n.type)) return;
      if (n.type === "CatchClause") pat(n.param);
      for (const k of Object.keys(n)) { if (k === "loc") continue; const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === "string") walk(v); }
    };
    walk(fn.body || fn);
    return own;
  }
  // Every name the code needs when it runs now; functions it calls are followed (once each)
  function needs(node, out, seen) {
    const scopes = [];
    const shadowed = name => scopes.some(sc => sc.has(name));
    const visit = (n, parent) => {
      if (!n || typeof n.type !== "string") return;
      if (/Function|Arrow/.test(n.type)) {
        // A function value is not run here — unless it is called at once: (() => …)()
        if (parent && parent.type === "CallExpression" && parent.callee === n) visitBody(n);
        return;
      }
      if (n.type === "CallExpression" || n.type === "NewExpression") {
        const c = n.callee, name = c.type === "Identifier" ? c.name : c.type === "MemberExpression" && !c.computed ? c.property.name : "";
        visit(c, n);
        if (c.type === "Identifier" && !shadowed(c.name) && fns.has(c.name) && !seen.has(c.name)) { seen.add(c.name); const keep = scopes.splice(0); visitBody(fns.get(c.name)); scopes.push(...keep); }
        // Callbacks: run later for timers, events and promises; run now for forEach, map, reduce and the like
        for (const a of n.arguments) { if (/Function|Arrow/.test(a.type)) { if (!LATER.has(name)) visitBody(a); } else visit(a, n); }
        return;
      }
      if (n.type === "Identifier") { if (!shadowed(n.name)) out.add(n.name); return; }
      if (n.type === "MemberExpression") { visit(n.object, n); if (n.computed) visit(n.property, n); return; }
      if (n.type === "Property") { if (n.computed) visit(n.key, n); visit(n.value, n); return; }
      if (n.type === "MethodDefinition" || n.type === "PropertyDefinition") return;
      for (const k of Object.keys(n)) {
        if (k === "type" || k === "loc" || k === "start" || k === "end") continue;
        const v = n[k];
        if (Array.isArray(v)) v.forEach(x => visit(x, n)); else if (v && typeof v.type === "string") visit(v, n);
      }
    };
    const visitBody = f => { scopes.push(locals(f)); visit(f.body, f); scopes.pop(); };
    // Names a top-level block or loop declares inside itself are its own (const at the top level is the global itself)
    if (node.type !== "VariableDeclaration") scopes.push(locals({ body: node }));
    visit(node, null);
  }
  asts.forEach((ast, i) => {
    for (const st of ast.body) {
      if (st.type === "FunctionDeclaration") continue;
      const out = new Set();
      needs(st, out, new Set());
      for (const n of out) if (owner.has(n) && owner.get(n) > i) problems.push(`${files[i]}:${st.loc.start.line} ishlaganda «${n}» kerak, u esa keyingi faylda: ${files[owner.get(n)]}`);
    }
  });
  return { files, problems: [...new Set(problems)], names: owner.size };
}
module.exports = { check, appScripts };
if (require.main === module) {
  const r = check();
  console.log(`${r.files.length} ta fayl, ${r.names} ta nom`);
  r.problems.forEach(p => console.log("  " + p));
  process.exit(r.problems.length ? 1 : 0);
}
