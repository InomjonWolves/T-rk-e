/* Türkçe Yoʻl — The translator and personal details.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- Smart translator ----------
   Machine translation comes from MyMemory's free public API (no key, about 5000 characters a day per user).
   On top of it the page adds our own dictionary hits and points to the grammar topics found in the Turkish text. */
let TR_DIR = "tr", TR_TEXT = "", TR_OUT = null, TR_BUSY = false;
const TR_HINTS = [
  { re: /\S+(saydı|seydi|saydım|seydim|saydın|seydin)/i, code: "B2.07", what: "xayoliy shart (-saydı)" },
  { re: /\S+(mış|miş|muş|müş)(tı|ti|tu|tü)/i, code: "B2.03", what: "uzoq oʻtgan zamon (-mıştı)" },
  { re: /\S+(acak|ecek)(tı|ti)/i, code: "B2.04", what: "amalga oshmagan niyat (-acaktı)" },
  { re: /(?:^|[\s(])\S+(makta|mekte)(dır|dir)?(?=$|[\s.,!?;:])/i, code: "B2.19", what: "rasmiy hozirgi zamon (-makta)" },
  { re: /(?:^|[\s(])rağmen/i, code: "B2.11", what: "zidlik: rağmen" },
  { re: /(?:^|[\s(])(hâlde|halde)(?=$|[\s.,!?;:])/i, code: "B2.12", what: "zidlik: -dığı hâlde" },
  { re: /(?:^|[\s(])(oysa|hâlbuki|halbuki)(?=$|[\s.,!?;:])/i, code: "B2.14", what: "oysa / hâlbuki" },
  { re: /(?:^|[\s(])keşke(?=$|[\s.,!?;:])/i, code: "B1.15", what: "istak: keşke" },
  { re: /(?:^|[\s(])(yüzünden|sayesinde|nedeniyle)(?=$|[\s.,!?;:])/i, code: "B1.10", what: "sabab: yüzünden / sayesinde" },
  { re: /(?:^|[\s(])tarafından(?=$|[\s.,!?;:])/i, code: "B1.16", what: "majhul nisbat: tarafından" },
  { re: /\S+(dığı|diği|duğu|düğü|tığı|tiği|tuğu|tüğü|dığım|diğim|duğum|düğüm|tığım|tiğim|tuğum|tüğüm)/i, code: "B1.02", what: "sifatdosh (-dığı)" },
  { re: /(?:^|[\s(])\S+(ınca|ince|unca|ünce)(?=$|[\s.,!?;:])/i, code: "B1.05", what: "ravishdosh (-ınca)" },
  { re: /(?:^|[\s(])\S{2,}(ırsa|irse|ursa|ürse|arsa|erse)\S*/i, code: "B1.12", what: "shart (-ırsa)" },
  { re: /\S+(ıyor|iyor|uyor|üyor)(du|lardı)/i, code: "A2.04", what: "davomli oʻtgan zamon (-yordu)" },
  { re: /(?:^|[\s(])\S+(mış|miş|muş|müş)(?!t)/i, code: "A2.05", what: "naqli oʻtgan zamon (-mış)" },
  { re: /\S+(abil|ebil)/i, code: "A2.09", what: "qila olmoq (-abil)" },
  { re: /\S+(malı|meli)/i, code: "A2.11", what: "kerak (-malı)" },
  { re: /\S+(dıktan|dikten|duktan|dükten|tıktan|tikten|tuktan|tükten) sonra/i, code: "A2.16", what: "-dıktan sonra" },
  { re: /\S+(madan|meden) önce/i, code: "A2.17", what: "-madan önce" },
  { re: /(?:^|[\s(])\S{2,}(arak|erek)(?=$|[\s.,!?;:])/i, code: "A2.18", what: "ravishdosh (-arak)" },
  { re: /(?:^|[\s(])(?!erken)\S+(ken)(?=$|[\s.,!?;:])/i, code: "A2.15", what: "-ken (…ayotganda)" },
  { re: /(?:^|[\s(])\S+(ıyor|iyor|uyor|üyor)\S*/i, code: "A1.24", what: "hozirgi zamon (-yor)" },
  { re: /(?:^|[\s(])\S+(acak|ecek|acağ|eceğ)\S*/i, code: "A1.26", what: "kelasi zamon (-acak)" },
  { re: /(?:^|[\s(])\S+(alım|elim)(?=$|[\s.,!?;:])/i, code: "A1.27", what: "taklif (-alım)" },
  { re: /(?:^|[\s(])\S+(mak|mek)(?=$|[\s.,!?;:])/i, code: "A1.22", what: "feʼlning noaniq shakli (-mak)" },
  { re: /\s(mı|mi|mu|mü)(\s|\?|$)|\s(mı|mi|mu|mü)(sın|sin|sun|sün|yım|yim|yum|yüm|yız|yiz|yuz|yüz|sınız|siniz|sunuz|sünüz)(?=$|[\s.,!?;:])/i, code: "A1.33", what: "soʻroq yuklamasi (mı)" },
  { re: /(?:^|[\s(])(var|yok)(?=$|[\s.,!?;:])/i, code: "A1.21", what: "var / yok" },
  { re: /(?:^|[\s(])değil/i, code: "A1.20", what: "inkor: değil" },
  { re: /(?:^|[\s(])(ile|için|gibi)(?=$|[\s.,!?;:])/i, code: "A1.29", what: "koʻmakchi: ile / için / gibi" },
  { re: /(?:^|[\s(])(daha|en)\s/i, code: "A1.14", what: "qiyoslash: daha / en" },
  { re: /(?:^|[\s(])(üst|alt|iç|ön|arka|yan)(ı|i|u|ü|sı)?n?(da|de|a|e|dan|den)(?=$|[\s.,!?;:])/i, code: "A1.30", what: "joy soʻzlari (üstünde…)" },
  { re: /(?:^|[\s(])\S{2,}(lar|ler)(?=$|[\s.,!?;:])/i, code: "A1.01", what: "koʻplik (-lar)" },
  { re: /'(da|de|ta|te)(?=$|[\s.,!?;:])/i, code: "A1.06", what: "oʻrin-payt (-da)" },
  { re: /'(dan|den|tan|ten)(?=$|[\s.,!?;:])/i, code: "A1.07", what: "chiqish (-dan)" },
  { re: /'(ya|ye|a|e)(?=$|[\s.,!?;:])/i, code: "A1.05", what: "joʻnalish (-ga)" }
];
// Profil → ⚙ Sozlamalar: every setting, the links (friends, groups, help…) and the account actions in one page
function viewSettings() {
  const th = (() => { try { return localStorage.getItem("ty-theme") || "auto"; } catch (e) { return "auto"; } })();
  return `<div><a class="back" href="#profile">${ICON.back}Profil</a></div>
  <h1 class="page-title">Sozlamalar</h1>
  <section class="section">
    <div class="section-head"><h2>Ilova</h2></div>
    <div class="settings glass">
      ${USER ? `<button class="set-row" data-act="profile-edit"><span><b>Shaxsiy maʼlumotlar</b><small>${PROFILE.gender ? (PROFILE.gender === "f" ? "Ayol" : "Erkak") : "Jins koʻrsatilmagan"} · ${PROFILE.birth ? esc(birthText(PROFILE.birth)) : "tugʻilgan sana yoʻq"}</small></span>${ICON.chev}</button>` : ""}
      <div class="set-row"><span><b>Mavzu</b><small>Yorugʻ yoki qorongʻi koʻrinish</small></span>
        <span class="mini-seg">${[["auto", "Avto"], ["light", "Yorugʻ"], ["dark", "Tun"]].map(([v, l]) => `<button data-act="theme" data-v="${v}" aria-pressed="${th === v}">${l}</button>`).join("")}</span></div>
      <div class="set-row"><span><b>Kunlik maqsad</b><small>Har kuni toʻplanadigan XP</small></span>
        <span class="mini-seg">${[30, 50, 100].map(v => `<button data-act="goal" data-v="${v}" aria-pressed="${S.goal === v}">${v}</button>`).join("")}</span></div>
      <div class="set-row"><span><b>Ovoz tezligi</b><small>Turkcha talaffuz${trVoices().length > 1 ? ` · ${trVoices().length} ta ovoz` : ""}</small></span>
        <span class="mini-seg">${[[0.75, "Sekin"], [1, "Odatiy"], [1.2, "Tez"]].map(([v, l]) => `<button data-act="tts-rate" data-v="${v}" aria-pressed="${ttsRate() === v}">${l}</button>`).join("")}</span></div>
      ${trVoices().length > 1 ? `<label class="set-row"><span><b>Ovoz</b><small>Dialoglarda ikkinchi ovoz ham ishlatiladi</small></span>
        <select class="k-select" data-act="tts-voice" style="max-width:150px">${trVoices().map(v => `<option value="${esc(v.name)}" ${ttsVoice() === v ? "selected" : ""}>${esc(v.name.replace(/^Microsoft |^Google /, "").slice(0, 28))}</option>`).join("")}</select></label>` : ""}
      <div class="set-row rem-row set-wide"><span><b>Kunlik eslatma</b><small>${esc(remText())}</small></span>
        <span class="mini-seg">${[[0, "Yoʻq"], [9, "9:00"], [19, "19:00"], [21, "21:00"]].map(([v, l]) => `<button data-act="remind" data-v="${v}" aria-pressed="${remHour() === v}">${l}</button>`).join("")}</span></div>
      <button class="set-row" data-act="sfx" role="switch" aria-checked="${S.sfx !== false}"><span><b>Ovoz effektlari</b><small>Toʻgʻri va xato javob, mashq yakuni ovozlari</small></span><span class="switch"></span></button>
      ${IS_NATIVE ? `<button class="set-row" data-act="hap" role="switch" aria-checked="${S.hap !== false}"><span><b>Tebranish</b><small>Toʻgʻri javobda yengil, xatoda qisqa tebranish</small></span><span class="switch"></span></button>` : ""}
      ${USER ? `<button class="set-row" data-act="pub" role="switch" aria-checked="${S.pub}"><span><b>Reytingda koʻrinish</b><small>Ismingiz va XP boshqa oʻquvchilarga koʻrinadi</small></span><span class="switch"></span></button>
      <button class="set-row" data-act="anon" role="switch" aria-checked="${S.anon !== false}"><span><b>Anonim statistika</b><small>Ism va pochtasiz koʻnikma koʻrsatkichlari saytni yaxshilash uchun yuboriladi</small></span><span class="switch"></span></button>
      ${ADMIN ? `<a class="set-row" href="#admin" style="color:inherit;text-decoration:none"><span><b>Umumiy analitika</b><small>Faqat admin: barcha foydalanuvchilar boʻyicha</small></span>${ICON.chev}</a>` : ""}` : ""}
    </div>
  </section>

  <section class="section">
    <div class="section-head"><h2>Birga oʻrganish va yordam</h2></div>
    <div class="settings glass">
      ${USER ? `<a class="set-row" href="#rank-fr" style="color:inherit;text-decoration:none"><span><b>Doʻstlarni taklif qilish</b><small>Doʻstlar reytingi · har bir doʻst uchun +${FR_XP} XP</small></span>${ICON.heart}</a>`
        : `<button class="set-row" data-act="share"><span><b>Doʻstlarni taklif qilish</b><small>Turk tilini birga, bepul oʻrganing</small></span>${ICON.heart}</button>`}
      <a class="set-row" href="#groups" style="color:inherit;text-decoration:none"><span><b>Guruhlar</b><small>Oʻqituvchi va sinf bilan birga oʻrganish</small></span>${ICON.users}</a>
      <a class="set-row" href="${TG_CHANNEL}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><span><b>Telegram kanalimiz</b><small>@turkceyoluz · har kuni yangi soʻz</small></span>${ICON.chat}</a>
      <a class="set-row" href="#help" style="color:inherit;text-decoration:none"><span><b>Yordam va qoʻllanma</b><small>Ilovani oʻrnatish, saytdan foydalanish, savollar</small></span>${ICON.chev}</a>
      <a class="set-row" href="kurs/" style="color:inherit;text-decoration:none"><span><b>Kurs va grammatika — veb sahifalar</b><small>Mavzuni havola bilan ulashish uchun</small></span>${ICON.chev}</a>
      <a class="set-row" href="biz-haqimizda.html" style="color:inherit;text-decoration:none"><span><b>Biz haqimizda</b><small>Maqsadimiz, tamoyillarimiz va bogʻlanish</small></span>${ICON.chev}</a>
      <a class="set-row" href="shartlar.html" style="color:inherit;text-decoration:none"><span><b>Foydalanish shartlari</b></span>${ICON.chev}</a>
      <a class="set-row" href="privacy.html" style="color:inherit;text-decoration:none"><span><b>Maxfiylik siyosati</b></span>${ICON.chev}</a>
    </div>
  </section>
  ${USER ? `<button class="btn btn-ghost btn-block" data-act="logout">Hisobdan chiqish</button>
  <div id="del-box" style="display:flex;flex-direction:column;gap:10px"><button class="link" data-act="delete-ask" style="align-self:center;color:var(--pink-ink)">Hisobni oʻchirish</button></div>` : ""}`;
}

function trHistory() { try { return JSON.parse(localStorage.getItem("ty-tr-hist") || "[]"); } catch (e) { return []; } }
function trRemember(item) {
  const h = trHistory().filter(x => !(x.s === item.s && x.d === item.d));
  h.unshift(item);
  try { localStorage.setItem("ty-tr-hist", JSON.stringify(h.slice(0, 8))); } catch (e) {}
}
function dictHits(text, dir) {
  const words = plain(text).split(/[\s,.;:!?]+/).filter(w => w.length > 1);
  if (!words.length) return [];
  const out = [];
  ALL.forEach(w => {
    const src = plain(dir === "tr" ? w.tr : w.uz).split(/[;,]/)[0].replace(/^\d+ — /, "").trim();
    if (src && (words.includes(src) || (src.includes(" ") && plain(text).includes(src)))) out.push(w);
  });
  return out.slice(0, 8);
}
function grammarHints(trText) {
  if (!trText) return [];
  const t = " " + trText + " ";
  return TR_HINTS.filter(h => h.re.test(t)).slice(0, 4);
}
function trResultHtml() {
  const o = TR_OUT;
  if (!o) return "";
  const trSide = TR_DIR === "tr" ? TR_TEXT : o.text;
  const hints = grammarHints(trSide), hits = dictHits(TR_TEXT, TR_DIR);
  return `${o.text ? `<div class="glass pad tr-out">
      <div class="tile-row"><span class="tag violet-t">${TR_DIR === "tr" ? "Oʻzbekcha" : "Turkcha"}</span>
        <span style="display:flex;gap:8px">${TR_DIR === "uz" ? `<button class="say" data-act="say" data-t="${esc(o.text)}" aria-label="Tinglash">${ICON.speak}</button>` : ""}<button class="say" data-act="tr-copy" aria-label="Nusxa olish">${ICON.copy}</button></span></div>
      <div class="tr-text" ${TR_DIR === "uz" ? 'lang="tr"' : ""}>${esc(o.text)}</div>
      ${o.alts && o.alts.length ? `<div class="sub">Boshqa variantlar: ${o.alts.map(esc).join(" · ")}</div>` : ""}
    </div>` : ""}
    ${o.err ? `<div class="notice"><div>${esc(o.err)}</div></div>` : ""}
    ${hints.length ? `<section class="section"><div class="section-head"><h2>Bu gapdagi grammatika</h2></div><div class="list">${hints.map(h => {
      const tp = gxTopic(h.code);
      return `<a class="unit glass" href="#${gHash(h.code)}"><span class="art sky"><span style="font-size:13px">${h.code}</span></span><span class="unit-body"><span class="unit-title">${esc(tp ? tp.uz : h.what)}</span><span class="unit-sub">Topildi: ${esc(h.what)}</span></span>${ICON.chev}</a>`;
    }).join("")}</div></section>` : ""}
    ${hits.length ? `<section class="section"><div class="section-head"><h2>Lugʻatimizda bor</h2></div><div class="words glass">${hits.map(w => wordRow(w, true)).join("")}</div></section>` : ""}`;
}
function viewTranslate() {
  const hist = trHistory();
  const from = TR_DIR === "tr" ? "Turkcha" : "Oʻzbekcha", to = TR_DIR === "tr" ? "Oʻzbekcha" : "Turkcha";
  return `${topbar()}
  <div><h1 class="page-title">Aqlli tarjimon</h1><p class="sub">Tarjima, lugʻatimizdagi soʻzlar va gapdagi grammatika bir joyda</p></div>
  <div class="tr-dir glass"><b>${from}</b><button class="icon-btn" data-act="tr-swap" aria-label="Yoʻnalishni almashtirish">${ICON.swap}</button><b>${to}</b></div>
  <div class="glass tr-in">
    <label class="sr" for="tr-src">${from} matn</label>
    <textarea id="tr-src" rows="4" maxlength="500" ${TR_DIR === "tr" ? 'lang="tr"' : ""}>${esc(TR_TEXT)}</textarea>
    ${TR_DIR === "tr" ? `<div class="keys">${["ç", "ş", "ğ", "ı", "İ", "ö", "ü"].map(k => `<button type="button" data-act="tr-key" data-k="${k}">${k}</button>`).join("")}</div>` : ""}
    <div class="tile-row"><span class="sub" id="tr-count">${TR_TEXT.length}/500</span>
      <span style="display:flex;gap:8px">${TR_DIR === "tr" ? `<button class="say" data-act="tr-say" aria-label="Tinglash">${ICON.speak}</button>` : ""}<button class="btn btn-ghost" style="min-height:42px;padding:0 14px" data-act="tr-clear">Tozalash</button></span></div>
  </div>
  <button class="btn btn-grad btn-block" data-act="tr-go" ${TR_BUSY ? "disabled" : ""}>${ICON.translate}${TR_BUSY ? "Tarjima qilinmoqda…" : "Tarjima qilish"}</button>
  <div id="tr-result">${trResultHtml()}</div>
  ${hist.length ? `<section class="section"><div class="section-head"><h2>Oxirgi tarjimalar</h2><button class="link" data-act="tr-hist-clear">Tozalash</button></div>
    <div class="words glass">${hist.map((h, i) => `<button class="toc-row" data-act="tr-hist" data-i="${i}"><span class="code">${h.d === "tr" ? "TR" : "UZ"}</span><span style="min-width:0"><b ${h.d === "tr" ? 'lang="tr"' : ""}>${esc(h.s.slice(0, 60))}</b><small>${esc(h.t.slice(0, 70))}</small></span>${ICON.chev}</button>`).join("")}</div></section>` : ""}
  <p class="auth-small">Tarjima bepul MyMemory xizmati orqali qilinadi, natija taxminiy boʻlishi mumkin. Matningiz shu xizmatga yuboriladi: shaxsiy maʼlumot yozmang.</p>`;
}
async function translateNow() {
  const text = ($("tr-src") ? $("tr-src").value : TR_TEXT).trim();
  TR_TEXT = text;
  if (!text) { toast("Avval matn yozing"); return; }
  TR_BUSY = true; route();
  const pair = TR_DIR === "tr" ? "tr|uz" : "uz|tr";
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}`);
    const j = await r.json();
    let out = (j.responseData && j.responseData.translatedText) || "";
    if (/MYMEMORY WARNING|QUOTA/i.test(out) || j.quotaFinished) {
      TR_OUT = { text: "", err: "Bugungi bepul tarjima limiti tugadi. Ertaga yana urinib koʻring. Lugʻatimizdan topilganlar pastda." };
    } else if (!out || j.responseStatus >= 400) {
      TR_OUT = { text: "", err: "Tarjima qilib boʻlmadi. Boshqacha yozib koʻring." };
    } else {
      const ta = document.createElement("textarea"); ta.innerHTML = out; out = ta.value;
      const alts = [...new Set((j.matches || []).map(m => (m.translation || "").trim()).filter(t => t && fold(t) !== fold(out) && t.length < 200))].slice(0, 2);
      TR_OUT = { text: out, alts };
      S.trUses = (S.trUses || 0) + 1; save();
      trRemember({ s: text, t: out, d: TR_DIR });
    }
  } catch (e) {
    TR_OUT = { text: "", err: "Tarjima uchun internet kerak. Lugʻatimizdan topilganlar pastda." };
  }
  TR_BUSY = false; route();
}

/* ---------- Personal details: gender and birth date ---------- */
let PROFILE = { gender: "", birth: "" }, PENDING_PROFILE = null;
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
function ageOf(birth) {
  const [y, m, d] = birth.split("-").map(Number), now = new Date();
  let a = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a--;
  return a;
}
const birthText = b => { const [y, m, d] = b.split("-").map(Number); return `${d}-${MONTHS[m - 1]}, ${y} · ${ageOf(b)} yosh`; };
function genderSticker() {
  if (!PROFILE.gender) return "";
  return PROFILE.gender === "f" ? `<span class="sticker f" title="Ayol" aria-label="Ayol">${ICON.female}</span>` : `<span class="sticker m" title="Erkak" aria-label="Erkak">${ICON.male}</span>`;
}
function birthSelects(prefix, value) {
  const [y, m, d] = (value || "").split("-").map(Number), maxY = new Date().getFullYear() - 5;
  const opt = (v, l, sel) => `<option value="${v}" ${sel ? "selected" : ""}>${l}</option>`;
  return `<select id="${prefix}-day" aria-label="Kun">${opt("", "Kun", !d)}${Array.from({ length: 31 }, (_, i) => opt(i + 1, i + 1, d === i + 1)).join("")}</select>
    <select id="${prefix}-month" aria-label="Oy">${opt("", "Oy", !m)}${MONTHS.map((n, i) => opt(i + 1, n, m === i + 1)).join("")}</select>
    <select id="${prefix}-year" aria-label="Yil">${opt("", "Yil", !y)}${Array.from({ length: maxY - 1939 }, (_, i) => maxY - i).map(v => opt(v, v, y === v)).join("")}</select>`;
}
// Returns "YYYY-MM-DD" or an error message
function readBirth(prefix) {
  const d = +$(prefix + "-day").value, m = +$(prefix + "-month").value, y = +$(prefix + "-year").value;
  if (!d || !m || !y) return { err: "Tugʻilgan sanani toʻliq tanlang: kun, oy va yil." };
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return { err: `${MONTHS[m - 1]} oyida ${d}-kun yoʻq.` };
  return { v: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
}
function profileSheet(required) {
  openSheet(`<h3>${required ? "Profilingizni toʻldiring" : "Shaxsiy maʼlumotlar"}</h3>
    ${required ? `<p class="sub">Pamuk sizni yaxshiroq tanishi uchun ikki savol. Bu maʼlumotlar boshqalarga koʻrinmaydi.</p>` : ""}
    ${required && !USERNAME ? `<div class="field"><label for="ps-name">Ismingiz</label><input id="ps-name" autocomplete="name" maxlength="40"></div>` : ""}
    <div class="field"><span class="flabel" id="ps-g">Jinsingiz</span>
      <div class="seg glass" role="radiogroup" aria-labelledby="ps-g">
        <button type="button" role="radio" data-act="ps-gender" data-g="m" aria-checked="${PROFILE.gender === "m"}">Erkak</button>
        <button type="button" role="radio" data-act="ps-gender" data-g="f" aria-checked="${PROFILE.gender === "f"}">Ayol</button>
      </div></div>
    <div class="field"><span class="flabel" id="ps-b">Tugʻilgan sana</span><div class="birth" role="group" aria-labelledby="ps-b">${birthSelects("ps", PROFILE.birth)}</div></div>
    <p class="auth-err" id="ps-err" role="alert"></p>
    <button class="btn btn-grad btn-block" data-act="ps-save">Saqlash</button>
    ${required ? "" : `<button class="btn btn-ghost btn-block" data-act="sheet-x">Bekor qilish</button>`}`);
  $("sheet").dataset.locked = required ? "1" : "";
}
async function saveProfile(p) {
  PROFILE = Object.assign(PROFILE, p);
  try { localStorage.setItem("ty-profile" + (USER ? ":" + USER.uid : ""), JSON.stringify(PROFILE)); } catch (e) {}
  if (db && USER) await db.collection("users").doc(USER.uid).set({ gender: PROFILE.gender, birth: PROFILE.birth }, { merge: true }).catch(() => toast("Maʼlumot serverga yozilmadi, internetni tekshiring"));
}

/* Course vocabulary joins the shared word list (thematic words keep their place, duplicates are skipped) */
const ALL_BY_TR = {};
ALL.forEach(w => { const k = fold(w.tr); if (!(k in ALL_BY_TR)) ALL_BY_TR[k] = w; });
[["A1", "sky"], ["A2", "violet"], ["B1", "orange"], ["B2", "pink"], ["C1", "teal"]].forEach(([lv, color]) => {
  const ui = UNITS.length, unit = { id: "kurs" + lv, tr: "Kurs " + lv, uz: "Kurs lugʻati " + lv, course: lv, tip: ["Kurs lugʻati", `${lv} darajasidagi kurs boʻlimlarining soʻzlari.`], words: [] };
  UNITS.push(unit);
  COURSE.units.filter(u => u.level === lv).forEach(u => u.vocab.forEach(g => g.words.forEach(([tr, uzz]) => {
    const k = fold(tr);
    if (k in ALL_BY_TR) return;
    const w = { tr, uz: uzz, note: "", unit: ui };
    ALL.push(w); ALL_BY_TR[k] = w; unit.words.push([tr, uzz]);
  })));
  CATS.push({ id: "k" + lv, uz: `Kurs ${lv} lugʻati`, color, ico: "book", ids: [unit.id] });
});
/* Vocabulary base (lugat.js): thematic packs A1–C1. New words join the shared list (one SRS state per word);
   each pack keeps its full list, including words already taught elsewhere. */
const LPACKS = typeof LUGAT !== "undefined" ? LUGAT : [], LWORDS = {}, LBY = {};
const LV_COLOR = { A1: "sky", A2: "violet", B1: "orange", B2: "pink", C1: "teal" };
LPACKS.forEach(p => {
  const ui = UNITS.length, unit = { id: "lug-" + p.id, tr: p.tr, uz: p.uz, lug: p.lv, tip: ["Lugʻat bazasi", `${p.lv} darajasidagi faol soʻzlar: ${p.uz.toLocaleLowerCase("uz")}.`], words: [] };
  UNITS.push(unit); LBY[p.id] = p; p.ui = ui;
  const list = LWORDS[p.id] = [], seen = new Set();
  p.w.trim().split("\n").forEach(line => {
    const i = line.indexOf("=");
    if (i < 1) return;
    const tr = line.slice(0, i).trim(), uzz = line.slice(i + 1).trim(), k = fold(tr);
    if (seen.has(k)) return;
    seen.add(k);
    let w = ALL_BY_TR[k];
    if (!w) { w = { tr, uz: uzz, note: "", unit: ui }; ALL.push(w); ALL_BY_TR[k] = w; unit.words.push([tr, uzz]); list.push(w); }
    // A word taught elsewhere keeps one learning record (by its spelling) but shows this pack's meaning:
    // "pazar" is "bozor" among city words and "yakshanba" among the days of the week
    else list.push(w.uz === uzz ? w : { tr: w.tr, uz: uzz, note: "", unit: w.unit });
  });
});
const lugLevel = lv => LPACKS.filter(p => p.lv === lv);
const lugKnown = id => LWORDS[id].filter(w => known(w) >= 2).length;
const lugAllWords = () => { const m = new Map(); LPACKS.forEach(p => LWORDS[p.id].forEach(w => m.set(w.tr, w))); return [...m.values()]; };
