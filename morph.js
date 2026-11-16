/* Türkçe Yoʻl — turkcha soʻz tahlilchisi va yasovchisi (oʻzak + qoʻshimchalar). Oʻzimiz yozgan, tashqi kutubxonasiz.
   Morph.load([[turkcha, oʻzbekcha], …]) — lugʻat; Morph.parse(soʻz) — talqinlar (eng ehtimollisi birinchi);
   Morph.fix(soʻz) — qoʻshimchasi xato yozilgan soʻzning toʻgʻri shakli; Morph.build(oʻzak, [teglar]) — shakl yasash.
   Each analysis: { lem, uz, pos, root (surface), parts: [{ s, t }], cost }. */
var Morph = (function () {
  "use strict";
  const VOW = "aeıioöuüâîû", VL = "fstkçşhp";
  const isV = c => !!c && VOW.includes(c);
  const nv = c => c === "â" ? "a" : c === "î" ? "i" : c === "û" ? "u" : c;
  const lastV = s => { for (let i = s.length - 1; i >= 0; i--) if (isV(s[i])) return nv(s[i]); return ""; };
  const syl = s => { let n = 0; for (const c of s) if (isV(c)) n++; return n; };
  const FRONT = { a: "e", ı: "i", o: "ö", u: "ü" };
  const hA = v => "aıou".includes(v) ? "a" : "e";
  const hI = v => v === "a" || v === "ı" ? "ı" : v === "o" || v === "u" ? "u" : v === "ö" || v === "ü" ? "ü" : "i";
  const low = s => String(s).toLocaleLowerCase("tr");

  /* A suffix pattern → its surface after this stem. A, I — vowels by harmony; D, C — d/t, c/ç by the last sound;
     (y) (n) (s) — a buffer consonant after a vowel; (I) (A) — a buffer vowel after a consonant.
     lax: every variant (used to recognise a misspelt suffix). */
  function forms(stem, hv, pat, lax) {
    const toks = pat.match(/\(.\)|./g), endV = isV(stem[stem.length - 1]);
    let outs = [""], v = hv, prev = stem[stem.length - 1] || "";
    const add = opts => { const n = []; for (const o of outs) for (const x of opts) n.push(o + x); outs = n; };
    for (const tk of toks) {
      if (tk.length === 3) {
        const c = tk[1], vowel = c === "I" || c === "A";
        if (lax) { add(["", ...(c === "I" ? ["ı", "i", "u", "ü"] : c === "A" ? ["a", "e"] : [c])]); continue; }
        if (vowel === endV) continue;
        const ch = c === "I" ? hI(v) : c === "A" ? hA(v) : c;
        add([ch]); prev = ch; if (vowel) v = ch;
      } else if (tk === "A") { if (lax) add(["a", "e"]); else { const ch = hA(v); add([ch]); v = ch; prev = ch; } }
      else if (tk === "I") { if (lax) add(["ı", "i", "u", "ü"]); else { const ch = hI(v); add([ch]); v = ch; prev = ch; } }
      else if (tk === "D") { if (lax) add(["d", "t"]); else { const ch = VL.includes(prev) ? "t" : "d"; add([ch]); prev = ch; } }
      else if (tk === "C") { if (lax) add(["c", "ç"]); else { const ch = VL.includes(prev) ? "ç" : "c"; add([ch]); prev = ch; } }
      else { add([tk]); prev = tk; if (isV(tk)) v = nv(tk); }
    }
    return lax ? [...new Set(outs)].filter(Boolean) : outs;
  }

  /* ---------- Suffixes by state. t — tag, p — pattern (or a function of the context), to — next state, c — cost ---------- */
  const AOR_IR = new Set(["al", "bil", "bul", "dur", "gel", "gör", "kal", "ol", "öl", "san", "var", "ver", "vur"]);
  const CAUS_IR = new Set(["iç", "piş", "düş", "kaç", "doğ", "bat", "bit", "geç", "uç", "yat", "art", "duy", "doy", "şiş", "göç", "taş", "aş", "kop", "çık", "git", "on"]);
  const aor = x => x.lax ? ["Ar", "Ir", "r"] : isV(x.stem[x.stem.length - 1]) ? "r" : x.np === 0 && /[ae]d$/.test(x.stem) && ED.has(x.stem.slice(0, -1) + "t") ? "Ar" : x.np === 0 && x.stem === "vazgeç" ? "Ar" : syl(x.stem) > 1 || (x.np === 0 && AOR_IR.has(x.stem)) ? "Ir" : x.np === 0 && x.stem === "kon" ? ["Ar", "Ir"] : "Ar";
  const pass = x => { const l = x.stem[x.stem.length - 1]; return x.lax ? ["Il", "In", "n"] : isV(l) ? "n" : l === "l" ? "In" : "Il"; };
  const caus = x => { const l = x.stem[x.stem.length - 1]; if (x.lax) return ["DIr", "t"]; if (x.np === 0 && CAUS_IR.has(x.stem)) return x.stem === "çık" || x.stem === "kop" || x.stem === "on" || x.stem === "git" ? "Ar" : "Ir"; return isV(l) || (syl(x.stem) > 1 && (l === "r" || l === "l")) ? "t" : "DIr"; };
  const ki = x => /[gd]ün$/.test(x.stem) ? "kü" : "ki";
  const notAE = x => x.lax || !/[ae]$/.test(x.stem) ? "(I)yor" : null;

  const P1 = [["S1s", "(y)Im"], ["S2s", "sIn"], ["S1p", "(y)Iz"], ["S2p", "sInIz"], ["S3p", "lAr"]];
  const P2 = [["S1s", "m"], ["S2s", "n"], ["S1p", "k"], ["S2p", "nIz"], ["S3p", "lAr"]];
  const per = (list, to) => list.map(([t, p]) => ({ t, p, to: to !== "END" ? to : t === "S3p" ? "END3" : "END1", c: 0.6 }));
  const COP = [
    ...per(P1.slice(0, 4), "END"),
    { t: "DIR", p: "DIr", to: "END" }, { t: "CPST", p: "(y)DI", to: "E2" }, { t: "CEV", p: "(y)mIş", to: "E1" },
    { t: "CCOND", p: "(y)sA", to: "E2" }, { t: "KEN", p: "(y)ken", to: "END" }
  ];
  const DER = [
    { t: "LI", p: "lI", to: "NOM", c: 1.4 }, { t: "SIZ", p: "sIz", to: "NOM", c: 1.4 }, { t: "LIK", p: "lIk", to: "NOM", c: 1.5, soft: 1 },
    { t: "CI", p: "CI", to: "NOM", c: 1.5 }, { t: "DIM", p: "CIk", to: "NOM", c: 2, soft: 1 }
  ];
  const POSS = [["P1s", "(I)m"], ["P2s", "(I)n", 1.6], ["P1p", "(I)mIz"], ["P2p", "(I)nIz"]].map(([t, p, c]) => ({ t, p, to: "NPOSS", c }));
  const CASE = [["ACC", "(y)I"], ["DAT", "(y)A"], ["LOC", "DA"], ["ABL", "DAn"], ["GEN", "(n)In"], ["INS", "(y)lA"], ["EQU", "CA", 1.3]].map(([t, p, c]) => ({ t, p, to: t === "LOC" || t === "GEN" ? "NCK" : "NCASE", c }));
  const CASEN = [["ACC", "nI"], ["DAT", "nA"], ["LOC", "nDA"], ["ABL", "nDAn"], ["GEN", "nIn"], ["INS", "ylA"], ["EQU", "ncA", 1.3]].map(([t, p, c]) => ({ t, p, to: t === "LOC" || t === "GEN" ? "NCK" : "NCASE", c }));
  const TENSE = [
    { t: "PROG", p: notAE, to: "T1" }, { t: "FUT", p: "(y)AcAk", to: "T1", soft: 1 }, { t: "EVID", p: "mIş", to: "T1" },
    { t: "NEC", p: "mAlI", to: "T1" }, { t: "PAST", p: "DI", to: "T2" }, { t: "COND", p: "sA", to: "T2" },
    { t: "OPT1s", p: "(y)AyIm", to: "END" }, { t: "OPT1p", p: "(y)AlIm", to: "END" }, { t: "OPT2s", p: "(y)AsIn", to: "END", c: 1.6 },
    { t: "IMP2p", p: "(y)In", to: "END" }, { t: "IMP2pp", p: "(y)InIz", to: "END" }, { t: "IMP3s", p: "sIn", to: "END" }, { t: "IMP3p", p: "sInlAr", to: "END" },
    { t: "INF", p: "mAk", to: "NINF" }, { t: "IS", p: "(y)Iş", to: "NOM", c: 1.5 },
    { t: "PART", p: "(y)An", to: "NOM", c: 1.1 }, { t: "DIK", p: "DIk", to: "NDIK", c: 1.2, soft: 1 }, { t: "FUTP", p: "(y)AcAk", to: "NDIK", c: 1.5, soft: 1 },
    { t: "IP", p: "(y)Ip", to: "END" }, { t: "ARAK", p: "(y)ArAk", to: "END" }, { t: "INCA", p: "(y)IncA", to: "NINCA" },
    { t: "ALI", p: "(y)AlI", to: "END", c: 1.6 }, { t: "MAKSIZIN", p: "mAksIzIn", to: "END" }, { t: "ASI", p: "(y)AsI", to: "NPOSS0", c: 1.8 }, { t: "A", p: "(y)A", to: "END", c: 2.2 }, { t: "DIKCA", p: "DIkçA", to: "END" }, { t: "AGT", p: "(y)IcI", to: "NOM", c: 1.6 }
  ];
  const ST = {
    NOM: [...DER, { t: "KI", p: ki, to: "NKI", c: 1.6 }, { t: "LA", p: "lA", to: "V", c: 2.6, yor: "l" }, { t: "LAN", p: "lAn", to: "V", c: 2.6 }, { t: "LAS", p: "lAş", to: "V", c: 2.6 }, { t: "PL", p: "lAr", to: "NPL" }, ...POSS, { t: "P3s", p: "(s)I", to: "NP3" }, { t: "P3p", p: "lArI", to: "NP3", c: 1.2 }, ...CASE, ...COP],
    NPL: [...POSS, { t: "P3s", p: "(s)I", to: "NP3", c: 1.1 }, ...CASE, ...COP],
    NPOSS: [...CASE, ...COP], NPOSS0: [...POSS],
    NP3: [...CASEN, ...COP],
    NCASE: [...COP, { t: "S3p", p: "lAr", to: "END", c: 1.5 }],
    NCK: [{ t: "KI", p: ki, to: "NKI" }, ...COP, { t: "S3p", p: "lAr", to: "END", c: 1.5 }],
    NKI: [{ t: "PL", p: "lAr", to: "NPL" }, ...CASEN, ...COP],
    NPRO: [...COP],
    E1: per(P1, "END"), E2: per(P2, "END"), END: [], END1: [{ t: "DIR", p: "DIr", to: "END" }], NINCA: [{ t: "DAT", p: "(y)A", to: "END" }],
    END3: [{ t: "DIR", p: "DIr", to: "END" }, { t: "CPST", p: "DI", to: "END" }, { t: "CEV", p: "mIş", to: "END" }, { t: "CCOND", p: "sA", to: "END" }],
    V: [
      { t: "CAUS", p: caus, to: "V", c: 2, voice: 1 }, { t: "PASS", p: pass, to: "V", c: 2, voice: 1 }, { t: "RECIP", p: "(I)ş", to: "V", c: 3, voice: 1 },
      { t: "ABIL", p: "(y)Abil", to: "VA" }, { t: "IVER", p: "(y)Iver", to: "VA", c: 1.8 }, { t: "AKAL", p: "(y)AkAl", to: "VA", c: 2.2 }, { t: "AYAZ", p: "(y)Ayaz", to: "VA", c: 2.2 }, { t: "ADUR", p: "(y)Adur", to: "VA", c: 2.2 },
      { t: "NEG", p: "mA", to: "VN", yor: "m" }, { t: "INAB", p: "(y)AmA", to: "VN", yor: "(y)Am" },
      { t: "AOR", p: aor, to: "T1" }, { t: "MADAN", p: "mAdAn", to: "END" }, { t: "VN", p: "mA", to: "NOM", c: 1.3 }, ...TENSE
    ],
    VA: [{ t: "AOR", p: aor, to: "T1" }, { t: "NEG", p: "mA", to: "VN", yor: "m", c: 1.5 }, { t: "VN", p: "mA", to: "NOM", c: 1.4 }, ...TENSE],
    VN: [{ t: "NAOR", p: "z", to: "T1" }, { t: "NAOR1s", p: "m", to: "END" }, { t: "NAOR1p", p: "yIz", to: "END" }, { t: "VN", p: "mA", to: "NOM", c: 1.5 }, ...TENSE.filter(s => s.t !== "IS")],
    T1: [{ t: "CASINA", p: "CAsInA", to: "END", c: 1.5 }, { t: "LIK", p: "lIk", to: "NOM", c: 2.2, soft: 1 }, ...per(P1, "END"), { t: "DIR", p: "DIr", to: "END" }, { t: "CPST", p: "(y)DI", to: "E2" }, { t: "CEV", p: "(y)mIş", to: "E1" }, { t: "CCOND", p: "(y)sA", to: "E2" }, { t: "KEN", p: "(y)ken", to: "END" }],
    T2: [...per(P2, "END"), { t: "CCOND", p: "(y)sA", to: "E2" }, { t: "CPST", p: "(y)DI", to: "E2" }],
    NINF: [{ t: "LOC", p: "DA", to: "NCASE" }, { t: "ABL", p: "DAn", to: "NCASE" }, { t: "INS", p: "lA", to: "NCASE" }, { t: "DIR", p: "DIr", to: "END" }, { t: "CPST", p: "DI", to: "E2" }, { t: "CEV", p: "mIş", to: "E1" }],
    NDIK: [...POSS, { t: "P3s", p: "(s)I", to: "NP3" }, { t: "P3p", p: "lArI", to: "NP3" }, { t: "PL", p: "lAr", to: "NPL" }, { t: "LOC", p: "DA", to: "NCASE" }, { t: "ABL", p: "DAn", to: "NCASE" }, { t: "DAT", p: "(y)A", to: "NCASE" }, { t: "ACC", p: "(y)I", to: "NCASE" }]
  };
  const FINAL = new Set(["END3", "END1", "NINCA", "NOM", "NPL", "NPOSS", "NP3", "NCASE", "NCK", "NKI", "NPRO", "END", "E1", "E2", "T1", "T2", "V", "VA", "VN", "NINF", "NDIK"]);

  /* ---------- Lexicon: surface of a root → entries { lem, uz, pos, st, hv, need, pre, no } ---------- */
  let LEX = new Map(), LEMMAS = new Map(), MAXR = 0;
  // Words whose last consonant softens (t → d) or does not (k stays), dropped vowels, doubled consonants, front harmony
  const T_SOFT = "kanat kâğıt kağıt yoğurt armut kilit senet umut öğüt geçit yiğit tat yurt dert kurt art ant cilt vücut maksat şahit tehdit standart dört damat mabet mescit evlat simit icat murat".split(" ");
  const K_KEEP = "hukuk ahlak ittifak iştirak idrak erzak infilak evrak emlak tebrik şefkat tasdik tahkik".split(" ");
  const MONO_SOFT = "çok gök renk denk uç taç güç borç genç harç dip kap kalp cep sac kök? ak? burç tunç dinç hınç grup".split(" ").filter(w => !w.endsWith("?"));
  const DROP = { burun: "burn", ağız: "ağz", isim: "ism", şehir: "şehr", resim: "resm", oğul: "oğl", karın: "karn", alın: "aln", omuz: "omz", boyun: "boyn", göğüs: "göğs", beyin: "beyn", akıl: "akl", fikir: "fikr", vakit: "vakt", ömür: "ömr", sabır: "sabr", şekil: "şekl", hüküm: "hükm", nehir: "nehr", metin: "metn", kısım: "kısm", gönül: "gönl", emir: "emr", izin: "izn", keyif: "keyf", zihin: "zihn", kayıt: "kayd", nesil: "nesl", asıl: "asl", ufuk: "ufk", zulüm: "zulm", ilim: "ilm", cisim: "cism", seyir: "seyr", devir: "devr", şükür: "şükr", hapis: "haps", nakil: "nakl", akis: "aks", bahis: "bahs", kayıp: "kayb", sınıf: "", ağıt: "", bağır: "bağr", geniz: "genz", kahır: "kahr", özür: "özr", sabah: "", tavır: "tavr", üslup: "", vasıf: "vasf", zehir: "zehr", şahıs: "şahs", fasıl: "fasl", nabız: "nabz", lütuf: "lütf", hacim: "hacm", fesih: "fesh", azim: "azm", defin: "defn", kibir: "kibr", nutuk: "nutk", uğur: "uğr", cürüm: "cürm", sıfır: "", unsur: "", koyun: "", oyun: "", uyum: "" };
  const DOUBLE = { hak: "hakk", his: "hiss", af: "aff", zam: "zamm", hat: "hatt", sır: "sırr", tıp: "tıbb", ret: "redd", zan: "zann", zıt: "zıdd", had: "hadd" };
  const FRONTED = new Set("saat hal hâl gol alkol kalp harf dikkat seyahat kabul rol meşgul sembol petrol kontrol festival ihtimal hayal misal usul mahsul istiklal terminal ideal final kristal hakikat şefkat kanaat ziraat sıhhat protokol general kapital moral sual ihmal ikmal iştigal idrak iştirak emlak helak infilak istikbal menfaat kıraat lügat dijital".split(" "));
  const ED = new Set("git et güt tat dit affet hisset kaybet seyret zannet reddet keşfet sabret şükret emret hapset bahset naklet kaydet hallet küfret azmet devret hükmet zikret mahvet kahret defet addet akset cezbet neşret".split(" "));

  function put(surface, e) { let a = LEX.get(surface); if (!a) LEX.set(surface, a = []); if (!a.some(x => x.lem === e.lem && x.pos === e.pos && x.st === e.st && x.need === e.need && String(x.pre) === String(e.pre))) a.push(e); if (surface.length > MAXR) MAXR = surface.length; }
  function addNoun(w, uz, o) {
    o = o || {};
    const lv = lastV(w), hv = FRONTED.has(w) ? FRONT[lv] || lv : lv, base = { lem: w, uz, pos: "n", st: o.st || "NOM", hv, need: "", no: o.no, basic: BASIC };
    const end = w[w.length - 1], poly = syl(w) > 1;
    let soft = null, sure = false;
    if (end === "k" && (poly ? !K_KEEP.includes(w) : MONO_SOFT.includes(w))) { soft = w.slice(0, -1) + (w[w.length - 2] === "n" ? "g" : "ğ"); sure = true; }
    else if ((end === "ç" || end === "p") && (poly || MONO_SOFT.includes(w))) { soft = w.slice(0, -1) + (end === "ç" ? "c" : "b"); sure = w !== "laptop"; }
    else if (end === "t" && T_SOFT.includes(w)) { soft = w.slice(0, -1) + "d"; sure = true; }
    if (DROP[w]) { put(DROP[w], { ...base, need: "V" }); base.need = "C"; }
    else if (DOUBLE[w]) { put(DOUBLE[w], { ...base, need: "V" }); base.need = "C"; }
    else if (soft) { put(soft, { ...base, need: "V" }); if (sure) base.need = "C"; }
    put(w, base);
  }
  function addVerb(lem, uz) {
    const st = lem.slice(0, -3), lv = lastV(st), base = { lem, uz, pos: "v", st: "V", hv: lv, need: "", basic: BASIC };
    if (!st) return;
    if (ED.has(st)) { put(st.slice(0, -1) + "d", { ...base, need: "V" }); base.need = "C"; }
    if (/[ae]$/.test(st)) { const cut = st.slice(0, -1); put(cut, { ...base, hv: lastV(cut) || lv, need: "yor" }); }
    if (st === "de" || st === "ye") put(st[0] + "i", { ...base, hv: "i", need: "Y" });
    put(st, base);
  }
  const clean = s => low(s).replace(/\([^)]*\)/g, " ").replace(/[?!.,;:…«»"“”]/g, " ").replace(/\s+/g, " ").trim();
  let BASIC = false;
  function addWord(tr, uz) {
    const w = clean(tr); if (!w || /[^a-zçğıöşüâîû]/.test(w)) return;
    const verbish = /m[ae]k$/.test(w) && w.length > 3 && hA(lastV(w.slice(0, -3))) === w[w.length - 2], senses = uz.split(/\s*;\s*/);
    if (verbish && senses.some(x => /moq/.test(x)) && senses.some(x => !/moq/.test(x))) { addWord2(w, senses.filter(x => /moq/.test(x)).join("; "), true); addWord2(w, senses.filter(x => !/moq/.test(x)).join("; "), false); return; }
    addWord2(w, uz, verbish && /moq/.test(uz));
  }
  function addWord2(w, uz, isVerb) {
    const prev = LEMMAS.get(w + (isVerb ? "|v" : "|n"));
    if (prev) { if (!prev.includes(uz)) LEMMAS.set(w + (isVerb ? "|v" : "|n"), prev + "; " + uz); return; }
    LEMMAS.set(w + (isVerb ? "|v" : "|n"), uz);
    if (isVerb) addVerb(w, uz); else addNoun(w, uz);
  }
  /* Closed-class words: pronouns, particles, postpositions — with their irregular forms */
  const CORE = `ben=men|sen=sen|o=u|biz=biz|siz=siz|onlar=ular|bu=bu|şu=shu|bunlar=bular|şunlar=shular|kendi=oʻz|kim=kim|ne=nima|hangi=qaysi|nere=qayer|bura=bu yer|şura=shu yer|ora=u yer|herkes=hamma|hep=hamma; doim|hepsi=hammasi|kimse=hech kim|birbir=bir-bir|bazı=baʼzi|biri=biri, kimdir|birisi=kimdir|hiç=hech|her=har|bir=bir|birkaç=bir nechta|birçok=koʻp|çok=koʻp; juda|az=oz|daha=yana; -roq|en=eng|ve=va|ile=bilan|ama=ammo, lekin|fakat=lekin|ancak=ammo; faqat|çünkü=chunki|veya=yoki|ya=yo|da=ham|de=ham|ki=ki|mi=-mi (soʻroq)|mı=-mi (soʻroq)|mu=-mi (soʻroq)|mü=-mi (soʻroq)|için=uchun|gibi=kabi|kadar=qadar; -cha|göre=koʻra|sonra=keyin|önce=oldin|değil=emas|var=bor|yok=yoʻq|evet=ha|hayır=yoʻq|şey=narsa|böyle=bunday|şöyle=shunday|öyle=unday|nasıl=qanday|neden=nega|niçin=nima uchun|niye=nega|ne zaman=qachon|kaç=nechta|hem=ham|bile=hatto|sadece=faqat|yalnız=faqat; yolgʻiz|artık=endi; ortiq|henüz=hali|hâlâ=hali ham|hala=hali ham|yine=yana|gene=yana|belki=balki|tabii=albatta|elbette=albatta|tamam=xoʻp, mayli|lütfen=iltimos|şimdi=hozir|bugün=bugun|yarın=ertaga|dün=kecha|burada=bu yerda|orada=u yerda|ise=esa; boʻlsa|diye=deb|üzere=arafasida; uchun|rağmen=qaramay|doğru=toʻgʻri; tomon|karşı=qarshi|beri=beri|dolayı=tufayli|ait=tegishli|hakkında=haqida|tarafından=tomonidan|yüzünden=tufayli|sayesinde=sharofati bilan|boyunca=davomida; boʻylab|arasında=orasida|olarak=sifatida|ya da=yoki|oysa=holbuki|yani=yaʼni|hatta=hatto|ayrıca=bundan tashqari|üstelik=ustiga-ustak|mesela=masalan|örneğin=masalan|bence=menimcha|sence=seningcha|aslında=aslida|özellikle=ayniqsa|genellikle=odatda|bazen=baʼzan|hemen=darhol|birlikte=birgalikda|beraber=birga|tekrar=yana, qayta|pek=unchalik; juda|gayet=ancha|oldukça=ancha|neredeyse=deyarli|hiçbir=hech bir|herhangi=har qanday|öbür=narigi|diğer=boshqa|başka=boshqa|aynı=bir xil|kendisi=oʻzi|şöyle=shunday|işte=mana|haydi=qani|hadi=qani|acaba=ajabo; -mikan|keşke=qaniydi|eğer=agar|madem=modomiki|sanki=goʻyo|meğer=aslida esa|zaten=shundoq ham|galiba=shekilli|herhalde=ehtimol|mutlaka=albatta|kesinlikle=albatta, qatʼiy|asla=aslo|hiç kimse=hech kim|efendim=labbay; janob|bey=janob|hanım=xonim|hoca=ustoz, domla`;
  /* Roots the dictionary of the site does not list on their own (they come in phrases or only in the texts) */
  const SUPP = `abartılı=boʻrttirilgan|abi=aka|acele=shoshilinch; shoshilish|adım=qadam|aferin=barakalla|afiyet=ishtaha, sogʻlik|akıl=aql|aksak=oqsoq|aksaklık=nosozlik|aksatmak=toʻxtatib qoʻymoq|aksi=teskari|aktarmak=oʻtkazmoq, yetkazmoq|akış=oqim|alet=asbob|alo=allo|alım=xarid, olish|araç=vosita; transport vositasi|ara=ora|arkeoloji=arxeologiya|artmak=ortmoq, koʻpaymoq|arıtmak=tozalamoq|asgari=eng kam|askı=ilgich|asmak=osmoq|asıl=asl, asosiy|atmak=otmoq, tashlamoq|atölye=ustaxona|av=ov|ayrı=alohida|ayrılmak=ajralmoq, ketmoq|ayırmak=ajratmoq|ayırt=ajratish (ayırt etmek — farqlamoq)|ayırtmak=band qildirmoq|azalmak=kamaymoq|aşkın=ortiq, oshgan|bahar=bahor|bakım=parvarish, qarov|balon=shar|bandaj=bint|batı=gʻarb|batım=botish|bağlamak=bogʻlamoq|bağlı=bogʻliq|bağımlı=qaram|başlangıç=boshlanish|bel=bel|belli=maʼlum, aniq|bembeyaz=oppoq|bere=beret|beslemek=boqmoq, oziqlantirmoq|beslenmek=oziqlanmoq|bildirim=bildirishnoma|bilinç=ong|birer=bittadan|birleşmek=birlashmoq|biyografi=tarjimai hol|biyolojik=biologik|biçim=shakl|bloke=bloklangan|bol=moʻl|bozmak=buzmoq|bozdurmak=maydalatmoq (pulni)|bozuk=buzuq|bozukluk=buzilish; mayda pul|bozulmak=buzilmoq|boğaz=tomoq; boʻgʻoz|buharalı=buxorolik|bulanık=xira, loyqa|bulanmak=loyqalanmoq; koʻngli aynimoq|buyurmak=buyurmoq; marhamat qilmoq|bölge=hudud|bükmek=bukmoq|bülten=axborot, byulleten|büyükanne=buvi|can=jon|cezve=jazva (qahva idishi)|cinsiyet=jins|dahil=ichida, kiritilgan|dahili=ichki|damlamak=tommoq|dans=raqs|danışmak=maslahatlashmoq|davetiye=taklifnoma|dağarcık=zaxira (söz dağarcığı — soʻz boyligi)|dağılmak=tarqalmoq|dağılım=taqsimot|dağıtım=tarqatish|defa=marta|denge=muvozanat|depolama=saqlash|dere=soy, jilgʻa|derin=chuqur|destek=yordam, qoʻllab-quvvatlash|devrik=agʻdarilgan; teskari tartibli (gap)|dezenfekte=dezinfeksiya|değişiklik=oʻzgarish|değmek=tegmoq; arzimoq|dilemek=tilamoq|dinç=tetik|dizüstü=tizza usti (dizüstü bilgisayar — noutbuk)|dokumak=toʻqimoq|dokunmak=tegmoq|dolaşmak=aylanib yurmoq|domuz=choʻchqa|doğu=sharq|doğum=tugʻilish|durmak=turmoq, toʻxtamoq|durdurmak=toʻxtatmoq|dutar=dutor|duş=dush|dökmek=toʻkmoq|dökülmek=toʻkilmoq|dönük=qaratilgan|dükkân=doʻkon|düpedüz=ochiqdan-ochiq|düzeltmek=tuzatmoq|düzen=tartib|düşük=past|dışarı=tashqari|edinmek=orttirmoq, ega boʻlmoq|ekolojik=ekologik|elemek=elamoq; saralamoq|emanet=omonat|emir=buyruq|ermek=yetmoq, erishmoq|ertesi=ertasi|esmek=esmoq (shamol)|etkinlik=tadbir; samaradorlik|etraf=atrof|evlat=farzand|evvelsi=avvalgi (evvelsi gün — oʻtgan kuni)|eyvah=evoh, voy|eğitmek=oʻqitmoq, tarbiyalamoq|eğlence=koʻngilochar|eşik=ostona|eşit=teng|faaliyet=faoliyat|fal=fol|fark=farq|fasulye=loviya|fener=fonar|fesih=bekor qilish|fil=fil|flaş=chaqnoq (flesh)|fon=jamgʻarma; fon|fosil=qazilma|fuar=yarmarka, koʻrgazma|fırçalamak=choʻtkalamoq|fırça=choʻtka|gar=vokzal|gayrisafi=yalpi|gaz=gaz|gerek=kerak|gerekmek=kerak boʻlmoq|geri=orqaga; qaytib|geçit=oʻtish joyi|gişe=kassa|grup=guruh|gölge=soya|gönül=koʻngil|görünmek=koʻrinmoq|görüntülü=tasvirli (video)|gösterge=koʻrsatkich|güç=kuch; qiyin|güney=janub|gürültü=shovqin|güya=goʻyo|hacim=hajm|han=xon; karvonsaroy|hariç=tashqari|hasıla=mahsulot, hosila|hat=chiziq, liniya|hatır=xotir, koʻngil|havuz=hovuz|hayal=xayol|hayat=hayot|hekim=hakim, shifokor|helal=halol|herhâlde=ehtimol|hidroelektrik=gidroelektr|hissetmek=his qilmoq|hizmet=xizmat|hoş=yoqimli, xush|hoşça=xush (hoşça kal — xayr)|hâl=hol, ahvol|hırsız=oʻgʻri|hız=tezlik|ibaret=iborat|ifade=ifoda|ikna=ishontirish (ikna etmek — koʻndirmoq)|ilan=eʼlon|ileri=oldinga, ilgari|ilgi=qiziqish; aloqa|ilgili=tegishli; qiziqqan|ilk=birinchi, ilk|imkân=imkon|ingilizce=inglizcha|inşaat=qurilish|ip=ip|iplik=ip, kalava|iskele=pristan; qurilish havozasi|istek=xohish, istak|istifa=isteʼfo|iz=iz|içeri=ichkari|japon=yapon|kabin=kabina|kafa=bosh, kalla|kafes=qafas|kahvehane=qahvaxona|kamera=kamera|kapkara=qop-qora|karakol=militsiya boʻlimi|kart=karta|karışmak=aralashmoq|kask=kaska, shlem|katkı=hissa|katmak=qoʻshmoq|katman=qatlam|kavanoz=shisha banka|kavga=janjal|kaybetmek=yoʻqotmoq|kayıp=yoʻqotish; yoʻqolgan|kazanç=daromad, foyda|kaçmak=qochmoq|kaçakçılık=kontrabanda|kenar=chet, qirgʻoq|kent=shahar|kere=marta|keyif=kayfiyat, zavq|kez=marta|kilitlemek=qulflamoq|kitle=omma|kişisel=shaxsiy|kokmak=hid taratmoq|kombi=isitish qozoni|konuk=mehmon|konukseverlik=mehmondoʻstlik|kullanım=foydalanish|kulüp=klub|kurban=qurbon|kursiyer=kurs tinglovchisi|kusur=nuqson, ayb|kutlu=qutlugʻ|kuzey=shimol|köpük=koʻpik|kültürel=madaniy|kılavuz=qoʻllanma; yoʻl koʻrsatuvchi|kıl=qil, tuk|kıpkırmızı=qip-qizil|kırgınlık=xafagarchilik|kırgız=qirgʻiz|kısaltmak=qisqartirmoq|kısık=past, boʻgʻiq (ovoz)|kıtlık=tanqislik|lazım=lozim, kerak|lisans=bakalavr; litsenziya|liste=roʻyxat|logo=logotip|lüks=hashamatli|macun=pasta (diş macunu — tish pastasi)|mama=yem, ozuqa (hayvon uchun)|martı=baliqchi qush (chayka)|maruz=duchor (maruz kalmak — duch kelmoq)|masmavi=koʻm-koʻk|masraf=xarajat|matbaa=bosmaxona|mekân=makon, joy|memnun=mamnun|menemen=menemen (tuxumli taom)|merkez=markaz|mesafe=masofa|mesele=masala|mesleki=kasbiy|metin=matn|meşhur=mashhur|milat=milod|milli=milliy|mimik=mimika|misafirperverlik=mehmondoʻstlik|miyavlamak=miyovlamoq|moda=moda|moral=kayfiyat, ruhiyat|nefes=nafas|nokta=nuqta|numune=namuna|nükleer=yadroviy|onarmak=taʼmirlamoq|online=onlayn|onur=shon-sharaf, gʻurur|organ=aʼzo, organ|organik=organik|orta=oʻrta|ortam=muhit|panel=panel|pansiyon=pansionat|paragraf=xatboshi|parça=boʻlak, parcha|pastane=qandolatxona|pay=ulush|pedal=pedal|pes=taslim (pes etmek — taslim boʻlmoq)|poliçe=sugʻurta polisi|posta=pochta|pratik=amaliyot; amaliy|ramazan=ramazon|rastlantı=tasodif|resmî=rasmiy|restorasyon=taʼmirlash, restavratsiya|ruh=ruh|rüya=tush|sahip=ega|sahte=soxta|saklı=yashirin; saqlangan|sandal=qayiq|santral=stansiya|sapmak=burilmoq, chetga chiqmoq|saray=saroy|sayfa=sahifa|sebep=sabab|sedasız=tovushsiz|sefer=safar; marta|selam=salom|seminer=seminar|sera=issiqxona|serbest=erkin|sermek=yoymoq|serin=salqin|ses=ovoz, tovush|seslenmek=chaqirmoq, ovoz bermoq|sevk=joʻnatish|siber=kiber|simit=simit (kunjutli kulcha)|sinir=asab|sipariş=buyurtma|sivil=fuqarolik|slayt=slayd|sokmak=tiqmoq; chaqmoq (hasharot)|stant=stend|stüdyo=studiya|suret=surat, nusxa (suretiyle — yoʻli bilan)|sökmek=soʻkmoq, buzib olmoq|söz=soʻz|sözcük=soʻz|sözlü=ogʻzaki|sözlük=lugʻat|süpürge=supurgi|sürmek=davom etmoq; haydamoq; surtmoq|süslemek=bezamoq|sıfır=nol|sık=tez-tez; zich|sıkmak=siqmoq|sıkı=qattiq, mahkam|sıkışıklık=tiqilinch|sınır=chegara|sızıntı=sizib chiqish|sığmak=sigʻmoq|taban=taglik, asos|taburcu=shifoxonadan chiqarilgan|tahribat=vayronagarchilik|takdir=taqdir; holat (… takdirde — … taqdirda)|takip=kuzatish, ergashish|taksit=boʻlib toʻlash|tamir=taʼmir|tanımak=tanimoq|taraf=taraf, tomon|tarihî=tarixiy|tarla=dala|tarım=qishloq xoʻjaligi|tasarım=dizayn, loyiha|tasarı=loyiha|taşkentli=toshkentlik|taşmak=toshmoq|tebrik=tabrik|tedarik=taʼminot|tehdit=tahdid|tek=yagona, bitta|tekir=targʻil (mushuk)|telif=mualliflik|tercih=afzal koʻrish, tanlov|termometre=termometr|ters=teskari|tespit=aniqlash|tezgâh=peshtaxta; dastgoh|teşekkür=tashakkur, rahmat|ton=tonna|top=toʻp|toparlamak=yigʻishtirmoq|tutunmak=ushlab turmoq|tuş=tugma (klavish)|tükenmek=tugamoq|tüm=butun, hamma|türbin=turbina|türkmen=turkman|tıklamak=bosmoq (havolani, tugmani)|uç=uch, chet|ummak=umid qilmoq|un=un|unutkanlık=unutuvchanlik|uygulamak=qoʻllamoq, amalga oshirmoq|uzatmak=uzatmoq|vagon=vagon|vakit=vaqt|varmak=yetib bormoq|vatan=vatan|vay=voy|verim=hosildorlik, samara|viral=tez tarqalgan (internetda)|web=veb|yaban=yovvoyi|yaka=yoqa; qirgʻoq|yaklaşık=taxminan|yakınmak=shikoyat qilmoq, nolimoq|yamalak=chala (yarım yamalak — chala-chulpa)|yanmak=yonmoq|yapayalnız=yakka-yolgʻiz|yaramak=yaramoq, foyda bermoq|yarar=foyda|yarı=yarim|yayla=yaylov|yayımlamak=nashr qilmoq|yazık=afsus, attang|yazı=yozuv|yazılı=yozma|yağmak=yogʻmoq|yaşam=hayot, turmush|yeraltı=yerosti|yer=yer, joy|yetinmek=qanoatlanmoq|yetişkin=katta yoshli|yitirmek=yoʻqotmoq|yokuş=tepalik, koʻtarilish|yormak=charchatmoq|yorucu=charchatadigan|yummak=yummoq|yurt=yurt; yotoqxona|yükselmek=koʻtarilmoq|yürek=yurak|yüzüstü=yuztuban|yıkmak=buzmoq, yiqitmoq|yırtmak=yirtmoq|zekâ=zakovat, aql|zil=qoʻngʻiroq|zincir=zanjir|çabuk=tez|pamuk=paxta; Pamuk (mushuk ismi)|konmak=qoʻnmoq; qoʻyilmoq|yatkın=moyil|art=orqa, ket|beyin=miya|çakmak=chaqmoq (yashin); qoqmoq|çarpmak=urilmoq|çatlamak=yorilmoq, darz ketmoq|çağırmak=chaqirmoq|çekmek=tortmoq; (rasm) olmoq|çekim=tortishish; suratga olish|çekinmek=tortinmoq|çevirmek=oʻgirmoq, aylantirmoq; tarjima qilmoq|çevre=atrof-muhit|çevresel=atrof-muhitga oid|çevrim=aylanish (çevrim içi — onlayn)|çeşit=tur, xil|çeşme=buloq, chashma|çökmek=choʻkmoq; qulamoq|çırpmak=koʻpirtirmoq; qoqmoq|öksürmek=yoʻtalmoq|ölçü=oʻlchov|önlem=chora|ördek=oʻrdak|örgün=muntazam (taʼlim)|örgü=toʻqima|örtü=yopinchiq, dasturxon|öte=nari|öz=oʻz|özgü=xos|öğütmek=maydalamoq, yanchmoq|ücret=haq, toʻlov|üste=ust (üstesinden gelmek — uddalamoq)|üye=aʼzo|üzeri=usti|üşümek=sovqotmoq|ısrar=qatʼiy turish|ışık=nur, yorugʻlik|şanslı=omadli|şart=shart|şekil=shakl|şişe=shisha idish|hamur=xamir|yakmak=yoqmoq|hazine=xazina|kule=minora|vitrin=vitrina|metre=metr|gündüz=kunduz|kurak=qurgʻoqchil|yemyeşil=yam-yashil|eksi=minus|sararmak=sargʻaymoq|kasaba=shaharcha|beşinci=beshinchi|bilgin=olim|ölüm=oʻlim|sultan=sulton|kapılmak=berilib ketmoq|korkutmak=qoʻrqitmoq|vurmak=urmoq|aniden=toʻsatdan|hareket=harakat|sönmek=oʻchmoq|muhtar=mahalla oqsoqoli|benzin=benzin|koordinatör=koordinator|emek=mehnat|dokunaklı=taʼsirli|dizmek=termoq, tizmoq|sarılmak=quchoqlamoq; oʻralmoq|kilometre=kilometr|ahır=ogʻilxona|hamam=hammom|mescit=masjid|selçuklu=saljuqiy|konaklama=tunash, turar joy|demiryolu=temir yoʻl|demiryol=temir yoʻl|terk=tark (terk etmek — tark etmoq)|kesik=kesilgan; uzuq|terlik=shippak|kesinti=uzilish|haberdar=xabardor|usul=usul|basılı=bosma|üstünlük=ustunlik|ayarlamak=sozlamoq|dijital=raqamli|rakip=raqib|bağ=bogʻ; bogʻlam, aloqa|temsilci=vakil|sabretmek=sabr qilmoq|derviş=darvesh|murat=murod, maqsad|görsel=tasvir; koʻrgazmali|sağlamlaştırmak=mustahkamlamoq|kritik=hal qiluvchi; tanqidiy|temkinli=ehtiyotkor|yeti=qobiliyat|istisna=istisno|korkutucu=qoʻrqinchli|tepki=munosabat, reaksiya|bedel=badal, narx|sosyolog=sotsiolog|yerleşim=aholi yashaydigan joy|karamsar=tushkun, pessimist|sürüm=versiya, nashr|tahsil=tahsil, taʼlim|batmak=botmoq, choʻkmoq|hayati=hayotiy|beklenti=umid, kutilgan narsa|yanılgı=yanglishish|dayalı=asoslangan|çaplı=miqyosli|dalga=toʻlqin|tarihsel=tarixiy|buhar=bugʻ|mevcut=mavjud|kesim=qatlam; qism|ezber=yod (ezbere — yoddan)|taklit=taqlid|teknik=texnika; texnik|süregelmek=davom etib kelmoq|vazgeçmek=voz kechmoq|bank=oʻrindiq (skameyka)|avuç=kaft, hovuch|kıyı=qirgʻoq|yaklaşmak=yaqinlashmoq|sallamak=silkitmoq|seyretmek=tomosha qilmoq|doğrulmak=qaddini rostlamoq|kıpırdamak=qimirlamoq|dördüncü=toʻrtinchi|yirminci=yigirmanchi|simge=ramz|miktar=miqdor|yüzey=yuza|liman=port|kurumak=qurimoq|arazi=yer, hudud|baraj=toʻgʻon|uğur=omad (uğruna — yoʻlida)|dair=oid|miyav=miyov|bahsetmek=… haqida gapirmoq|algınlık=(soğuk algınlığı — shamollash)|mozaik=mozaika|ıslanmak=hoʻl boʻlmoq|sağlam=mustahkam; sogʻlom|demlemek=damlamoq (choyni)|saye=sharofat (sayesinde — tufayli)|bant=lenta|büro=idora, byuro|bagaj=bagaj, yuk|etiket=yorliq|tekerlek=gʻildirak|sap=dasta, sop|kurdele=lenta (bezak)|sakınca=monelik, zarar`;
  const NAMES = "ahmet ali aylin aziz defne dilnoza elif hakan jasur kamila kerem leyla malika murat nigora rustam zehra zeynep arda mehmet ayşe fatma mustafa emre can deniz selin burak hasan uluğ fatih ayten tursunov hoşim".split(" "), PLACES = "ankara asya efes izmir kadıköy topkapı istanbul taşkent semerkant buhara türkiye özbekistan antalya bursa kapadokya avrupa kemeraltı rize erzurum ayasofya sultanhanı ege aral amuderya siriderya".split(" ");
  function core() {
    CORE.split("|").forEach(x => { const [tr, uz] = x.split("="); if (!/\s/.test(tr)) addWord(tr, uz); });
    const full = (s, lem, uz, pre, st) => put(s, { lem, uz, pos: "n", st: st || "NCASE", hv: lastV(s), need: "", pre });
    // Pronouns: irregular case forms
    [["ben", "men", "bana", "benim", "benimle"], ["sen", "sen", "sana", "senin", "seninle"]].forEach(([p, uz, dat, gen, ins]) => {
      LEX.get(p).forEach(e => { if (e.pos === "n") e.no = new Set(["DAT", "GEN", "P1s", "P2s", "P3s", "P1p", "P2p", "P3p", "PL"]); });
      full(dat, p, uz, ["DAT"]); full(gen, p, uz, ["GEN"], "NCK"); full(ins, p, uz, ["INS"]);
    });
    [["biz", "bizim"], ["siz", "sizin"]].forEach(([p, gen]) => { LEX.get(p).forEach(e => { e.no = new Set(["GEN", "P1s", "P2s", "P3s", "P1p", "P2p", "P3p"]); }); full(gen, p, p, ["GEN"], "NCK"); full(gen + "le", p, p, ["INS"]); });
    [["o", "on", "u"], ["bu", "bun", "bu"], ["şu", "şun", "shu"]].forEach(([p, stem, uz]) => {
      LEX.set(p, (LEX.get(p) || []).filter(e => e.pos !== "n")); put(p, { lem: p, uz, pos: "n", st: "NPRO", hv: lastV(p), need: "" });
      put(stem, { lem: p, uz, pos: "n", st: "NOM", hv: lastV(p), need: "S", no: new Set(["P1s", "P2s", "P3s", "P1p", "P2p", "P3p", "LI", "LIK", "CI", "DIM", "INS"]) });
      full(stem + "unla", p, uz, ["INS"]);
    });
    full("kiminle", "kim", "kim", ["INS"]);
    (LEX.get("kendi") || []).forEach(e => { e.no = new Set(["ACC", "DAT", "LOC", "ABL", "GEN", "INS", "EQU"]); });
    put("kendi", { lem: "kendi", uz: "oʻz", pos: "n", st: "NP3", hv: "i", need: "" });
    put("hepsi", { lem: "hepsi", uz: "hammasi", pos: "n", st: "NP3", hv: "i", need: "" });
    // su: suyu, suyun, suyum
    const su = LEX.get("su"); if (su) su.forEach(e => { if (e.pos === "n") e.no = new Set(["GEN", "P1s", "P2s", "P3s", "P1p", "P2p"]); });
    put("suy", { lem: "su", uz: "suv", pos: "n", st: "NOM", hv: "u", need: "V", no: new Set(["ACC", "DAT", "PL"]) });
    full("neyin", "ne", "nima", ["GEN"], "NCK");
    // i- (boʻlmoq): idi, ise, imiş, iken
    put("idi", { lem: "idi", uz: "edi", pos: "n", st: "E2", hv: "i", need: "" }); put("ise", { lem: "ise", uz: "esa; boʻlsa", pos: "n", st: "E2", hv: "e", need: "" });
    put("imiş", { lem: "imiş", uz: "ekan", pos: "n", st: "E1", hv: "i", need: "" }); put("iken", { lem: "iken", uz: "ekan, paytida", pos: "n", st: "END", hv: "e", need: "" });
    ["mi", "mı", "mu", "mü"].forEach(q => { LEX.set(q, []); put(q, { lem: q, uz: "-mi (soʻroq yuklamasi)", pos: "n", st: "NPRO", hv: lastV(q), need: "" }); });
  }
  let PHR = new Map();
  const LIGHT = { etmek: /^(\S+) (qilmoq|etmoq)$/, yapmak: /^(\S+) qilmoq$/, olmak: /^(\S+) boʻlmoq$/ };
  function load(pairs, extra) {
    LEX = new Map(); LEMMAS = new Map(); MAXR = 0; PHR = new Map();
    (pairs || []).forEach(([tr, uz], i) => { BASIC = i < 800; addWord(tr, uz); }); BASIC = false;
    // Phrases of two or three words («teşekkür etmek», «ne zaman»): looked up by their words, the last one by its lemma
    const later = [];
    (pairs || []).forEach(([tr, uz]) => {
      const w = clean(tr).split(" "); if (w.length < 2 || w.length > 3 || w.some(x => /[^a-zçğıöşüâîû]/.test(x))) return;
      PHR.set(w.join(" "), uz);
      const m = w.length === 2 && LIGHT[w[1]] && LIGHT[w[1]].exec(uz); if (m) later.push([w[0], m[1]]);
    });
    SUPP.split("|").forEach(x => { const i = x.indexOf("="); if (i > 0) addWord(x.slice(0, i), x.slice(i + 1)); });
    (extra || []).forEach(([tr, uz]) => addWord(tr, uz));
    NAMES.forEach(n => { if (!LEMMAS.has(n + "|n")) addWord(n, "(ism)"); }); PLACES.forEach(n => { if (!LEMMAS.has(n + "|n")) addWord(n, "(joy nomi)"); });
    later.forEach(([tr, uz]) => { if (!LEMMAS.has(tr + "|n")) addWord(tr, uz); });
    core();
    return LEX.size;
  }

  /* ---------- Analysis ---------- */
  function walk(word, pos, st, hv, need, parts, cost, voice, lax, np, entry, out) {
    if (pos === word.length) {
      if (FINAL.has(st) && (lax || !(need === "V" || need === "yor" || need === "Y" || need === "S")) && (st !== "NDIK" || lax || parts.length)) out.push({ parts, cost: cost + (st === "NDIK" ? 1.2 : 0), st });
      return;
    }
    if (out.length > 60) return;
    const stem = word.slice(0, pos), x = { stem, lax, np };
    for (const d of ST[st]) {
      if (d.voice && voice >= 2) continue;
      if (entry.no && np === 0 && entry.no.has(d.t)) continue;
      if (!lax && need === "yor" && d.t !== "PROG") continue;
      let pats = typeof d.p === "function" ? d.p(x) : d.p; if (pats == null) continue;
      if (!Array.isArray(pats)) pats = [pats];
      const tryS = (s, nd) => {
        if (!word.startsWith(s, pos)) return;
        if (!lax) {
          const fv = isV(s[0]);
          if (need === "V" && !fv) return; if (need === "C" && fv) return; if (need === "Y" && s[0] !== "y") return;
        }
        const v = lastV(s) || hv;
        walk(word, pos + s.length, d.to, v, nd, parts.concat({ s, t: d.t }), cost + (d.c || 1), voice + (d.voice ? 1 : 0), lax, np + 1, entry, out);
      };
      for (const p of pats) {
        for (const s of forms(stem, hv, p, lax)) {
          if (d.soft && s.endsWith("k")) { tryS(s, lax ? "" : "C"); tryS(s.slice(0, -1) + "ğ", "V"); }
          else tryS(s, "");
        }
        if (d.yor) for (const s of forms(stem, hv, d.yor, lax)) { if (word.startsWith(s, pos)) walk(word, pos + s.length, d.to, lastV(s) || hv, "yor", parts.concat({ s, t: d.t }), cost + (d.c || 1), voice, lax, np + 1, entry, out); }
      }
    }
  }
  function analyse(w, lax) {
    const res = [];
    for (let i = Math.min(w.length, MAXR); i >= 1; i--) {
      const es = LEX.get(w.slice(0, i)); if (!es) continue;
      for (const e of es) {
        const out = [];
        walk(w, i, e.st, e.hv, e.need, [], 0, 0, lax, 0, e, out);
        for (const o of out) {
          const parts = (e.pre || []).map(t => ({ s: "", t })).concat(o.parts);
          res.push({ lem: e.lem, uz: e.uz, pos: e.pos, root: w.slice(0, i), parts, cost: o.cost + (e.pre ? 0.5 : 0) - 0.55 * Math.min(i, 8) + (i === 1 && o.parts.length > 1 ? 1.5 : 0), e });
        }
      }
    }
    res.sort((a, b) => a.cost - b.cost);
    const seen = new Set();
    return res.filter(r => { const k = r.lem + "|" + r.pos + "|" + r.parts.map(p => p.t).join("+"); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  const strip = w => low(w).replace(/[’ʼ`]/g, "'").replace(/^[^a-zçğıöşüâîû0-9]+|[^a-zçğıöşüâîû0-9]+$/g, "");
  function parse(word, o) {
    o = o || {};
    const raw = String(word).trim(), w = strip(raw); if (!w) return [];
    const ap = w.indexOf("'");
    if (ap > 0) {
      // A proper name or a number with suffixes after the apostrophe: İzmir'de, 5'te
      const left = w.slice(0, ap), right = w.slice(ap + 1).replace(/'/g, ""), known = LEX.get(left);
      const e = (known && known.find(x => x.pos === "n")) || { lem: left, uz: "", pos: "p", st: "NOM", hv: lastV(left) || "i", need: "" };
      const out = []; walk(left + right, left.length, "NOM", /\d$/.test(left) ? numV(left) : e.hv, "", [], 0, 0, !!o.lax, 0, {}, out);
      return out.sort((a, b) => a.cost - b.cost).map(x => ({ lem: e.lem, uz: e.uz, pos: e.pos, root: left, parts: x.parts, cost: x.cost, proper: e.pos === "p" }));
    }
    if (/[^a-zçğıöşüâîû]/.test(w)) return [];
    return analyse(w, !!o.lax).map(({ e, ...r }) => r);
  }
  // The harmony vowel of a number read aloud: 5 (beş) → e, 6 (altı) → ı, 10 (on) → o …
  function numV(n) { const d = n[n.length - 1], z = /0+$/.exec(n); if (z && n.length > 1) return z[0].length >= 6 ? "o" : z[0].length >= 3 ? "i" : z[0].length === 2 ? "ü" : { 1: "o", 2: "i", 3: "u", 4: "ı", 5: "i", 6: "ı", 7: "i", 8: "e", 9: "a" }[n[n.length - 2]] || "o"; return { 0: "ı", 1: "i", 2: "i", 3: "ü", 4: "ö", 5: "e", 6: "ı", 7: "i", 8: "i", 9: "u" }[d] || "i"; }

  // A phrase the word belongs to: «teşekkür ediyorum» → teşekkür etmek. words — the sentence, i — the tapped word
  function phrase(words, i) {
    const lem = k => { const w = strip(words[k] || ""); const r = w && parse(w)[0]; return [w, r ? r.lem : w]; };
    for (const [a, b] of [[i - 2, i], [i - 1, i], [i - 1, i + 1], [i, i + 1], [i, i + 2]]) {
      if (a < 0 || b >= words.length) continue;
      const mid = []; for (let k = a; k < b; k++) mid.push(strip(words[k]));
      const [w, l] = lem(b);
      for (const last of [l, w]) { const key = mid.concat(last).join(" "), uz = PHR.get(key); if (uz) return { tr: key, uz, from: a, to: b }; }
    }
    return null;
  }

  /* ---------- Generation: lemma + tags → the correct surface ---------- */
  function build(lem, tags, pos) {
    const cands = [];
    LEX.forEach((es, surf) => es.forEach(e => { if (e.lem === lem && (!pos || e.pos === pos) && !e.pre) cands.push([surf, e]); }));
    const out = [];
    const go = (s, st, hv, need, i, np, e) => {
      if (i === tags.length) { if (FINAL.has(st) && !(need === "V" || need === "yor" || need === "Y" || need === "S")) out.push(s); return; }
      for (const d of ST[st]) {
        if (d.t !== tags[i] || (e.no && np === 0 && e.no.has(d.t))) continue;
        if (need === "yor" && d.t !== "PROG") continue;
        let pats = typeof d.p === "function" ? d.p({ stem: s, lax: false, np }) : d.p; if (pats == null) continue;
        if (!Array.isArray(pats)) pats = [pats];
        const ok = x => { const fv = isV(x[0]); return !(need === "V" && !fv) && !(need === "C" && fv) && !(need === "Y" && x[0] !== "y"); };
        for (const p of pats) {
          for (const x of forms(s, hv, p, false)) {
            if (!ok(x)) continue;
            if (d.soft && x.endsWith("k")) { go(s + x, d.to, lastV(x) || hv, "C", i + 1, np + 1, e); go(s + x.slice(0, -1) + "ğ", d.to, lastV(x) || hv, "V", i + 1, np + 1, e); }
            else go(s + x, d.to, lastV(x) || hv, "", i + 1, np + 1, e);
          }
          if (d.yor) for (const x of forms(s, hv, d.yor, false)) if (ok(x)) go(s + x, d.to, lastV(x) || hv, "yor", i + 1, np + 1, e);
        }
      }
    };
    for (const [surf, e] of cands) go(surf, e.st, e.hv, e.need, 0, 0, e);
    return out[0] || null;
  }

  /* ---------- A misspelt suffix: the same root and suffixes written by the rules ---------- */
  const SOFTP = { p: "b", ç: "c", t: "d", k: "ğ" };
  const VERBAL = new Set(["LA", "LAN", "LAS", "RECIP", "A", "AKAL", "AYAZ", "ADUR"]);
  // h — vowel harmony, c — d/t, c/ç after a voiceless sound, s — a final consonant softens, y — a buffer letter, d — a dropped vowel
  function kind(bad, good, rootLen) {
    if (bad.length !== good.length) return "y";
    let k = "";
    for (let i = 0; i < bad.length; i++) {
      const a = bad[i], b = good[i]; if (a === b) continue;
      if (isV(a) && isV(b)) k = k || "h";
      else if ((SOFTP[a] === b || SOFTP[b] === a || (a === "k" && b === "g") || (a === "g" && b === "k")) && i < bad.length) k = i < rootLen || a === "k" || a === "ğ" || a === "g" ? "s" : (k || "c");
      else return "o";
    }
    return k || "o";
  }
  const EVERYDAY = new Set(["PL", "P1s", "P2s", "P3s", "P1p", "P2p", "ACC", "DAT", "LOC", "ABL", "GEN", "INS", "PROG", "PAST", "FUT", "NEG", "S1s", "S2s", "S1p", "S2p", "S3p", "LI", "SIZ", "INF", "CPST"]);
  // One letter more or less, and that letter is a buffer (y, n, s): «arabaa» — «arabaya», «evye» — «eve»
  function buffer(a, b) {
    if (Math.abs(a.length - b.length) !== 1) return false;
    const [l, s] = a.length > b.length ? [a, b] : [b, a]; let i = 0; while (i < s.length && l[i] === s[i]) i++;
    return l.slice(i + 1) === s.slice(i) && "yns".includes(l[i]);
  }
  // The root loses its last vowel before a vowel: «şehirin» — «şehrin»
  function dropped(a, b, rootLen) { if (a.length !== b.length + 1) return false; let i = 0; while (i < b.length && a[i] === b[i]) i++; return i < rootLen && isV(a[i]) && a.slice(i + 1) === b.slice(i); }
  // What kind of slip turns `good` into `bad`: h, c, s, y, d — or o (something else)
  function errKind(bad, good, rootLen) { const k = kind(bad, good, rootLen); return k === "y" && !buffer(bad, good) ? (dropped(bad, good, rootLen) ? "d" : "o") : k; }
  const differ = (a, b) => { if (a.length !== b.length) return 1; let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };
  function fix(word) {
    const w = strip(word); if (!w || w.includes("'") || w.length < 3 || /nt[ıiuü]$/.test(w) || parse(w).length) return null;
    // Careful by design: a short root only with the everyday endings, the same length (or one buffer letter) — an unknown word is left alone
    const lax = analyse(w, true).filter(r => r.parts.length && r.parts.length <= 4 && r.root.length >= 2 && !r.parts.some(p => VERBAL.has(p.t)) && (r.root.length >= 4 || (r.e.basic && r.parts.length <= 3 && r.parts.every(p => EVERYDAY.has(p.t) && p.t !== "LI" && p.t !== "SIZ") && w.length - r.root.length >= 2)));
    for (const r of lax.slice(0, 6)) {
      const good = build(r.lem, r.parts.map(p => p.t), r.pos);
      if (!good || good === w) continue;
      const k = errKind(w, good, r.root.length);
      if (k === "o" || differ(w, good) > (r.root.length >= 4 ? 2 : 1)) continue;
      return { w, fix: good, kind: k, lem: r.lem, uz: r.uz, tags: r.parts.map(p => p.t) };
    }
    return null;
  }

  /* ---------- Names of the suffixes in Uzbek: [nomi, oʻzbekcha muqobili] ---------- */
  const TAGS = {
    PL: ["koʻplik", "-lar"], P1s: ["egalik: mening", "-(i)m"], P2s: ["egalik: sening", "-(i)ng"], P3s: ["egalik: uning", "-(s)i"], P1p: ["egalik: bizning", "-(i)miz"], P2p: ["egalik: sizning", "-(i)ngiz"], P3p: ["egalik: ularning", "-lari"],
    ACC: ["tushum kelishigi", "-ni"], DAT: ["joʻnalish kelishigi", "-ga"], LOC: ["oʻrin-payt kelishigi", "-da"], ABL: ["chiqish kelishigi", "-dan"], GEN: ["qaratqich kelishigi", "-ning"], INS: ["birgalik", "bilan"], EQU: ["oʻxshatish, til nomi", "-cha"],
    KI: ["tegishlilik", "-dagi, -gi"], LI: ["egalik sifati", "-li"], SIZ: ["yoʻqlik", "-siz"], LIK: ["ot yasovchi", "-lik"], CI: ["kasb, shaxs", "-chi"], DIM: ["kichraytirish", "-cha, -gina"],
    S1s: ["shaxs: men", "-man, -m"], S2s: ["shaxs: sen", "-san, -ng"], S1p: ["shaxs: biz", "-miz, -k"], S2p: ["shaxs: siz", "-siz, -ngiz"], S3p: ["shaxs: ular", "-lar"],
    DIR: ["tasdiq, taxmin", "-dir"], CPST: ["oʻtgan zamon: edi", "edi"], CEV: ["eshitilgan: ekan", "ekan"], CCOND: ["shart: boʻlsa", "-sa, boʻlsa"], KEN: ["payt: -ayotganda", "ekan, paytida"],
    NEG: ["inkor", "-ma-"], ABIL: ["qodirlik", "-a ol-"], INAB: ["qodir emaslik", "-a olma-"], CAUS: ["orttirma nisbat", "-tir-, -dir-"], PASS: ["majhul nisbat", "-il-, -in-"], RECIP: ["birgalik nisbat", "-ish-"],
    PROG: ["hozirgi zamon", "-yap-"], FUT: ["kelasi zamon", "-adi, -moqchi"], EVID: ["eshitilgan oʻtgan zamon", "-gan ekan, -ibdi"], AOR: ["keng zamon", "-adi"], NAOR: ["keng zamon, inkor", "-maydi"], NAOR1s: ["keng zamon, inkor: men", "-mayman"], NAOR1p: ["keng zamon, inkor: biz", "-maymiz"],
    NEC: ["zaruriyat", "-ishi kerak"], PAST: ["oʻtgan zamon", "-di"], COND: ["shart", "-sa"], OPT1s: ["istak: men", "-ay"], OPT1p: ["istak: biz", "-aylik"], OPT2s: ["istak: sen", "-gin"],
    IMP2s: ["buyruq: sen", "—"], IMP2p: ["buyruq: siz", "-ing"], IMP2pp: ["buyruq: siz (hurmat)", "-ingiz"], IMP3s: ["buyruq: u", "-sin"], IMP3p: ["buyruq: ular", "-sinlar"],
    INF: ["harakat nomi", "-moq"], VN: ["harakat nomi", "-ish"], IS: ["harakat nomi: tarz", "-ish"], PART: ["sifatdosh", "-gan, -adigan"], DIK: ["sifatdosh", "-gan"], FUTP: ["kelasi zamon sifatdoshi", "-adigan"],
    LA: ["feʼl yasovchi", "-la-"], LAN: ["feʼl yasovchi: boʻlmoq", "-lan-"], LAS: ["feʼl yasovchi: -lashmoq", "-lash-"],
    IVER: ["tezlik: -ib yubormoq", "-ib yubor-"], AKAL: ["davomiylik: -ib qolmoq", "-ib qol-"], AYAZ: ["sal qoldi", "-ay dedi"], ADUR: ["davom: -ib turmoq", "-ib tur-"],
    MAKSIZIN: ["ravishdosh: -may turib", "-masdan"], ASI: ["istak: -gim keldi", "-gi(m) kel-"], CASINA: ["oʻxshatish: goʻyo", "-gandek"], A: ["ravishdosh: takror", "-a … -a"],
    IP: ["ravishdosh", "-ib"], ARAK: ["ravishdosh: holat", "-ib, -gan holda"], INCA: ["ravishdosh: payt", "-gach"], MADAN: ["ravishdosh: inkor", "-masdan"], ALI: ["ravishdosh: beri", "-gandan beri"], DIKCA: ["ravishdosh: sari", "-gan sari"], AGT: ["bajaruvchi", "-uvchi"]
  };
  return { load, parse, fix, build, phrase, forms, errKind, TAGS, DROPS: Object.keys(DROP).filter(k => DROP[k]), strip, get size() { return LEX.size; }, has: s => LEX.has(s) };
})();
if (typeof module !== "undefined") module.exports = Morph;
