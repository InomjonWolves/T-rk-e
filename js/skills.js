/* Türkçe Yoʻl — Speaking, the writing check, level tests, the placement test.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- Speaking (Konuşma): sentences, role play, oral answers ----------
   All three reuse the pronunciation machinery (micToggle → sayCheck → sayFinish). */
const cleanLine = t => t.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").replace(/\s+([.,!?;:])/g, "$1").trim();
const kUnitsUpTo = () => { const cur = COURSE.units.indexOf(kNext()); return COURSE.units.slice(0, Math.max(cur + 1, 4)); };
// The current course unit if it has a dialog, otherwise the nearest earlier one
function roleUnit() {
  const cur = COURSE.units.indexOf(kNext());
  for (let i = cur; i >= 0; i--) if (COURSE.units[i].sections.some(s => s.kind === "dialog")) return COURSE.units[i];
  return COURSE.units.find(u => u.sections.some(s => s.kind === "dialog"));
}
function roleButtons(u) {
  const out = [];
  u.sections.forEach((s, si) => {
    if (s.kind !== "dialog") return;
    const lines = s.blocks.flatMap(b => b.dlg || []), who = [...new Set(lines.map(l => l[0]))];
    who.forEach(w => {
      const n = lines.filter(l => l[0] === w).length;
      out.push(`<button class="mode glass" data-act="start" data-mode="role" data-u="${esc(u.id + "|" + si + "|" + w)}"><span class="ico orange-t">${ICON.chat}</span><span><b>${esc(w)} rolida</b><span lang="tr">${esc(s.title.replace(/^Dialog:\s*/, ""))} · ${n} ta gap</span></span>${ICON.chev}</button>`);
    });
  });
  return out.join("");
}
function speakSheet() {
  if (!canListen()) { toast("Bu brauzer nutqni tanimaydi. Chrome yoki Safari'da oching"); return; }
  const ru = roleUnit();
  openSheet(`<h3>Gapirish mashqi</h3>
    ${lsmSheetRow("s")}
    <button class="mode glass" data-act="start" data-mode="say" data-u="pron"><span class="ico green-t">${ICON.mic}</span><span><b>Soʻzlar talaffuzi</b><span>Soʻzni ovoz chiqarib ayting</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="sayline" data-u="auto"><span class="ico sky-t">${ICON.speak}</span><span><b>Gaplarni takrorlash</b><span>Dialog gapini tinglab, oʻzingiz ayting</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="oral" data-u="auto"><span class="ico violet-t">${ICON.quiz}</span><span><b>Savollarga ogʻzaki javob</b><span>Kurs matnlari boʻyicha, ovoz bilan</span></span>${ICON.chev}</button>
    ${ru ? `<div class="sheet-sub">Rolli dialog · ${esc(ru.level)}.${ru.n} <span lang="tr">${esc(ru.title)}</span></div>${roleButtons(ru)}` : ""}`);
}
function lineItems(u) {
  return shuffle(lsLines(u)).slice(0, 8).map(l => ({ tr: l.t, uz: `Kurs dialogidan · ${KU[l.unit].level}.${KU[l.unit].n}`, unit: l.unit, line: true }));
}
function oralItems(u) {
  const units = KU[u] ? [KU[u]] : kUnitsUpTo(), items = [];
  units.forEach(un => {
    const r = un.reading;
    if (!r || !r.ans) return;
    Object.keys(r.ans).forEach(k => {
      const a = cleanLine(r.ans[k]);
      if (/^[DY]$/.test(a) || a.split(" ").length < 2 || /[…\/]/.test(a) || !r.qs[+k - 1]) return;
      items.push({ oral: true, tr: a, q: r.qs[+k - 1], unit: un.id, rtitle: r.title, rtext: r.text });
    });
  });
  return shuffle(items).slice(0, 6);
}
function roleItems(spec) {
  const [uid, si, who] = String(spec).split("|"), un = KU[uid], sec = un && un.sections[+si];
  if (!sec) return [];
  const items = [];
  let before = [];
  sec.blocks.flatMap(b => b.dlg || []).forEach(([w, t]) => {
    const c = cleanLine(t);
    if (!c) return;
    if (w === who) { items.push({ role: true, tr: c, who, before, unit: uid, title: sec.title.replace(/^Dialog:\s*/, "") }); before = []; }
    else before.push([w, c]);
  });
  if (items.length && before.length) items[items.length - 1].after = before;
  return items;
}
// Oral answers: how many content words of the model answer were said (suffixes may differ)
const ORAL_STOP = new Set(["ve", "bir", "bu", "şu", "da", "de", "mi", "mı", "mu", "mü", "ile", "için", "çok", "ama", "evet", "hayır", "var", "yok", "değil"]);
function oralScore(sample, heard) {
  const kw = [...new Set(sayNorm(sample).out.split(" ").filter(x => x.length >= 3 && !ORAL_STOP.has(x)))];
  const hw = heardNorm(heard).split(" ").filter(Boolean);
  const stem = k => k.slice(0, Math.max(4, k.length - 3));
  const hit = kw.map(k => hw.some(h => h === k || (k.length >= 4 && h.length >= 4 && h.startsWith(stem(k)))));
  return { kw, hit, score: kw.length ? hit.filter(Boolean).length / kw.length : 0 };
}
function oralMarked(sample, r) {
  return esc(sample).replace(/[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]+/g, word => {
    const k = sayNorm(word).out, i = r.kw.indexOf(k);
    return i < 0 ? word : `<span class="${r.hit[i] ? "kw-ok" : "miss"}">${word}</span>`;
  });
}
function renderOral(it) {
  SES.sk = ["s", "r"]; SES.tries = 0;
  const un = KU[it.unit];
  stage.innerHTML = `<div class="q-card"><div class="tags"><span class="tag sky-t">${esc(un.level)}.${un.n}</span><span class="tag violet-t" lang="tr">${esc(it.rtitle || "")}</span></div>
    <div class="q-label">Savolga ovoz chiqarib, toʻliq gap bilan javob bering</div>
    <div class="q-row"><div class="q-sent" lang="tr">${esc(it.q)}</div><button class="say" data-act="say" data-t="${esc(it.q.replace(/\([^)]*\)/g, ""))}" aria-label="Savolni tinglash">${ICON.speak}</button></div></div>
    ${it.rtext ? `<details class="glass pad"><summary><b>Matnni koʻrish</b></summary><p class="k-p" lang="tr" style="margin-top:8px">${esc(it.rtext)}</p></details>` : ""}
    <div class="mic-wrap">
      <button class="mic-btn" id="mic-btn" data-act="mic" aria-label="Mikrofon: gapirishni boshlash">${ICON.mic}</button>
      <div class="mic-hint" id="mic-hint">Mikrofonni bosib, javobingizni ayting</div>
      <div class="heard" id="heard" lang="tr" aria-live="polite"></div>
    </div>
    <div class="ls-reveal" id="oral-sample" hidden></div>
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-ghost btn-block" data-act="say-skip">Hozir gapira olmayman</button>`;
}
function roleBubble(who, t, me) {
  return `<div class="bubble ${me ? "r" : "l"}"><small>${esc(who)}${me ? " (siz)" : ""}</small><span lang="tr">${esc(t)}</span></div>`;
}
function renderRole(it) {
  SES.sk = ["s"]; SES.tries = 0;
  const hist = SES.items.slice(0, SES.i).flatMap(x => [...x.before.map(([w, t]) => roleBubble(w, t)), roleBubble(x.who, x.tr, true)]);
  stage.innerHTML = `<div class="tags"><span class="tag orange-t">${ICON.chat}Rolli dialog</span><span class="tag violet-t" lang="tr">${esc(it.title)}</span></div>
    <div class="dlg role-chat" id="role-chat">${hist.join("")}${it.before.map(([w, t]) => roleBubble(w, t)).join("")}
      <div class="bubble r me"><small>Sizning navbatingiz · ${esc(it.who)}</small><span class="say-target" id="say-target" lang="tr">${esc(it.tr)}</span></div>
    </div>
    <div class="mic-wrap">
      <button class="mic-btn" id="mic-btn" data-act="mic" aria-label="Mikrofon: gapirishni boshlash">${ICON.mic}</button>
      <div class="mic-hint" id="mic-hint">${it.before.length ? "Sherigingizni tinglang, keyin oʻz gapingizni ayting" : "Dialogni siz boshlaysiz: gapingizni ayting"}</div>
      <div class="heard" id="heard" lang="tr" aria-live="polite"></div>
    </div>
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-ghost" data-act="say" data-t="${esc(it.tr)}">${ICON.speak}Namuna</button><button class="btn btn-ghost" data-act="say-skip">Oʻtkazib yuborish</button>`;
  const chat = $("role-chat"); chat.scrollTop = chat.scrollHeight;
  if (it.before.length) speakSeq(it.before.map(x => x[1]));
}
// After the learner's last line, show and play what the partner says to close the dialog
function roleAfter(it) {
  if (!it.role || !it.after || !it.after.length) return;
  const chat = $("role-chat"); if (!chat) return;
  chat.insertAdjacentHTML("beforeend", it.after.map(([w, t]) => roleBubble(w, t)).join(""));
  chat.scrollTop = chat.scrollHeight;
  setTimeout(() => speakSeq(it.after.map(x => x[1])), 900);
}
/* ---------- Writing check (Yazma) ----------
   Free writing tasks in the course get an automatic, rule-based review: length, the unit's target grammar,
   connectors, Turkish letters / spelling against our own corpus, punctuation and repetition. No AI, no server. */
const WT = {
  "a1-2": [["Oʻzingiz haqingizda: adım, -(y)Im", /\badım\b|\S(yım|yim|yum|yüm|ım|im|um|üm)\b/], ["Qayerliksiz: -lI", /\S(lı|li|lu|lü)(yım|yim|yum|yüm)?\b/], ["Yosh: … yaşındayım", /yaşında/]],
  "a1-3": [["var / yok", /\b(var|yok)\b/], ["Oʻrin kelishigi -DA", /\S(da|de|ta|te)\b/], ["Joy soʻzlari: üstünde, yanında…", /(üst|alt|iç|ön|arka|yan|karşı)(ı|i|ü|u|sı|sın)?n?(da|de)\b/]],
  "a1-5": [["Hozirgi zamon -(I)yor", /\S(ıyor|iyor|uyor|üyor)/], ["Soat: saat … -DA", /\bsaat\b/], ["Tartib: önce, sonra", /\b(önce|sonra|ardından)\b/]],
  "a1-6": [["Egalik: annem, babam…", /\b(annem|babam|kardeşim|ablam|abim|ailem|eşim|dedem|ninem)\b/], ["… var", /\bvar\b/], ["Kasb yoki yosh", /(yaşında|öğretmen|doktor|mühendis|öğrenci|çalışıyor)/]],
  "a1-8": [["Oʻtgan zamon -DI", /\S(dı|di|du|dü|tı|ti|tu|tü)(m|n|k|nız|niz|nuz|nüz|lar|ler)?\b/], ["Vaqt: geçen hafta sonu, cumartesi…", /(cumartesi|pazar|hafta sonu|dün|geçen)/], ["Bogʻlash: sonra, ve", /\b(sonra|ve|ama)\b/]],
  "a2-1": [["Kelasi zamon -(y)AcAk", /\S(acak|ecek|acağ|eceğ)/], ["Vaqt: yarın, gelecek…", /\b(yarın|gelecek|sonra|yazın|tatilde)\b/], ["Istak: -mAk istiyorum", /(mak|mek) ist/]],
  "a2-2": [["Geniş zaman: -(A/I)rIm", /\S{2,}(arım|erim|ırım|irim|urum|ürüm|mam|mem)\b/], ["Takroriylik: her gün, genellikle, bazen…", /(her gün|genellikle|bazen|sık sık|hiç|asla|her zaman|her sabah|her akşam)/]],
  "a2-3": [["Yoʻnalish: sağa, sola, düz", /\b(sağa|sola|düz|dön)/], ["-(y)ArAk / -(y)Ip", /\S{2,}(arak|erek|ıp|ip|up|üp)\b/], ["Joy: yanında, karşısında…", /(yanında|karşısında|önünde|arkasında|köşe)/]],
  "a2-5": [["Qiyos: daha", /\bdaha\b/], ["Orttirma: en", /\ben\b/], ["Tenglik / oʻxshatish: kadar, gibi", /\b(kadar|gibi)\b/]],
  "a2-6": [["-(I)yordu", /(ıyor|iyor|uyor|üyor)(du|dum|dun|duk|lardı)/], ["Oʻtgan zamon -DI", /\S(dı|di|du|dü|tı|ti|tu|tü)(m|k|n)?\b/], ["Eshitilgan -mIş", /\S(mış|miş|muş|müş)/]],
  "a2-8": [["Tartib: önce, sonra", /\b(önce|sonra)\b/], ["-(y)ken", /(?:^|[^a-zçğıöşü])(?!erken)[a-zçğıöşü]+ken(?![a-zçğıöşü])/], ["-DIktAn sonra", /(dıktan|dikten|duktan|dükten|tıktan|tikten|tuktan|tükten) sonra/], ["-mAdAn önce", /(madan|meden) önce/]],
  "b1-1": [["Sifatdosh -(y)An", /\b\S{2,}[^ıiuüaeoö\s'](an|en)\s+[a-zçğıöşü]/], ["Sifatdosh -DIK + egalik", /(dığ|diğ|duğ|düğ|tığ|tiğ|tuğ|tüğ)(ı|i|u|ü)|(dık|dik|duk|dük|tık|tik|tuk|tük)(ları|leri)/]],
  "b1-2": [["Sabab: -DIğI için", /(dığı|diği|duğu|düğü|tığı|tiği|tuğu|tüğü|dığım|diğim|duğum|düğüm|dığın|diğin|duğun|düğün|tığım|tiğim|tığın|tiğin)\S* için/], ["yüzünden / sayesinde / nedeniyle", /(yüzünden|sayesinde|nedeniyle|dolayı)/], ["Natija: bu yüzden, bu nedenle", /(bu yüzden|bu nedenle|bu sebeple|dolayısıyla|çünkü)/]],
  "b1-3": [["Real shart -ArsA", /\S{2,}(arsa|erse|ırsa|irse|ursa|ürse)/], ["Buyruq yoki -mAlI", /\S(malı|meli|malıyız|meliyiz)|\S(ın|in|un|ün|yın|yin|yun|yün)\.?$/m], ["varsa / yoksa", /\b(varsa|yoksa)\b/]],
  "b1-4": [["Majhul nisbat", /\S{2,}(ıl|il|ul|ül|ın|in|un|ün|n)(ır|ir|ur|ür|maz|mez|malı|meli|malıdır|melidir|dı|di|du|dü)\b/], ["Tartib: önce, sonra", /\b(önce|sonra|ardından|en son)/]],
  "b1-5": [["Orttirma nisbat (-DIr, -t)", /\S{2,}(tır|tir|tur|tür|dır|dir|dur|dür|t)(acak|ecek|ıyor|iyor|uyor|üyor|ır|ir|ur|ür|dı|di|tı|ti|tu|tü|alım|elim|sın|sin|ıyorum|iyorum)/], ["Kimga -(y)A … nimani -(y)I", /\S(ya|ye|a|e) \S+(ı|i|u|ü|yı|yi|yu|yü|nı|ni) /]],
  "b1-6": [["-DIğInI / -(y)AcAğInI söyledi", /(dığını|diğini|duğunu|düğünü|tığını|tiğini|tuğunu|tüğünü|acağını|eceğini)/], ["Buyruq: -mAsInI istedi", /(masını|mesini|mamı|memi|manı|meni|mamızı|memizi)/], ["Feʼllar: söyledi, sordu, dedi", /\b(sordu|söyledi|dedi|istedi|anlattı)\b/]],
  "b1-7": [["-(y)IncA", /\S(ınca|ince|unca|ünce)\b/], ["-(y)Ip", /\S{2,}(ıp|ip|up|üp)\b/], ["-DIkçA yoki -(y)ArAk", /\S(dıkça|dikçe|dukça|dükçe|tıkça|tikçe|tukça|tükçe|arak|erek)\b/]],
  "b1-8": [["Fikr: bence, bana göre, düşünüyorum", /(bence|bana göre|düşünüyorum|kanımca|bana kalırsa)/], ["Dalil: ayrıca, örneğin, ancak", /(ayrıca|örneğin|ancak|öte yandan|üstelik|mesela)/], ["Xulosa: sonuç olarak", /(sonuç olarak|kısacası|özetle)/]],
  "b2-1": [["Harakat nomi -mAk / -mA", /\S{2,}(mak|mek|ması|mesi|maya|meye|mayı|meyi)\b/], ["Ehtiyoj: ihtiyaç, gerekli", /(ihtiyaç|gerekli|gerekiyor|lazım)/], ["Qachon: tarih, saat, gün", /(saat|tarih|günü|pazar|cumartesi|ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)/]],
  "b2-2": [["-mIştI", /(mıştı|mişti|muştu|müştü)/], ["-(y)AcAktI", /(acaktı|ecekti)/], ["-ArdI", /\S{2,}(ardı|erdi|ırdı|irdi|urdu|ürdü)/]],
  "b2-3": [["Xayoliy shart -sAydI", /(saydı|seydi)/], ["Natija -ArdI", /\S{2,}(ardı|erdi|ırdı|irdi|urdu|ürdü)/], ["keşke", /keşke/]],
  "b2-4": [["Zidlik: rağmen, hâlde, oysa", /(rağmen|halde|hâlde|oysa|halbuki|hâlbuki|yine de)/], ["Kuchaytirish: sadece … değil, üstelik", /(sadece|üstelik|dahası|aksine)/], ["Xulosa: sonuç olarak", /(sonuç olarak|kısacası|özetle)/]],
  "b2-5": [["Murojaat: … MÜDÜRLÜĞÜNE", /(müdürlüğüne|rektörlüğüne|başkanlığına|sayın)/], ["Rasmiy shakl: -mAktAyIm, -mIştIr", /(maktayım|mekteyim|maktadır|mektedir|mıştır|miştir|muştur|müştür)/], ["Yakun: Gereğini arz ederim", /(arz ederim|rica ederim|saygılarımla)/]],
  "c1-1": [["Shart va muddat: -DIğI sürece / takdirde", /(sürece|takdirde)/], ["Muqobil: -mAk yerine / -mAklA birlikte", /(yerine|birlikte)/], ["Xulosa: sonuç olarak", /(sonuç olarak|kısacası|özetle)/]],
  "c1-2": [["Eshitilgan: -mIş", /\S{2,}(mış|miş|muş|müş)/], ["Shubha: güya, sözde, meğer", /(güya|sözde|meğer|sanki)/], ["Betaraf xabar: söyleniyor, bildirildi", /(söyleniyor|bildirildi|açıklandı|iddia)/]],
  "c1-3": [["Qiyos: daha, kadar, göre", /(daha|kadar|göre)/], ["Zidlash: oysa, buna karşın, öte yandan", /(oysa|buna karşın|öte yandan|ancak|fakat)/], ["Xulosa: sonuç olarak", /(sonuç olarak|kısacası|özetle)/]],
  "c1-4": [["Murojaat: Sayın …", /(sayın|müdürlüğüne)/], ["Majhul: -Il / -In + -DI, -mIştIr", /\S{2,}(ıldı|ildi|uldu|üldü|ndı|ndi|ılmıştır|ilmiştir|nmıştır|nmiştir)/], ["Talab va yakun: rica ederim, saygılarımla", /(rica ederim|arz ederim|saygılarımla)/]],
  "c1-5": [["Akademik bogʻlovchi: dolayısıyla, zira, nitekim", /(dolayısıyla|zira|nitekim|bununla birlikte|buna karşın|öte yandan)/], ["Rasmiy zamon: -mAktAdIr, -mIştIr", /(maktadır|mektedir|mıştır|miştir|muştur|müştür)/], ["Xulosa: sonuç olarak", /(sonuç olarak|özetle|bütün bunlar)/]],
  "c1-6": [["Tasviriy feʼl: -(y)Iver, -(y)AyAz, -(y)Akal", /\S{2,}(ıver|iver|uver|üver|ayaz|eyaz|akal|ekal)/], ["Sabab-natija: çünkü, bu yüzden", /(çünkü|bu yüzden|dolayısıyla|zira)/], ["Xulosa: sonuç olarak", /(sonuç olarak|kısacası|özetle)/]],
  "c1-7": [["Kuchaytirma: masmavi, kapkara…", /(masmavi|kapkara|bembeyaz|tertemiz|yemyeşil|yapayalnız|sımsıcak|upuzun|dümdüz)/], ["Ikileme: yavaş yavaş, sessiz sedasız…", /(yavaş yavaş|ağır aksak|sessiz sedasız|ufak tefek|uzun uzun|konu komşu)/], ["Oʻxshatish: gibi, sanki", /(gibi|sanki)/]],
  "c1-8": [["Tezis: savunulacaktır, … düşünülmektedir", /(savunul|düşünülmektedir|ele alın|söylenebilir)/], ["Qarshi fikr: öne sürülebilir; ancak", /(öne sürülebilir|ancak|bununla birlikte|buna karşın)/], ["Xulosa: göz önüne alındığında, sonuç olarak", /(göz önüne alındığında|sonuç olarak|özetle)/]],
  "b2-6": [["Maqol", /(damlaya|birlikten|bir elin|acele|ayağını|dost kara|ak akçe|sabreden|ağaç yaş|bugünün işini|söz gümüş|az olsun|görünen köy|bin bilsen|her işte)/], ["Misol: örneğin, mesela", /(örneğin|mesela|bence|bana göre)/], ["Xulosa: sonuç olarak", /(sonuç olarak|kısacası|özetle)/]],
  "b2-7": [["Xabar feʼllari: açıkladı, belirtti…", /(açıkladı|belirtti|vurguladı|kaydetti|ifade etti|bildirdi)/], ["Rasmiy birikma: kapsamında, çerçevesinde", /(kapsamında|çerçevesinde|doğrultusunda|ilişkin|ile ilgili)/], ["Raqam yoki sana", /\d|yüzde/]]
};
// JavaScript's \b does not treat ç, ğ, ı, ö, ş, ü as letters: rewrite it with Turkish-aware boundaries
// (a leading boundary consumes one non-letter, a trailing one only looks ahead; no lookbehind for older Safari)
const WR_L = "a-zçğıöşüâîû";
Object.values(WT).forEach(arr => arr.forEach(g => {
  const src = g[1].source.replace(/\\b(?=[(\\a-zçğıöşü])/g, `(?:^|[^${WR_L}])`).replace(/\\b/g, `(?![${WR_L}])`);
  g[1] = new RegExp(src, g[1].flags);
}));
const WR_CONN = ["ve", "ama", "fakat", "ancak", "çünkü", "ayrıca", "örneğin", "mesela", "bu yüzden", "bu nedenle", "önce", "sonra", "ardından", "sonuç olarak", "kısacası", "üstelik", "ya da", "veya", "hem", "yani", "oysa", "bence", "en sonunda", "öte yandan", "buna rağmen", "yine de"];
const WR_STOP = new Set(["için", "gibi", "kadar", "daha", "sonra", "önce", "çok", "benim", "bizim", "onun", "senin", "olarak", "ama", "ancak", "değil", "şimdi", "bugün"]);
// Writing tasks: course exercises whose title starts with "Yozish"
function wrTasks() {
  const out = [];
  COURSE.units.forEach(u => u.exercises.forEach(e => { if (/^Yozish/.test(e.title) && !e.match && !(e.items || []).some(([k]) => e.ans && e.ans[k])) out.push({ u, e, key: `${e.n}-w` }); }));
  return out;
}
function wrTarget(title) {
  const m = title.match(/(\d+)\s*[–-]\s*(\d+)\s*(gap|soʻz|band|qator)/) || title.match(/(\d+)()\s*(gap|soʻz|band)/);
  if (!m) return { min: 60, max: 180, unit: "soʻz" };
  return { min: +m[1], max: +(m[2] || Math.round(m[1] * 1.25)), unit: m[3] === "soʻz" ? "soʻz" : "gap" };
}
// Every Turkish word form the site itself uses, keyed by its form without Turkish letters
let WR_CORPUS = null;
function wrCorpus() {
  if (WR_CORPUS && WR_CORPUS.g === GRAM_FULL) return WR_CORPUS;
  const forms = new Set(), byPlain = {};
  const add = t => String(t).toLocaleLowerCase("tr").split(/[^a-zçğıöşüâîû]+/).forEach(w => { if (w.length > 1) forms.add(w); });
  ALL.forEach(w => add(w.tr));
  const walk = o => { if (typeof o === "string") { if (/[çğıöşü]/i.test(o) || !/[ʻʼ]/.test(o)) add(o); } else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") Object.keys(o).forEach(k => { if (!["uz", "goals", "title", "sub", "note"].includes(k)) walk(o[k]); }); };
  COURSE.units.forEach(u => { walk(u.sections); walk(u.reading); walk(u.exercises); u.vocab.forEach(v => v.words.forEach(([tr]) => add(tr))); });
  Object.values(BX).forEach(arr => arr.forEach(x => { (x.o || []).forEach(add); (x.ans || []).forEach(add); if (x.s) add(x.s); }));
  forms.forEach(f => { if (!/[çğıöşü]/.test(f)) return; const p = plain(f); (byPlain[p] = byPlain[p] || []).push(f); });
  return (WR_CORPUS = { forms, byPlain, g: GRAM_FULL });
}
function wrCheck(text, task) {
  const t = text.trim(), low = " " + t.toLocaleLowerCase("tr") + " ";
  const words = t.split(/\s+/).filter(w => /[a-zçğıöşüA-ZÇĞİÖŞÜ]/.test(w)), wc = words.length;
  const sents = t.replace(/([.!?…])\s+/g, "$1\n").split(/\n+/).map(x => x.trim()).filter(x => /[a-zçğıöşü]/i.test(x)), sc = sents.length;
  const tgt = task.tgt || wrTarget(task.e.title), have = tgt.unit === "soʻz" ? wc : sc;
  const vol = Math.min(1, have / tgt.min);
  const goals = (task.goals || WT[task.u.id] || []).map(([label, re]) => ({ label, ok: re.test(low) }));
  const gScore = goals.length ? goals.filter(g => g.ok).length / goals.length : 1;
  const conns = WR_CONN.filter(c => new RegExp(`(^|[^a-zçğıöşü])${c}([^a-zçğıöşü]|$)`).test(low));
  const needC = task.u.level === "A1" ? 2 : task.u.level === "A2" ? 3 : 4;
  const cScore = Math.min(1, conns.length / needC);
  // Spelling: letters that Turkish does not have, and words written without ç, ğ, ı, ö, ş, ü
  const C = wrCorpus(), spell = [];
  words.forEach(raw => {
    const w = raw.toLocaleLowerCase("tr").replace(/^[^a-zçğıöşüâîûqxw]+|[^a-zçğıöşüâîûqxw]+$/g, "").replace(/'.*$/, "");
    if (!w || spell.some(s => s.w === w)) return;
    if (/[qxw]|[ʻʼ]/.test(w)) spell.push({ w, fix: null, why: "turk alifbosida q, x, w harflari yoʻq" });
    else if (!C.forms.has(w) && C.byPlain[w]) spell.push({ w, fix: C.byPlain[w][0], why: "turkcha harflar" });
    // A known root with a suffix against the rules: «evlar» → «evler» (names and unknown words are left alone)
    // (the site's own texts are no shield here: exercise options hold wrong forms on purpose)
    else if (MORPH_OK && !/^[A-ZÇĞİÖŞÜ]/.test(raw)) { const f = Morph.fix(w); if (f) spell.push({ w, fix: f.fix, why: MOR_WHY[f.kind][0], kind: f.kind }); }
  });
  const sScore = 1 - Math.min(1, spell.length / Math.max(3, wc / 15));
  // Punctuation: sentences should start with a capital letter and the text should end with . ! or ?
  const lowerStart = sents.filter(x => /^[a-zçğıöşü]/.test(x)).length, noEnd = /[.!?…]$/.test(t) ? 0 : 1;
  const pScore = sc ? 1 - Math.min(1, (lowerStart + noEnd) / sc) : 0;
  const freq = {};
  words.forEach(raw => { const w = raw.toLocaleLowerCase("tr").replace(/[^a-zçğıöşü]/g, ""); if (w.length >= 4 && !WR_STOP.has(w)) freq[w] = (freq[w] || 0) + 1; });
  const reps = Object.entries(freq).filter(([, n]) => n >= Math.max(4, wc / 25)).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const score = Math.round(100 * (0.25 * vol + 0.35 * gScore + 0.15 * cScore + 0.15 * sScore + 0.10 * pScore));
  return { score, wc, sc, tgt, have, goals, conns, needC, spell, lowerStart, noEnd, reps };
}
const WR_RES = {};
function wrResultHtml(r, goalsTitle = "Mavzu grammatikasi") {
  const row = (ok, title, body) => `<div class="wr-row"><span class="state ${ok ? "done" : "warn"}">${ok ? ICON.check : "!"}</span><div><b>${title}</b><div class="sub">${body}</div></div></div>`;
  const verdict = r.score >= 85 ? "Ajoyib yozilgan!" : r.score >= 70 ? "Yaxshi! Kichik kamchiliklar bor." : r.score >= 50 ? "Yomon emas, lekin toʻldirish kerak." : "Hali qisqa yoki talablarga mos emas.";
  return `<div class="wr-head">${pctRing(r.score / 100)}<div><b>${verdict}</b><div class="sub">${r.wc} ta soʻz · ${r.sc} ta gap</div></div></div>
    ${row(r.have >= r.tgt.min, "Hajm", `${r.have} ${r.tgt.unit} (talab: ${r.tgt.min}–${r.tgt.max} ${r.tgt.unit})${r.have > r.tgt.max * 1.5 ? " — juda uzun, qisqartiring" : ""}`)}
    ${r.goals.length ? row(r.goals.every(g => g.ok), goalsTitle, r.goals.map(g => `${g.ok ? "✔" : "✘"} ${esc(g.label)}`).join("<br>")) : ""}
    ${row(r.conns.length >= r.needC, "Bogʻlovchilar", r.conns.length ? `Ishlatilgan: <span lang="tr">${r.conns.map(esc).join(", ")}</span>${r.conns.length < r.needC ? `. Yana qoʻshing: ayrıca, örneğin, bu yüzden, sonuç olarak…` : ""}` : "Gaplarni bogʻlang: ve, ama, çünkü, sonra, bu yüzden…")}
    ${row(!r.spell.length, "Imlo va turkcha harflar", r.spell.length ? r.spell.slice(0, 8).map(s => s.fix ? `<span lang="tr">${esc(s.w)} → <b>${esc(s.fix)}</b></span>${s.kind ? ` <small class="muted">(${esc(s.why)})</small>` : ""}` : `<span lang="tr">${esc(s.w)}</span> — ${esc(s.why)}`).join("<br>") : "Xato topilmadi")}
    ${row(!r.lowerStart && !r.noEnd, "Tinish belgilari", !r.lowerStart && !r.noEnd ? "Gaplar katta harf bilan boshlanib, nuqta bilan tugagan" : [r.lowerStart ? `${r.lowerStart} ta gap kichik harf bilan boshlangan` : "", r.noEnd ? "matn oxirida nuqta yoʻq" : ""].filter(Boolean).join(", "))}
    ${r.reps.length ? row(false, "Takrorlar", r.reps.map(([w, n]) => `<span lang="tr">«${esc(w)}»</span> ${n} marta`).join(", ") + " — boshqa soʻz bilan almashtirib koʻring") : ""}
    <p class="muted" style="font-size:13px">Avtomatik tekshiruv taxminiy: u grammatika va shaklni koʻradi, mazmunni emas. Imkoni boʻlsa, matnni turkcha biladigan odamga ham koʻrsating.</p>`;
}
function wrRun(id, key) {
  const u = KU[id], e = u.exercises.find(x => `${x.n}-w` === key), st = kState(id), text = st.v[key] || "";
  if (text.trim().split(/\s+/).length < 5) { toast("Avval kamida bir necha gap yozing"); return; }
  // The word analyser makes the spelling check see wrong suffixes; without it (offline) the check still works
  // (it is loaded while the learner types — see the textarea listener; here the check never waits)
  if (!MORPH_OK) loadMorph().catch(() => {});
  const r = wrCheck(text, { u, e });
  r.spell.forEach(x => { if (x.kind) morBump(x.kind); });
  WR_RES[id + "|" + key] = r;
  st.wb = st.wb || {}; st.wl = st.wl || {};
  // Count each different text once; XP the first time the task reaches 70
  if (st.wl[key] !== text.length + ":" + r.score) {
    st.wl[key] = text.length + ":" + r.score;
    const first = r.score >= 70 && !(st.wb[key] >= 70);
    skillLog("w", r.score >= 70);
    if (first) { const a = xpAward("writing", { acc: r.score / 100, key: `wr|${id}|${key}` }); if (a.xp) pamukSay("happy", `Yozish topshirigʻi bajarildi! +${a.xp} XP`); } else save();
  }
  st.wb[key] = Math.max(st.wb[key] || 0, r.score);
  const box = $(`wr-${id}-${key}`);
  if (box) { box.hidden = false; box.innerHTML = wrResultHtml(r); }
  pamukSay(r.score >= 70 ? "happy" : "sad", r.score >= 70 ? `${r.score} ball — barakalla!` : `${r.score} ball. Tavsiyalarni koʻrib, matnni toʻldiring.`);
}
function viewWrite() {
  const tasks = wrTasks(), cur = COURSE.units.indexOf(kNext());
  const lv = ["A1", "A2", "B1", "B2", "C1"];
  return `${topbar()}
  <div><a class="back" href="#practice">${ICON.back}Mashq</a></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag pink-t">${ICON.type}Yazma</span><span class="tag green-t">${tasks.filter(t => ((S.k[t.u.id] || {}).wb || {})[t.key] >= 70).length}/${tasks.length} bajarilgan</span></div>
    <h1>Erkin yozish</h1>
    <p class="sub">Har bir kurs boʻlimidagi yozish topshirigʻi. Yozganingizni sayt avtomatik tekshiradi: hajm, mavzu grammatikasi, bogʻlovchilar, imlo va tinish belgilari.</p>
  </div>
  ${lv.map(l => { const ts = tasks.filter(t => t.u.level === l); return ts.length ? `<div class="toc-group" style="padding-left:2px">${l}</div><div class="list">${ts.map(t => {
    const best = ((S.k[t.u.id] || {}).wb || {})[t.key], locked = COURSE.units.indexOf(t.u) > cur + 1;
    return `<a class="unit glass long" href="#${kHash(t.u.id)}" data-act="wr-open" data-id="${t.u.id}">
      <span class="art ${best >= 70 ? "green" : LV_COLOR[t.u.level]}"><span style="font-size:14px">${t.u.level}.${t.u.n}</span></span>
      <span class="unit-body"><span class="unit-title">${esc(t.e.title.replace(/^Yozish\.?\s*/, ""))}</span><span class="unit-sub">${best !== undefined ? `Eng yaxshi natija: ${best} ball` : locked ? "Kursda hali bu boʻlimga yetmagansiz" : "Hali yozilmagan"}</span></span>
      ${best !== undefined ? pctRing(best / 100) : ICON.chev}</a>`; }).join("")}</div>` : ""; }).join("")}`;
}
/* ---------- Level tests in four parts ----------
   Okuma = the book's own questions (grammar/vocabulary + reading). Dinleme, Yazma and Konuşma are built
   from the same level's vocabulary, dialogs, exercises and reading questions, fresh for every attempt. */
const LVS = ["A1", "A2", "B1", "B2", "C1"];
const PL_LVS = LVS; // darajani aniqlash testi A1–C1 ni qamraydi
let KT_GEN = {}, KT_ANS = { lv: null, l: {}, w: {}, s: {} }, KT_REC = null;
function ktGen(lv) {
  if (KT_GEN[lv]) return KT_GEN[lv];
  const units = COURSE.units.filter(u => u.level === lv);
  const words = shuffle(units.flatMap(u => u.vocab.flatMap(v => v.words)).filter(([tr, uz]) => uz && sayable({ tr })));
  const lines = shuffle(units.flatMap(u => lsLines(u.id)));
  const l = [];
  words.slice(0, 3).forEach(([tr, uz]) => {
    const wrong = [...new Set(shuffle(words.filter(x => x[1] !== uz && x[0] !== tr)).map(x => x[1]))].slice(0, 3);
    l.push({ kind: "word", t: tr, a: uz, o: shuffle([uz, ...wrong]) });
  });
  lines.slice(0, 3).forEach(ln => {
    const near = lines.filter(x => x.t !== ln.t).sort((a, b) => Math.abs(a.t.length - ln.t.length) - Math.abs(b.t.length - ln.t.length)).slice(0, 6);
    l.push({ kind: "line", t: ln.t, a: ln.t, o: shuffle([ln.t, ...shuffle(near).slice(0, 2).map(x => x.t)]) });
  });
  // Writing: one short fill-in item from each of six different exercises
  const ex = shuffle(units.flatMap(u => u.exercises.filter(e => !e.match && !e.sample).map(e => ({ e, items: (e.items || []).filter(([k, q]) => {
    const a = e.ans && e.ans[k];
    return a && a.split(" ").length <= 4 && !/…/.test(a) && /___|→/.test(q);
  }) })).filter(x => x.items.length)));
  const w = ex.slice(0, 6).map(({ e, items }) => { const [k, q] = items[Math.floor(Math.random() * items.length)]; return { title: e.title, q, a: e.ans[k] }; });
  // Speaking: repeat dialog lines and answer reading questions aloud
  const oral = shuffle(units.flatMap(u => oralItems(u.id))).slice(0, 2);
  const s = [...lines.slice(3, 3 + 4 - oral.length).map(ln => ({ kind: "line", tr: ln.t })), ...oral.map(o => ({ kind: "oral", tr: o.tr, q: o.q }))];
  return (KT_GEN[lv] = { l, w, s });
}
const ktNeed = it => it.kind === "oral" ? 0.6 : 0.8;
// Best result per skill and level, and the highest level passed in each skill
const ktSkill = (lv, id) => ((S.ktsk || {})[lv] || {})[id];
function skLevel(id) {
  let best = null;
  LVS.forEach(lv => { const v = ktSkill(lv, id); if (v !== undefined && v !== null && v >= KLEVEL(lv).test.pass) best = lv; });
  return best;
}
function skLevelsCard() {
  // Next test to take: the level after the highest one passed in this skill
  const next = id => { const lv = skLevel(id); return lv ? LVS[Math.min(LVS.indexOf(lv) + 1, LVS.length - 1)] : "A1"; };
  return `<section class="section"><div class="section-head"><h2>Koʻnikma boʻyicha daraja</h2><span class="tag teal-t">daraja testlaridan</span></div>
    <div class="sk-lv">${SKILLS.map(s => { const lv = skLevel(s.id), nx = next(s.id); return `<a class="sk-lv-item glass" href="#ktest-${nx.toLowerCase()}">
      <span class="ico ${s.c}-t">${ICON[s.ico]}</span><small>${s.tr}</small><b>${lv || "—"}</b><span class="muted">${lv === LVS[LVS.length - 1] ? "Eng yuqori" : `Keyingi: ${nx} testi`}</span></a>`; }).join("")}</div>
    <p class="muted" style="font-size:13px;margin-top:8px">Daraja testining har bir qismi alohida baholanadi. Qismdan ${KLEVEL("A1").test.pass}% va undan yuqori olsangiz, oʻsha koʻnikmada daraja tasdiqlanadi.</p></section>`;
}
function ktPartHead(id, name) {
  const s = SKILLS.find(x => x.id === id);
  return `<div class="section-head"><h2><span class="tag ${s.c}-t" style="padding:6px;margin-right:6px">${ICON[s.ico]}</span>${esc(name)}</h2></div>`;
}
function ktListenHtml(lv, res, start) {
  const g = ktGen(lv);
  return `<section class="section">${ktPartHead("l", "Dinleme · Tinglash")}
    <p class="sub">Tugmani bosib tinglang va javobni tanlang. Matn koʻrsatilmaydi.</p>
    ${g.l.map((q, i) => { const chosen = KT_ANS.l[i]; return `<div class="k-item glass">
      <div class="k-q" style="display:flex;align-items:center;gap:10px"><b>${start + i + 1}.</b><button class="say" data-act="ls-play" data-t="${esc(q.t)}" aria-label="Tinglash">${ICON.speak}</button>
        <span>${q.kind === "word" ? "Soʻzning maʼnosini toping" : "Qaysi gapni eshitdingiz?"}</span>${res ? `<span lang="tr" class="muted">— ${esc(q.t)}</span>` : ""}</div>
      <div class="k-opts">${q.o.map((o, oi) => { let cls = chosen === oi ? " picked" : ""; if (res) cls = o === q.a ? " right" : chosen === oi ? " wrong" : ""; return `<button class="opt${cls}" data-act="kt-l" data-i="${i}" data-o="${oi}" ${q.kind === "line" ? 'lang="tr"' : ""} ${res ? "disabled" : ""}>${esc(o)}</button>`; }).join("")}</div></div>`; }).join("")}
  </section>`;
}
function ktWriteHtml(lv, res, start) {
  const g = ktGen(lv);
  return `<section class="section">${ktPartHead("w", "Yazma · Yozish")}
    ${g.w.map((q, i) => { const v = KT_ANS.w[i] || "", m = res ? ansMatch(v, q.a) : -1; return `<div class="k-item glass">
      <div class="k-q"><b>${start + i + 1}.</b> <small class="muted">${esc(q.title)}</small><div lang="tr" style="margin-top:4px">${esc(q.q)}</div></div>
      <div class="k-in"><input class="k-input${m > 0 ? " right" : m === 0 ? " wrong" : ""}" data-act="kt-w" data-i="${i}" value="${esc(v)}" lang="tr" ${bkAttr(q.a)} autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Javob…" ${res ? "disabled" : ""}></div>
      ${res && m <= 0 ? `<div class="k-fb"><span class="no">Toʻgʻri javob: <b lang="tr">${esc(q.a)}</b></span></div>` : ""}</div>`; }).join("")}
  </section>`;
}
function ktSpeakHtml(lv, res, start) {
  const g = ktGen(lv);
  if (!canListen()) return `<section class="section">${ktPartHead("s", "Konuşma · Gapirish")}<div class="notice"><div>Bu brauzer nutqni tanimaydi, shuning uchun gapirish qismi ishlamaydi. Natija 3 qism boʻyicha hisoblanadi. Chrome yoki Safari'da oching.</div></div></section>`;
  return `<section class="section">${ktPartHead("s", "Konuşma · Gapirish")}
    <p class="sub">Mikrofonni bosib ayting. Har savolni bir necha marta urinib koʻrish mumkin, eng yaxshi natija olinadi. Hozir gapira olmasangiz, bu qismni oʻtkazib yuboring: natija qolgan qismlar boʻyicha chiqadi.</p>
    ${g.s.map((q, i) => { const r = KT_ANS.s[i]; return `<div class="k-item glass">
      <div class="k-q"><b>${start + i + 1}.</b> ${q.kind === "oral" ? `<span>Savolga toʻliq gap bilan javob bering:</span><div lang="tr" style="margin-top:4px"><b>${esc(q.q)}</b></div>` : `<span>Gapni ovoz chiqarib ayting:</span><div lang="tr" style="margin-top:4px"><b>${esc(q.tr)}</b></div>`}</div>
      <div class="kt-mic-row">${res ? "" : `<button class="mic-btn kt-mic" data-act="kt-mic" data-l="${lv}" data-i="${i}" aria-label="Mikrofon">${ICON.mic}</button>`}
        <div class="kt-heard" id="kt-s-${i}">${r ? ktHeard(q, r) : res ? `<span class="muted">Javob berilmadi</span>` : `<span class="muted">Mikrofonni bosing</span>`}</div></div>
      ${res && q.kind === "oral" ? `<div class="k-fb"><span class="muted">Namuna: <b lang="tr">${esc(q.tr)}</b></span></div>` : ""}</div>`; }).join("")}
  </section>`;
}
const ktHeard = (q, r) => `<span lang="tr">«${esc(r.text)}»</span> <span class="tag ${r.score >= ktNeed(q) ? "green-t" : "pink-t"}">${Math.round(r.score * 100)}%</span>`;
// Records one answer with the browser's speech recognition and passes the best-scoring transcript to done()
/* One spoken answer, scored against q.tr (q.kind "oral" — key words of a free answer, otherwise a repeat, letter by
   letter). Faster than waiting for the browser: words come while they are said (interimResults), and a repeat that is
   already right (SR_EARLY) ends listening at once instead of after the browser's silence timeout; if listening ends
   without a final result (stopped by hand, some phones), the last words heard still count; a watchdog stops a
   recognizer that never ends. */
const SR_EARLY = 0.95, SR_MAX_MS = 12000;
function srStart(r, opts) {
  let alts = null, part = "", fin = false, dog = 0;
  const finish = list => { if (fin) return; fin = true; clearTimeout(dog); opts.end(list && list.length ? list : null); };
  r.onresult = ev => {
    const res = ev.results[ev.results.length - 1], list = [...res].map(a => a.transcript).filter(Boolean);
    if (!list.length) return;
    if (opts.heard) opts.heard(list[0]);
    if (res.isFinal) alts = list; else part = list[0];
    if (opts.early && opts.early(list[0]) >= SR_EARLY) { alts = list; try { r.abort(); } catch (e) {} finish(list); }
  };
  r.onerror = ev => { if (opts.error) opts.error(ev.error); };
  r.onend = () => finish(alts || (part ? [part] : null));
  r.start();
  dog = setTimeout(() => { try { r.stop(); } catch (e) {} setTimeout(() => finish(alts || (part ? [part] : null)), 1500); }, SR_MAX_MS);
  return () => fin;
}
function micCapture(q, btn, done) {
  if (KT_REC) { try { KT_REC.stop(); } catch (e) {} return; }
  ttsCancel();
  const r = new SR();
  r.lang = "tr-TR"; r.interimResults = true; r.maxAlternatives = 5;
  const score = a => q.kind === "oral" ? oralScore(q.tr, a).score : sayDiff(sayNorm(q.tr).out, heardNorm(a)).score;
  try {
    srStart(r, {
      early: q.kind === "oral" ? null : score,
      error: e => { if (e === "not-allowed" || e === "service-not-allowed") toast("Mikrofonga ruxsat berilmagan"); else if (e === "no-speech") toast("Ovoz eshitilmadi, yana urinib koʻring"); else if (e === "network") toast("Nutqni tanish uchun internet kerak"); },
      end: alts => {
        if (KT_REC === r) KT_REC = null;
        btn.classList.remove("on");
        if (!alts) return;
        let best = null;
        alts.forEach(a => { const sc = score(a); if (!best || sc > best.score) best = { score: sc, text: a }; });
        done(best);
      }
    });
    KT_REC = r; btn.classList.add("on");
  } catch (e) { toast("Mikrofonni ishga tushirib boʻlmadi"); }
}
const keepBest = (store, i, best) => { if (!store[i] || best.score > store[i].score) store[i] = best; return store[i]; };
function ktMic(lv, i, btn) {
  const q = ktGen(lv).s[i];
  micCapture(q, btn, best => { const r = keepBest(KT_ANS.s, i, best), el = $(`kt-s-${i}`); if (el) el.innerHTML = ktHeard(q, r); });
}
function plMic(i, btn) {
  const q = plGet().it.s[i];
  micCapture(q, btn, best => { const r = keepBest(plGet().ans.s, i, best), el = $(`pl-s-${i}`); if (el) el.innerHTML = ktHeard(q, r); });
}
/* ---------- Placement test (Darajani aniqlash) ----------
   A1 → C1 in three stages (A1–A2, B1–B2, C1). Every level: 4 reading/grammar questions and 2 writing tasks from the
   separate bank (placement.js), 2 listening items (course lines, and from B1 a meaning question from the bank), speaking
   at A1 and B1 (optional). The next stage opens only when every level so far is passed, so a learner who stops at A2
   is not asked C1 questions, and a C1 result needs the C1 stage: 70% of a level (75% for B2 and C1), with at least half
   of its reading and half of its writing right — writing has to be produced, it cannot be guessed. "Bilmayman" is always
   an option. The highest level passed decides where the course starts (S.kStart); earlier units stay open. */
let PL = null, PLB_P = null;
const PL_STAGES = [["A1", "A2"], ["B1", "B2"], ["C1"]];
const plStage = lv => PL_STAGES.findIndex(st => st.includes(lv));
const plNeed = lv => (lv === "B2" || lv === "C1" ? 75 : 70);
const plbReady = () => typeof PLB !== "undefined";
function loadPlb() {
  if (plbReady()) return Promise.resolve();
  return PLB_P || (PLB_P = new Promise((ok, fail) => { const sc = document.createElement("script"); sc.src = "placement.js"; sc.onload = ok; sc.onerror = () => { PLB_P = null; sc.remove(); fail(); }; document.head.appendChild(sc); }));
}
// A multiple-choice item with its options shuffled (a: index for reading, the text for listening)
function plMix(q) { const o = shuffle(q.o.slice()); return typeof q.a === "number" ? Object.assign({}, q, { o, a: o.indexOf(q.o[q.a]) }) : Object.assign({}, q, { o }); }
function plGen() {
  const it = { r: [], l: [], w: [], s: [] };
  PL_LVS.forEach(lv => {
    const saved = KT_GEN[lv]; KT_GEN[lv] = null;
    const g = ktGen(lv), B = PLB[lv];
    KT_GEN[lv] = saved;
    shuffle(B.r.slice()).slice(0, 4).forEach(q => it.r.push(Object.assign(plMix(q), { lv })));
    const words = g.l.filter(x => x.kind === "word"), lines = shuffle(g.l.filter(x => x.kind === "line"));
    const li = lv === "A1" ? [words[0], lines[0]] : B.l ? [lines[0], Object.assign(plMix(shuffle(B.l.slice())[0]), { kind: "mean" })] : lines.slice(0, 2);
    li.filter(Boolean).forEach(x => it.l.push(Object.assign({}, x, { lv })));
    shuffle(B.w.slice()).slice(0, 2).forEach(q => it.w.push(Object.assign({}, q, { lv })));
    if (lv === "A1" || lv === "B1") { const sp = g.s.find(x => x.kind === "line") || g.s[0]; if (sp) it.s.push(Object.assign({ lv }, sp)); }
  });
  return { it, ans: { r: {}, l: {}, w: {}, s: {} }, stage: 0, res: null };
}
const plGet = () => PL || (PL = plGen());
// Question numbers in the order they are shown (only the stages opened so far)
function plNums(P) {
  const nums = { r: [], l: [], w: [], s: [] };
  let n = 0;
  for (let st = 0; st <= P.stage; st++) ["r", "l", "w", "s"].forEach(k => P.it[k].forEach((q, i) => { if (plStage(q.lv) === st) nums[k][i] = ++n; }));
  return nums;
}
function plRows(P) {
  const it = P.it, vis = q => plStage(q.lv) <= P.stage, sTried = canListen() && Object.keys(P.ans.s).length > 0;
  return [
    ...it.r.map((q, i) => vis(q) && { sk: "r", lv: q.lv, ok: P.ans.r[i] === q.a }),
    ...it.l.map((q, i) => vis(q) && { sk: "l", lv: q.lv, ok: q.o[P.ans.l[i]] === q.a }),
    ...it.w.map((q, i) => vis(q) && { sk: "w", lv: q.lv, ok: ansMatch(P.ans.w[i] || "", q.a) > 0 }),
    ...(sTried ? it.s.map((q, i) => vis(q) && { sk: "s", lv: q.lv, ok: !!P.ans.s[i] && P.ans.s[i].score >= ktNeed(q) }) : [])
  ].filter(Boolean);
}
function plLevel(rows, lv) {
  const r = rows.filter(x => x.lv === lv);
  if (!r.length) return { pct: null, ok: false };
  const part = sk => { const q = r.filter(x => x.sk === sk); return q.length ? q.filter(x => x.ok).length / q.length : 1; };
  const pct = Math.round(r.filter(x => x.ok).length / r.length * 100);
  return { pct, ok: pct >= plNeed(lv) && part("r") >= 0.5 && part("w") >= 0.5 };
}
function plHomeCard() {
  if (S.place || kDoneCount() > 0 || S.xp > 400) return "";
  return `<div class="pcard glass">
    <div class="pcard-head"><b>${ICON.target}Turkchani biroz bilasizmi?</b><span class="tag teal-t">10–15 daq</span></div>
    <p class="muted">Bosqichma-bosqich test darajangizni aniqlaydi va kursni mos joydan boshlaydi: oʻqish, tinglash, yozish va gapirish boʻyicha.</p>
    <a class="btn btn-grad btn-block" href="#placement" style="margin-top:8px">Darajani aniqlash</a>
    <button class="link" data-act="pl-skip" style="display:block;margin:10px auto 0">Kerak emas, A1 dan boshlayman</button>
  </div>`;
}
function plSection(id, name, sub, body) {
  return `<section class="section">${ktPartHead(id, name)}${sub ? `<p class="sub">${sub}</p>` : ""}${body}</section>`;
}
function plStageHtml(P, st, nums) {
  const res = P.res, it = P.it, locked = !!res || st < P.stage, here = q => plStage(q.lv) === st;
  const pick = k => it[k].map((q, i) => [q, i]).filter(([q]) => here(q));
  const opts = (kind, i, q, chosen, trLang) => `<div class="k-opts">${q.o.map((o, oi) => {
    let cls = chosen === oi ? " picked" : "";
    if (res) cls = (kind === "r" ? oi === q.a : o === q.a) ? " right" : chosen === oi ? " wrong" : "";
    return `<button class="opt${cls}" data-act="pl-${kind}" data-i="${i}" data-o="${oi}" ${trLang ? 'lang="tr"' : ""} ${locked ? "disabled" : ""}>${esc(o)}</button>`;
  }).join("")}<button class="opt opt-idk${chosen === q.o.length ? (res ? " wrong" : " picked") : ""}" data-act="pl-${kind}" data-i="${i}" data-o="${q.o.length}" ${locked ? "disabled" : ""}>Bilmayman</button></div>`;
  const lvs = PL_STAGES[st];
  const body = plSection("r", "Okuma · Grammatika va lugʻat", "", pick("r").map(([q, i]) => `<div class="k-item glass"><div class="k-q"><b>${nums.r[i]}.</b> <span lang="tr">${esc(q.q)}</span></div>${opts("r", i, q, P.ans.r[i], true)}</div>`).join(""))
  + plSection("l", "Dinleme · Tinglash", "Tugmani bosib tinglang. Matn koʻrsatilmaydi.", pick("l").map(([q, i]) => `<div class="k-item glass">
      <div class="k-q" style="display:flex;align-items:center;gap:10px"><b>${nums.l[i]}.</b><button class="say" data-act="ls-play" data-t="${esc(q.t)}" aria-label="Tinglash">${ICON.speak}</button><span>${q.kind === "word" ? "Soʻzning maʼnosini toping" : q.kind === "mean" ? "Eshitgan gapingiz maʼnosini toping" : "Qaysi gapni eshitdingiz?"}</span>${res ? `<span lang="tr" class="muted">— ${esc(q.t)}</span>` : ""}</div>
      ${opts("l", i, q, P.ans.l[i], q.kind === "line")}</div>`).join(""))
  + plSection("w", "Yazma · Yozish", "", pick("w").map(([q, i]) => { const v = P.ans.w[i] || "", m = res ? ansMatch(v, q.a) : -1; return `<div class="k-item glass">
      <div class="k-q"><b>${nums.w[i]}.</b> <small class="muted">${esc(q.title)}</small><div lang="tr" style="margin-top:4px">${esc(q.q)}</div></div>
      <div class="k-in"><input class="k-input${m > 0 ? " right" : m === 0 ? " wrong" : ""}" data-act="pl-w" data-i="${i}" value="${esc(v)}" lang="tr" ${bkAttr(q.a)} autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Bilmasangiz, boʻsh qoldiring" ${locked ? "disabled" : ""}></div>
      ${res && m <= 0 ? `<div class="k-fb"><span class="no">Toʻgʻri javob: <b lang="tr">${esc(q.a)}</b></span></div>` : ""}</div>`; }).join(""))
  + (canListen() && pick("s").length ? plSection("s", "Konuşma · Gapirish", "Ixtiyoriy: hozir gapira olmasangiz, oʻtkazib yuboring.", pick("s").map(([q, i]) => { const r = P.ans.s[i]; return `<div class="k-item glass">
      <div class="k-q"><b>${nums.s[i]}.</b> Gapni ovoz chiqarib ayting:<div lang="tr" style="margin-top:4px"><b>${esc(q.tr)}</b></div></div>
      <div class="kt-mic-row">${locked ? "" : `<button class="mic-btn kt-mic" data-act="pl-mic" data-i="${i}" aria-label="Mikrofon">${ICON.mic}</button>`}<div class="kt-heard" id="pl-s-${i}">${r ? ktHeard(q, r) : `<span class="muted">${res ? "Javob berilmadi" : locked ? "Oʻtkazib yuborildi" : "Mikrofonni bosing"}</span>`}</div></div></div>`; }).join("")) : "");
  const head = `<span class="pl-st-n">${st + 1}-bosqich</span><b>${lvs.join("–")}</b>`;
  return st < P.stage
    ? `<details class="pl-stage glass" data-stage="${st}"><summary>${head}<span class="tag green-t">${ICON.check}${lvs.map(lv => `${lv}: ${plLevel(plRows(P), lv).pct}%`).join(" · ")}</span></summary>${body}</details>`
    : `<div class="pl-stage-head" data-stage="${st}">${head}<span class="tag violet-t">${PL_STAGES.length} bosqichdan</span></div>${body}`;
}
function viewPlacement() {
  if (!plbReady()) return catLoader();
  const P = plGet(), res = P.res, nums = plNums(P);
  const last = P.stage === PL_STAGES.length - 1;
  return `<div><a class="back" href="#course">${ICON.back}Kurs</a></div>
  <div class="lesson-head"><div class="tags"><span class="tag teal-t">${ICON.target}A1 → C1</span><span class="tag violet-t">3 bosqich · 10–15 daq</span></div>
    <h1>Darajani aniqlash</h1>
    <p class="sub">Test bosqichma-bosqich qiyinlashadi: A1–A2, B1–B2, C1. Keyingi bosqich oldingisini yaxshi bajarsangiz ochiladi. Bilmagan savolingizda taxmin qilmang — «Bilmayman» ni tanlang: natija shunda aniqroq chiqadi.</p></div>
  ${res ? plResultHtml(res) : ""}
  ${PL_STAGES.map((x, st) => st <= P.stage ? plStageHtml(P, st, nums) : "").join("")}
  ${res ? `<button class="btn btn-ghost btn-block" data-act="pl-again">Qayta topshirish</button>` : `<button class="btn btn-grad btn-block" data-act="pl-done">${last ? "Natijani koʻrish" : "Tekshirish va davom etish"}</button>`}`;
}
function plFinish() {
  const P = plGet(), it = P.it, cur = q => plStage(q.lv) === P.stage, nums = plNums(P);
  const mr = it.r.findIndex((q, i) => cur(q) && P.ans.r[i] === undefined);
  if (mr >= 0) { toast(`${nums.r[mr]}-savolga javob tanlanmagan`); return; }
  const ml = it.l.findIndex((q, i) => cur(q) && P.ans.l[i] === undefined);
  if (ml >= 0) { toast(`${nums.l[ml]}-savolga javob tanlanmagan`); return; }
  if (KT_REC) { try { KT_REC.abort(); } catch (e) {} KT_REC = null; }
  const rows = plRows(P);
  // Every level so far passed → the next stage opens
  const done = PL_STAGES.slice(0, P.stage + 1).flat();
  if (P.stage < PL_STAGES.length - 1 && done.every(lv => plLevel(rows, lv).ok)) {
    P.stage++;
    route();
    toast(`Zoʻr! ${P.stage + 1}-bosqich: ${PL_STAGES[P.stage].join("–")}`);
    setTimeout(() => { const el = document.querySelector(`.pl-stage-head[data-stage="${P.stage}"]`); if (el) el.scrollIntoView({ block: "start", behavior: "smooth" }); }, 60);
    return;
  }
  const byLv = {};
  PL_LVS.forEach(lv => { byLv[lv] = plLevel(rows, lv).pct; });
  // Highest level passed, counting up from A1 without gaps
  let passed = null;
  for (const lv of PL_LVS) { if (plLevel(rows, lv).ok) passed = lv; else break; }
  const start = !passed ? "A1" : passed === PL_LVS[PL_LVS.length - 1] ? passed : PL_LVS[PL_LVS.indexOf(passed) + 1];
  const sk = {};
  SKILLS.forEach(s => {
    const r = rows.filter(x => x.sk === s.id);
    if (!r.length) { sk[s.id] = null; return; }
    let best = "";
    for (const lv of PL_LVS) { const q = r.filter(x => x.lv === lv); if (!q.length) continue; if (q.filter(x => x.ok).length / q.length >= 0.5) best = lv; else break; }
    sk[s.id] = best;
  });
  rows.forEach(x => skillLog(x.sk, x.ok));
  P.res = { byLv, passed, start, sk };
  S.place = { at: todayKey(), passed, start, sk };
  xpAward("reading", { right: rows.filter(x => x.ok).length, n: rows.length, key: "placement", sk: SKILLS.map(s => s.id) });
  pamukSay("happy", passed ? `Ajoyib! ${passed} darajasidagi savollarni yaxshi bildingiz.` : "Zoʻr, endi qayerdan boshlashni bilamiz!");
  window.scrollTo(0, 0); route();
}
function plResultHtml(r) {
  const su = COURSE.units.find(u => u.level === r.start);
  return `<div class="glass pad k-result pass">${mascot("trophy")}<h2>${r.start}</h2>
    <p>${r.passed ? `Natija: <b>${r.passed}</b>. ${r.passed === "C1" ? "Siz eng yuqori bosqichdan ham oʻtdingiz — C1 kursi va imtihon koʻnikmalari bilan mahoratingizni mustahkamlang." : `Kursni <b>${r.start}</b> dan boshlashni tavsiya qilamiz.`}` : "Kursni boshidan — A1 dan boshlashni tavsiya qilamiz. Har bir boʻlim sizga mos tezlikda."}</p>
    <p class="muted" style="font-size:13px">Daraja hisoblanishi uchun shu darajadagi savollarning 70% (B2 va C1 da 75%) toʻgʻri boʻlishi, oʻqish va yozishning har biridan kamida yarmi toʻgʻri boʻlishi kerak.</p>
    <div class="sk-bars" style="text-align:left;margin-top:10px;width:100%;align-self:stretch">${PL_LVS.map(lv => `<div class="sk-line"><span></span><span class="sk-name"><b>${lv}</b><small>savollar</small></span>
      <span class="sk-track"><i style="width:${r.byLv[lv] || 0}%;background:var(--${r.byLv[lv] >= plNeed(lv) ? "green" : "pink"})"></i></span><span class="sk-val">${r.byLv[lv] === null ? "—" : `${r.byLv[lv]}%`}<small>${r.byLv[lv] === null ? "" : PL_LVS.indexOf(lv) <= PL_LVS.indexOf(r.passed) ? "✔" : "✘"}</small></span></div>`).join("")}</div>
    <div class="tags" style="justify-content:center;margin-top:10px">${SKILLS.map(s => `<span class="tag ${s.c}-t">${s.tr}: ${r.sk[s.id] === null ? "—" : r.sk[s.id] || "boshlangʻich"}</span>`).join("")}</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;width:100%">
      <button class="btn btn-grad btn-block" data-act="pl-apply" data-l="${r.start}">${su ? `${su.level}.${su.n} dan boshlash` : "Boshlash"}</button>
      ${r.start !== "A1" ? `<button class="btn btn-ghost btn-block" data-act="pl-apply" data-l="A1">Baribir A1 dan boshlayman</button>` : ""}
    </div>
    <p class="muted" style="font-size:13px;margin-top:8px">Oldingi boʻlimlar ochiq qoladi: istalgan vaqtda qaytib takrorlashingiz mumkin. Darajani tasdiqlash uchun keyin daraja testini topshiring.</p>
  </div>`;
}
function plApply(lv) {
  S.kStart = Math.max(0, COURSE.units.findIndex(u => u.level === lv));
  if (S.place) S.place.applied = lv; else S.place = { at: todayKey(), applied: lv };
  KLV = lv; save();
  toast(`Kurs ${lv} dan boshlanadi`);
  go("course");
}
function ktFinish(lv) {
  const t = KLEVEL(lv).test, qs = t.parts.flatMap(p => p.qs), g = ktGen(lv);
  const miss = qs.findIndex((q, i) => KTEST_ANS[i] === undefined);
  if (miss >= 0) { toast(`Okuma: ${miss + 1}-savolga javob tanlanmagan`); return; }
  const lMiss = g.l.findIndex((q, i) => KT_ANS.l[i] === undefined);
  if (lMiss >= 0) { toast(`Dinleme: ${qs.length + lMiss + 1}-savolga javob tanlanmagan`); return; }
  if (KT_REC) { try { KT_REC.abort(); } catch (e) {} KT_REC = null; }
  const rOk = qs.map((q, i) => KTEST_ANS[i] === q.a);
  const lOk = g.l.map((q, i) => q.o[KT_ANS.l[i]] === q.a);
  const wOk = g.w.map((q, i) => ansMatch(KT_ANS.w[i] || "", q.a) > 0);
  const sTried = canListen() && Object.keys(KT_ANS.s).length > 0;
  const sOk = g.s.map((q, i) => !!KT_ANS.s[i] && KT_ANS.s[i].score >= ktNeed(q));
  const share = a => a.length ? Math.round(a.filter(Boolean).length / a.length * 100) : null;
  const parts = { r: share(rOk), l: share(lOk), w: share(wOk), s: sTried ? share(sOk) : null };
  const vals = Object.values(parts).filter(v => v !== null), p = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  KTEST_RES = { lv, pct: p, parts };
  rOk.forEach(ok => skillLog("r", ok)); lOk.forEach(ok => skillLog("l", ok)); wOk.forEach(ok => skillLog("w", ok));
  if (sTried) sOk.forEach(ok => skillLog("s", ok));
  S.ktest[lv] = Math.max(kTestBest(lv), p);
  S.ktsk = S.ktsk || {};
  const best = S.ktsk[lv] || (S.ktsk[lv] = {});
  Object.keys(parts).forEach(k => { if (parts[k] !== null) best[k] = Math.max(best[k] || 0, parts[k]); });
  // Each part pays like its own exercise: Okuma 40, Dinleme 40, Yazma 60, Konuşma 60
  const kinds = { r: "reading", l: "listening", w: "writing", s: "speaking" }, got = { r: rOk, l: lOk, w: wOk, s: sTried ? sOk : [] };
  KTEST_RES.xp = Object.keys(kinds).reduce((sum, k) => got[k].length ? sum + xpAward(kinds[k], { right: got[k].filter(Boolean).length, n: got[k].length, key: `kt|${lv}|${k}`, sk: [k] }).xp : sum, 0);
  if (p >= t.pass) pamukSay("happy", `${p}% — Tabriklaymiz! Siz ${lv} darajasini tasdiqladingiz!`); else pamukSay("sad", `${p}% — Afsus, bu safar oʻtmadi. Zaif qismni takrorlab, yana urinib koʻring!`);
  window.scrollTo(0, 0); route();
}
function ktResultHtml(res, pass) {
  return `<div class="glass pad k-result ${res.pct >= pass ? "pass" : "fail"}">${mascot(res.pct >= pass ? "trophy" : "sit")}<h2>${res.pct}%</h2>
    <p>${res.pct >= pass ? "Tabriklaymiz! Siz bu darajani muvaffaqiyatli yakunladingiz." : "Hali biroz mashq kerak. Zaif qismni takrorlab, yana urinib koʻring."}</p>
    ${res.parts ? `<div class="sk-bars" style="text-align:left;margin-top:10px;width:100%;align-self:stretch">${SKILLS.map(s => { const v = res.parts[s.id]; return `<div class="sk-line">
      <span class="ico ${s.c}-t">${ICON[s.ico]}</span><span class="sk-name"><b>${s.tr}</b><small>${s.uz}</small></span>
      <span class="sk-track"><i style="width:${v || 0}%;background:var(--${s.c})"></i></span>
      <span class="sk-val">${v === null ? "—" : v + "%"}<small>${v === null ? "topshirilmadi" : v >= pass ? "✔ oʻtdi" : "✘"}</small></span></div>`; }).join("")}</div>` : ""}
    ${res.xp !== undefined ? `<p><b>+${res.xp} XP</b>${res.xp ? "" : " · bu testni bugun allaqachon topshirgansiz"}</p>` : ""}
  </div>`;
}
