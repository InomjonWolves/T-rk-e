// Builds course-core.js from course.js: what the app needs for its first screen (levels, unit titles, goals,
// vocabulary and the list of checkable answer keys). The full course.js (dialogs, texts, exercises) is loaded
// by app.js right after the first paint.  Run after editing course.js:  npm run build
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

// Same rule as kKeys() in app.js (a test compares them)
function keysOf(u) {
  const keys = [];
  u.exercises.forEach(e => {
    if (e.match) e.match.left.forEach((_, i) => { if (e.ans[String(i + 1)]) keys.push(`${e.n}-${i + 1}`); });
    else e.items.forEach(([k]) => { if (e.ans[k]) keys.push(`${e.n}-${k}`); });
  });
  if (u.reading && u.reading.ans) Object.keys(u.reading.ans).forEach(k => keys.push(`r-${k}`));
  return keys;
}

function build() {
  const COURSE = vm.runInNewContext(fs.readFileSync(path.join(ROOT, "course.js"), "utf8") + "\n;COURSE", {});
  const core = {
    levels: COURSE.levels,
    units: COURSE.units.map(u => ({ id: u.id, level: u.level, n: u.n, title: u.title, sub: u.sub, goals: u.goals, vocab: u.vocab, keys: keysOf(u) }))
  };
  return "// AVTOMATIK YARATILGAN — tahrirlamang. Manba: course.js (npm run build).\n" +
    "// Birinchi ekran uchun kurs qismi; toʻliq course.js ilova chizilgandan keyin yuklanadi.\n" +
    "var COURSE = " + JSON.stringify(core) + ";\n";
}

module.exports = { build, keysOf };

if (require.main === module) {
  fs.writeFileSync(path.join(ROOT, "course-core.js"), build());
  console.log("course-core.js yozildi");
}
