// Builds the static, search-engine friendly pages from the course and the grammar guide:
//   kurs/, qoida/ (grammar topics), lugat/ (vocabulary packs), sitemap.xml
// The app itself lives in index.html (hash routes are not indexed by search engines).
// Run after changing course.js or guide.js:  node tools/seo.js   (tests fail if the pages are stale)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://turkceyol.web.app/";

function loadContent() {
  const code = ["content.js", "lugat.js", "grammar.js", "grammar-ex.js", "course.js", "guide.js"].map(f => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n;\n");
  return vm.runInNewContext(code + "\n;({ UNITS, BX, COURSE, GUIDE, LUGAT })", {});
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sfx = t => esc(t).replace(/\[([^\]]+)\]/g, '<span class="sfx">$1</span>');
const nb = s => esc(s).replace(/(^|\s)-(\S)/g, "$1‑$2");
const plainSfx = t => String(t).replace(/[\[\]]/g, "");
const slug = code => code.toLowerCase().replace(/\./g, "-");
const cut = (s, n) => { s = String(s).replace(/\s+/g, " ").trim(); return s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1)).replace(/[,;:—–-]+$/, "") + "…"; };

const table = t => `<div class="tw"><table><thead><tr>${t.h.map(h => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
<tbody>${t.r.map(r => `<tr>${r.map(c => `<td lang="tr">${sfx(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const pairs = (rows, cls = "") => `<dl class="pairs ${cls}">${rows.map(([a, b]) => `<div><dt lang="tr">${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl>`;

function page({ file, title, desc, crumbs, body, ld }) {
  const depth = file.split("/").length - 1, up = "../".repeat(depth);
  const url = SITE + file.replace(/(^|\/)index\.html$/, "$1");
  const bc = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c[0], item: SITE + c[1] })) };
  return `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#edf1fc" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a0c1e" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${up}icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${up}icon-192.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Türkçe Yoʻl">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}img/og.jpg">
<meta property="og:locale" content="uz_UZ">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="${up}pages.css">
<script type="application/ld+json">${JSON.stringify(ld ? [bc, ld] : bc)}</script>
</head>
<body>
<header class="top"><a class="brand" href="${up}"><img src="${up}icon.svg" alt="" width="28" height="28">Türkçe Yoʻl</a><a class="open" href="${up}">Ilovani ochish</a></header>
<main>
<nav class="crumbs" aria-label="Yoʻl">${crumbs.slice(0, -1).map(c => `<a href="${up}${c[1]}">${esc(c[0])}</a>`).join(" › ")}</nav>
${body}
</main>
<footer><p>Türkçe Yoʻl — oʻzbek tilida turk tilini oʻrganish. 100% bepul, reklamasiz.</p>
<p><a href="${up}kurs/">Kurs A1–B2</a> · <a href="${up}qoida/">Grammatika qoʻllanmasi</a> · <a href="${up}lugat/">Lugʻat A1–B2</a> · <a href="${up}privacy.html">Maxfiylik siyosati</a></p></footer>
</body>
</html>
`;
}

function build() {
  const { COURSE, GUIDE, BX, LUGAT } = loadContent();
  const out = {};
  const KU = Object.fromEntries(COURSE.units.map(u => [u.id, u]));
  const words = u => u.vocab.reduce((a, v) => a + v.words.length, 0);
  const home = ["Türkçe Yoʻl", ""], kursC = ["Kurs A1–B2", "kurs/"], qoidaC = ["Grammatika", "qoida/"];

  // ---- Course units
  const order = COURSE.levels.flatMap(l => l.units);
  order.forEach((id, k) => {
    const u = KU[id], prev = KU[order[k - 1]], next = KU[order[k + 1]];
    const grammar = u.sections.filter(s => s.kind === "grammar" || s.kind === "other");
    const body = `<h1><span class="code">${esc(u.level)}.${u.n}</span> ${esc(u.title)}</h1>
<p class="lead">${nb(u.sub)}</p>
<section class="card"><h2>Bu boʻlimda nimani oʻrganasiz</h2><ul>${u.goals.map(g => `<li>${esc(g)}</li>`).join("")}</ul></section>
${u.vocab.map(v => `<section class="card"><h2>${esc(v.title)}</h2>${pairs(v.words)}</section>`).join("\n")}
${grammar.map(s => `<section class="card"><h2>${esc(s.title)}</h2>${(s.blocks || []).map(b =>
      b.p ? `<p>${esc(b.p)}</p>` : b.sub ? `<h3>${esc(b.sub)}</h3>` : b.note ? `<p class="note">${esc(b.note)}</p>` : b.table ? table(b.table) : b.gloss ? pairs(b.gloss) : "").join("\n")}</section>`).join("\n")}
<a class="cta" href="../#k-${esc(u.id)}">Dialog, matn va mashqlar — ilovada</a>
<p class="muted center">Boʻlimda yana: dialog va tinglash, oʻqish matni, ${u.exercises.length} ta topshiriq, gapirish mashqi. Hammasi bepul.</p>
<nav class="pager">${prev ? `<a href="${prev.id}.html">← ${esc(prev.level)}.${prev.n} ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a href="${next.id}.html">${esc(next.level)}.${next.n} ${esc(next.title)} →</a>` : "<span></span>"}</nav>`;
    out[`kurs/${id}.html`] = page({
      file: `kurs/${id}.html`,
      title: `${u.level}.${u.n} ${u.title} — turk tili ${u.level} darsi | Türkçe Yoʻl`,
      desc: cut(`Turk tili ${u.level}, ${u.n}-boʻlim: ${u.sub}. ${words(u)} ta soʻz tarjimasi bilan, grammatika oʻzbek tilida tushuntirilgan.`, 158),
      crumbs: [home, kursC, [`${u.level}.${u.n} ${u.title}`, `kurs/${id}.html`]],
      body,
      ld: { "@context": "https://schema.org", "@type": "LearningResource", name: `${u.level}.${u.n} ${u.title}`, inLanguage: "uz", educationalLevel: u.level, about: "Turk tili", isAccessibleForFree: true, teaches: u.goals.join("; ") }
    });
  });
  out["kurs/index.html"] = page({
    file: "kurs/index.html",
    title: "Turk tili kursi A1–B2 — oʻzbek tilida, bepul | Türkçe Yoʻl",
    desc: `Turk tilini noldan B2 gacha: ${order.length} ta boʻlim, lugʻat, grammatika, dialog, matn va daraja testlari. Oʻzbek tilida tushuntirilgan, 100% bepul.`,
    crumbs: [home, kursC],
    body: `<h1>Turk tili kursi A1–B2</h1>
<p class="lead">Oʻzbek tilida tushuntirilgan toʻliq kurs: har boʻlimda lugʻat, grammatika, dialog, oʻqish matni va mashqlar. Har daraja oxirida 4 qismli test (oʻqish, tinglash, yozish, gapirish).</p>
<a class="cta" href="../#placement">Darajangizni aniqlang (5 daqiqa)</a>
${COURSE.levels.map(l => `<section class="card"><h2>${esc(l.title)}</h2><p class="muted">${esc(l.intro)}</p>
<ol class="toc">${l.units.map(id => { const u = KU[id]; return `<li><a href="${id}.html"><span class="code">${esc(u.level)}.${u.n}</span><span><b>${esc(u.title)}</b><small>${esc(u.sub)}</small></span></a></li>`; }).join("")}</ol></section>`).join("\n")}`,
    ld: { "@context": "https://schema.org", "@type": "Course", name: "Turk tili kursi A1–B2", description: "Oʻzbek tilida soʻzlashuvchilar uchun turk tili kursi", inLanguage: "uz", isAccessibleForFree: true, provider: { "@type": "Organization", name: "Türkçe Yoʻl", url: SITE }, hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: "PT10M" }, offers: { "@type": "Offer", price: 0, priceCurrency: "UZS", category: "Free" } }
  });

  // ---- Grammar guide topics
  const all = GUIDE.flatMap(l => l.groups.flatMap(g => g.items.map(i => Object.assign({ lv: l, group: g.name }, i))));
  all.forEach((i, k) => {
    const prev = all[k - 1], next = all[k + 1], s = slug(i.code), n = BX[i.code] ? BX[i.code].length : 0;
    const line = (label, p) => p ? `<p><b>${label}:</b> <span lang="tr">${sfx(p[0])}</span> — ${esc(p[1])}</p>` : "";
    const body = `<h1><span class="code">${esc(i.code)}</span> ${nb(i.uz)}</h1>
<p class="lead" lang="tr">${esc(i.tr)}</p>
${i.f ? `<div class="formula"><b lang="tr">${esc(i.f[0])}</b><span>${esc(i.f[1])}</span></div>` : ""}
${i.forms ? `<section class="card"><h2>Shakllar</h2>${typeof i.forms === "string" ? `<p lang="tr" class="big">${sfx(i.forms)}</p>` : table(i.forms)}</section>` : ""}
<section class="card"><h2>Qoida</h2><p>${esc(i.rule)}</p>${i.note ? `<p class="note">${esc(i.note)}</p>` : ""}</section>
<section class="card"><h2>Misol</h2><p lang="tr" class="big">${sfx(i.ex[0])}</p><p class="muted">${esc(i.ex[1])}</p>${line("Boʻlishsiz", i.neg)}${line("Soʻroq", i.q)}</section>
<a class="cta" href="../#g-${s}">${n ? `${n} ta mashq — ilovada` : "Ilovada ochish"}</a>
<nav class="pager">${prev ? `<a href="${slug(prev.code)}.html">← ${esc(prev.code)} ${esc(prev.uz)}</a>` : "<span></span>"}${next ? `<a href="${slug(next.code)}.html">${esc(next.code)} ${esc(next.uz)} →</a>` : "<span></span>"}</nav>`;
    out[`qoida/${s}.html`] = page({
      file: `qoida/${s}.html`,
      title: `${i.uz} (${plainSfx(i.tr)}) — turk tili grammatikasi ${i.lv.name} | Türkçe Yoʻl`,
      desc: cut(`${i.uz} — ${i.rule}`, 158),
      crumbs: [home, qoidaC, [`${i.code} ${i.uz}`, `qoida/${s}.html`]],
      body,
      ld: { "@context": "https://schema.org", "@type": "LearningResource", name: `${i.uz} (${i.tr})`, inLanguage: "uz", educationalLevel: i.lv.name, about: "Turk tili grammatikasi", isAccessibleForFree: true }
    });
  });
  out["qoida/index.html"] = page({
    file: "qoida/index.html",
    title: "Turk tili grammatikasi oʻzbek tilida — A1–B2 qoʻllanma | Türkçe Yoʻl",
    desc: `Turk tili grammatikasi: ${all.length} ta mavzu, formula, qoʻshimchalar jadvali, qoida va misollar. Har mavzu boʻyicha mashqlar. Bepul.`,
    crumbs: [home, qoidaC],
    body: `<h1>Turk tili grammatikasi</h1>
<p class="lead">${all.length} ta mavzu: har birida formula, shakllar jadvali, qoida va misol. Qoʻshimchalar rangli ajratilgan.</p>
${GUIDE.map(l => `<section class="card"><h2>${esc(l.name)} — ${esc(l.uz)}</h2>${l.groups.map(g => `<h3>${esc(g.name)}</h3><ol class="toc">${g.items.map(i => `<li><a href="${slug(i.code)}.html"><span class="code">${esc(i.code)}</span><span><b>${esc(i.uz)}</b><small lang="tr">${esc(plainSfx(i.tr))}</small></span></a></li>`).join("")}</ol>`).join("")}</section>`).join("\n")}`
  });

  // ---- Vocabulary packs
  const lugC = ["Lugʻat A1–B2", "lugat/"];
  const pairsOf = p => { const seen = new Set(); return p.w.trim().split("\n").map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }).filter(([a]) => a && !seen.has(a) && seen.add(a)); };
  LUGAT.forEach((p, k) => {
    const prev = LUGAT[k - 1], next = LUGAT[k + 1], ws = pairsOf(p);
    out[`lugat/${p.id}.html`] = page({
      file: `lugat/${p.id}.html`,
      title: `${p.uz} — turkcha ${p.lv} soʻzlar (${ws.length} ta) | Türkçe Yoʻl`,
      desc: cut(`Turk tili ${p.lv}: “${p.uz}” mavzusidagi ${ws.length} ta eng faol soʻz oʻzbekcha tarjimasi bilan — ${ws.slice(0, 4).map(w => w[0]).join(", ")}…`, 158),
      crumbs: [home, lugC, [`${p.lv} · ${p.uz}`, `lugat/${p.id}.html`]],
      body: `<h1><span class="code">${esc(p.lv)}</span> ${esc(p.uz)}</h1>
<p class="lead" lang="tr">${esc(p.tr)} · ${ws.length} ta soʻz</p>
<section class="card">${pairs(ws)}</section>
<a class="cta" href="../#lugat-${esc(p.id)}">Kartochka, test va talaffuz bilan mashq qilish — ilovada</a>
<nav class="pager">${prev ? `<a href="${prev.id}.html">← ${esc(prev.lv)} · ${esc(prev.uz)}</a>` : "<span></span>"}${next ? `<a href="${next.id}.html">${esc(next.lv)} · ${esc(next.uz)} →</a>` : "<span></span>"}</nav>`,
      ld: { "@context": "https://schema.org", "@type": "LearningResource", name: `${p.uz} — turkcha soʻzlar`, inLanguage: "uz", educationalLevel: p.lv, about: "Turk tili lugʻati", isAccessibleForFree: true }
    });
  });
  const lugTotal = new Set(LUGAT.flatMap(p => pairsOf(p).map(w => w[0]))).size;
  out["lugat/index.html"] = page({
    file: "lugat/index.html",
    title: "Turk tili soʻzlari A1–B2 — oʻzbekcha tarjimasi bilan | Türkçe Yoʻl",
    desc: `Turk tilidagi eng faol ${lugTotal} ta soʻz: A1 dan B2 gacha, ${LUGAT.length} ta mavzu boʻyicha, oʻzbekcha tarjimasi bilan. Kartochka va testlar bilan bepul mashq.`,
    crumbs: [home, lugC],
    body: `<h1>Turk tili soʻzlari A1–B2</h1>
<p class="lead">Eng koʻp ishlatiladigan ${lugTotal} ta soʻz, darajalar va mavzular boʻyicha. Har mavzuni ilovada kartochka, test, yozish, tinglash va talaffuz bilan mashq qilish mumkin.</p>
${["A1", "A2", "B1", "B2"].map(lv => `<section class="card"><h2>${lv}</h2><ol class="toc">${LUGAT.filter(p => p.lv === lv).map(p => `<li><a href="${p.id}.html"><span class="code">${lv}</span><span><b>${esc(p.uz)}</b><small lang="tr">${esc(p.tr)} · ${pairsOf(p).length} ta soʻz</small></span></a></li>`).join("")}</ol></section>`).join("\n")}`
  });

  // ---- Sitemap
  const urls = ["", "kurs/", "qoida/", "lugat/", ...order.map(id => `kurs/${id}.html`), ...all.map(i => `qoida/${slug(i.code)}.html`), ...LUGAT.map(p => `lugat/${p.id}.html`), "privacy.html"];
  out["sitemap.xml"] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join("\n")}
</urlset>
`;
  return out;
}

module.exports = { build, SITE };

if (require.main === module) {
  const out = build();
  for (const dir of ["kurs", "qoida", "lugat"]) {
    fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
    // Remove pages that no longer exist in the content
    for (const f of fs.readdirSync(path.join(ROOT, dir))) if (!out[`${dir}/${f}`]) fs.unlinkSync(path.join(ROOT, dir, f));
  }
  for (const [f, html] of Object.entries(out)) fs.writeFileSync(path.join(ROOT, f), html);
  console.log(`${Object.keys(out).length} ta fayl yozildi`);
}
