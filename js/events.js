/* Türkçe Yoʻl — Events: taps, keys, inputs.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- Events ---------- */
function onAct(e) {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const act = b.dataset.act;
  if (act === "sheet-close") { if (e.target === b && !$("sheet").dataset.locked) closeSheet(); return; }
  if (act === "welcome-close") { hideWelcome(); return; }
  if (act === "mw") { mwOpen(b); return; }
  if (act.startsWith("hk-")) { hkAct(act, b); return; }
  if (act.startsWith("ln-")) { lnAct(act, b); return; }
  if (act === "mor-check" || act === "mor-skip") { checkMor(act === "mor-skip"); return; }
  if (act === "course-retry") { route(); return; }
  if (act === "grp-join") { grpJoin(b.dataset.c); return; }
  if (act === "grp-share") { shareLink(grpLink(b.dataset.c), "Turk tili guruhimizga qoʻshiling:"); return; }
  if (act === "grp-copy") { copyText(grpLink(b.dataset.c), "Havola nusxalandi"); return; }
  if (act === "grp-reload") { loadGroup(b.dataset.c, true); return; }
  if (act === "gt-add") { b.disabled = true; gtAdd(b.dataset.c); return; }
  if (act === "gt-del") { if (b.dataset.sure) gtDel(b.dataset.c, b.dataset.t); else { b.dataset.sure = "1"; b.textContent = "Oʻchirilsinmi?"; } return; }
  if (act === "grp-csv") { grpCsv(b.dataset.c); return; }
  if (act === "grp-leave") { grpLeave(b.dataset.c); return; }
  if (act === "grp-kick") { if (b.dataset.sure) grpKick(b.dataset.c, b.dataset.u); else { b.dataset.sure = "1"; b.textContent = `${b.dataset.n || "Oʻquvchi"} chiqarilsinmi? Yana bosing`; } return; }
  if (act === "grp-del-ask") { $("grp-del").innerHTML = `<div class="notice"><div><b>Guruh oʻchirilsinmi?</b> Oʻquvchilar roʻyxati va natijalari guruhdan oʻchadi (ularning oʻz natijalari saqlanib qoladi).</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button class="btn btn-ghost" data-act="grp-reload" data-c="${esc(b.dataset.c)}">Bekor qilish</button><button class="btn btn-danger" data-act="grp-del-yes" data-c="${esc(b.dataset.c)}">Ha, oʻchirish</button></div></div>`; return; }
  if (act === "grp-del-yes") { b.disabled = true; grpDelete(b.dataset.c); return; }
  if (act === "say") speak(b.dataset.t, b.classList.contains("say") ? b : null);
  else if (act === "go") { go(b.dataset.to); if (b.dataset.focus) setTimeout(() => $("q") && $("q").focus(), 50); }
  else if (act === "start") startSession(b.dataset.mode, b.dataset.u || "all");
  else if (act === "modes") modeSheet(b.dataset.u, b.dataset.title);
  else if (act === "cat") { CAT = b.dataset.c; route(); }
  else if (act === "gx-lv") { GX_LV = b.dataset.l; const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "lug-lv") { LUG_LV = b.dataset.l; const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "guide-lv") { GUIDE_LV = b.dataset.l; const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "rank-tab") { RANK_TAB = b.dataset.t; if (location.hash === "#rank-fr") location.hash = "#rank"; else route(); }
  else if (act === "letter") {
    letterSel = +b.dataset.i;
    const y = window.scrollY; route(); window.scrollTo(0, y);
    speak(LETTERS[letterSel][1]);
  }
  else if (act === "abc" || act === "abc-flip") {
    abcSet(act === "abc" ? b.dataset.v : ABC === "cyr" ? "lat" : "cyr");
    const y = window.scrollY; route(); window.scrollTo(0, y);
    toast(ABC === "cyr" ? "Кирилл ёзуви ёқилди" : "Lotin yozuvi yoqildi");
  }
  else if (act === "theme") {
    const v = b.dataset.v;
    try { if (v === "auto") localStorage.removeItem("ty-theme"); else localStorage.setItem("ty-theme", v); } catch (err) {}
    if (v === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v;
    themeMeta(v);
    const y = window.scrollY; route(); window.scrollTo(0, y);
  }
  else if (act === "remind") remSet(b.dataset.v);
  else if (act === "tts-rate") { S.tts = Object.assign({}, S.tts, { r: +b.dataset.v }); save(); const y = window.scrollY; route(); window.scrollTo(0, y); speak("Merhaba! Türkçe öğreniyorum."); }
  else if (act === "goal") { S.goal = +b.dataset.v; save(); const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "sw-update") { const bar = $("upd-bar"); SW_UPDATING = true; if (bar && bar._w) bar._w.postMessage("skip"); b.disabled = true; b.textContent = "Yangilanmoqda…"; }
  else if (act === "sw-later") { const bar = $("upd-bar"); if (bar) bar.remove(); }
  else if (act === "s-say-x") { b.classList.remove("show"); }
  else if (act === "streak") { STK_M = 0; openSheet(streakSheetHTML()); }
  else if (act === "stk-m") { STK_M = Math.max(-3, Math.min(0, STK_M + (+b.dataset.d || 0))); openSheet(streakSheetHTML()); }
  else if (act === "sheet-close-btn") closeSheet();
  else if (act === "k-view") { S.kView = b.dataset.v === "list" ? "list" : "path"; save(); route(); }
  else if (act === "sfx") { S.sfx = S.sfx === false; save(); if (S.sfx) beep("ok"); const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "hap") { S.hap = S.hap === false; save(); haptic(true); const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "anon") {
    S.anon = S.anon === false; save();
    if (S.anon) statsPush(true); else if (db && USER) db.collection("stats").doc(USER.uid).delete().catch(() => {});
    toast(S.anon ? "Anonim statistika yoqildi" : "Anonim statistika oʻchirildi, maʼlumotlaringiz oʻchirildi");
    const y = window.scrollY; route(); window.scrollTo(0, y);
  }
  else if (act === "admin-reload") { ADMIN_DATA = null; ADMIN_ERRS = null; route(); }
  else if (act === "err-del") { b.disabled = true; errDel(b.dataset.id); }
  else if (act === "copy-uid" && USER) { try { navigator.clipboard.writeText(USER.uid).then(() => toast("UID nusxalandi"), () => toast(USER.uid)); } catch (err) { toast(USER.uid); } }
  else if (act === "pub") {
    S.pub = !S.pub; save(); RANK_CACHE = {};
    if (!S.pub && db && USER) db.collection("league").doc(USER.uid).delete().catch(() => {});
    const y = window.scrollY; route(); window.scrollTo(0, y);
  }
  else if (act === "gq") {
    const box = b.closest(".gq");
    if (box.dataset.done) return;
    const gi = +location.hash.slice(9) - 1, g = GRAMMAR[gi], qi = +b.dataset.q, q = g.quiz[qi];
    const ok = +b.dataset.o === q.a;
    box.dataset.done = "1";
    box.querySelectorAll(".opt").forEach(o => { if (+o.dataset.o === q.a) o.classList.add("right"); });
    const fb = box.querySelector(".feedback");
    const r = S.gram[g.id] || (S.gram[g.id] = []);
    if (ok) {
      fb.className = "feedback ok"; fb.textContent = "Doğru! Toʻgʻri.";
      if (!r[qi]) {
        r[qi] = true;
        if (gramDone(g)) { const n = g.quiz.length, a = xpAward("grammar", { right: n, n: n + ((S.gramw || {})[g.id] || 0), key: "gq|" + g.id }); toast(`Mavzu tugallandi! +${a.xp} XP`); }
      }
      save();
    } else {
      b.classList.add("wrong");
      if (!r[qi]) { S.gramw = S.gramw || {}; S.gramw[g.id] = (S.gramw[g.id] || 0) + 1; }
      fb.className = "feedback no";
      fb.innerHTML = `Toʻgʻri javob: <b lang="tr">${esc(q.o[q.a])}</b> <button class="link" data-act="gq-retry" data-q="${qi}">Qayta urinish</button>`;
    }
  }
  else if (act === "gq-retry") {
    const gi = +location.hash.slice(9) - 1, qi = +b.dataset.q;
    $("gq-" + qi).outerHTML = gqHtml(GRAMMAR[gi], qi);
  }
  else if (act === "photo") $("photo-input").click();
  else if (act === "sheet-x") closeSheet();
  else if (act === "tr-go") translateNow();
  else if (act === "tr-swap") { TR_DIR = TR_DIR === "tr" ? "uz" : "tr"; if (TR_OUT && TR_OUT.text) TR_TEXT = TR_OUT.text; TR_OUT = null; route(); }
  else if (act === "tr-clear") { TR_TEXT = ""; TR_OUT = null; route(); setTimeout(() => $("tr-src") && $("tr-src").focus(), 30); }
  else if (act === "tr-say") speak($("tr-src").value);
  else if (act === "tr-copy") { try { navigator.clipboard.writeText(TR_OUT.text).then(() => toast("Nusxa olindi"), () => toast("Nusxa olib boʻlmadi")); } catch (err) { toast("Nusxa olib boʻlmadi"); } }
  else if (act === "tr-hist") { const h = trHistory()[+b.dataset.i]; TR_DIR = h.d; TR_TEXT = h.s; TR_OUT = { text: h.t }; route(); }
  else if (act === "tr-hist-clear") { try { localStorage.removeItem("ty-tr-hist"); } catch (err) {} route(); }
  else if (act === "tr-key") {
    const inp = $("tr-src"), st = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? st;
    inp.value = inp.value.slice(0, st) + b.dataset.k + inp.value.slice(en); TR_TEXT = inp.value;
    inp.focus(); inp.setSelectionRange(st + 1, st + 1);
  }
  else if (act === "profile-edit") profileSheet(false);
  else if (act === "gender" || act === "ps-gender") b.parentElement.querySelectorAll("[role=radio]").forEach(r => r.setAttribute("aria-checked", String(r === b)));
  else if (act === "ps-save") {
    const g = document.querySelector('[data-act="ps-gender"][aria-checked="true"]'), bd = readBirth("ps");
    if (!g) { $("ps-err").textContent = "Jinsingizni tanlang."; return; }
    if (bd.err) { $("ps-err").textContent = bd.err; return; }
    if ($("ps-name")) {
      const nm = $("ps-name").value.trim().slice(0, 40);
      if (!nm) { $("ps-err").textContent = "Ismingizni yozing."; return; }
      USERNAME = nm;
      if (USER && USER.updateProfile) USER.updateProfile({ displayName: nm }).catch(() => {});
      if (db && USER) db.collection("users").doc(USER.uid).set({ name: nm }, { merge: true }).catch(() => {});
    }
    b.disabled = true;
    saveProfile({ gender: g.dataset.g, birth: bd.v }).then(() => { $("sheet").dataset.locked = ""; closeSheet(true); toast("Saqlandi"); route(); });
  }
  else if (act === "photo-remove") { setMyPhoto(""); const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "auth-tab") setAuthTab(b.dataset.t);
  else if (act === "auth-google") googleSignIn();
  else if (act === "auth-guest") startGuest();
  else if (act === "auth-tg") tgSignIn();
  else if (act === "close-sheet") closeSheet(true);
  else if (act === "guest-signup") { closeSheet(true); const u = auth && auth.currentUser; if (u && !USER) { showVerify(u); verifyCheck(true); } else { showAuth(false); setAuthTab("signup"); $("auth-email").open = false; window.scrollTo(0, 0); } }
  else if (act === "pass-eye") { const i = $("a-pass"), on = i.type === "password"; i.type = on ? "text" : "password"; b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "Yashirish" : "Koʻrsatish"; }
  else if (act === "auth-reset") resetPassword();
  else if (act === "logout") { ADMIN = false; ADMIN_DATA = null; setLastUser(null); nativeSignOut(); cloudFlush().then(() => auth && auth.signOut()); go("home"); }
  else if (act === "verify-again") verifySend();
  else if (act === "verify-check") verifyCheck(false);
  else if (act === "verify-out") { setLastUser(null); if (auth) auth.signOut(); }
  else if (act === "delete-ask") {
    $("del-box").innerHTML = `<div class="notice"><div><b>Hisob butunlay oʻchirilsinmi?</b> Barcha natijalaringiz yoʻqoladi va buni qaytarib boʻlmaydi.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button class="btn btn-ghost" data-act="go" data-to="settings">Bekor qilish</button><button class="btn btn-danger" data-act="delete-yes">Ha, oʻchirish</button></div></div>`;
  }
  else if (act === "delete-yes") deleteAccount(b);
  else if (act === "close-session") quitAsk();
  else if (act === "quit-stay") closeSheet();
  else if (act === "quit-go") { closeSheet(true); closeSession(); }
  else if (act === "again") startSession(SES.mode, SES.u);
  else if (act === "mic") micToggle();
  else if (act === "ls-play") speak(b.dataset.t, null, b.dataset.slow ? 0.55 : 0.85);
  else if (act === "ls-ans") lsPick(+b.dataset.o, b);
  else if (act === "ls-check") lsCheck();
  else if (act === "ls-skip") lsCheck(true);
  else if (act === "listen-modes") listenSheet();
  else if (act === "modes-all") modesAllSheet();
  else if (act === "speak-modes") speakSheet();
  else if (act === "write-modes") writeSheet();
  else if (act === "wr-check") wrRun(b.dataset.id, b.dataset.key);
  else if (act === "wr-open") { KTAB = "ex"; closeSheet(true); }
  else if (act === "sheet-close-link") closeSheet(true);
  else if (act === "sk-go") skGo(b.dataset.s);
  else if (act === "rec") recRun(b.dataset.id);
  else if (act === "say-skip") sayFinish(false, true);
  else if (act === "flip") $("flip").classList.toggle("on");
  else if (act === "card-know") { good(); nextStep(); }
  else if (act === "card-again") {
    tick();
    const w = SES.items[SES.i];
    if (srs(w)) grade(w, false);
    if (!SES.re.has(w.tr)) { SES.re.add(w.tr); SES.items.push(w); }
    nextStep();
  }
  else if (act === "answer") {
    if (SES.answered) return;
    SES.answered = true;
    const ok = b.dataset.ok === "1";
    document.querySelectorAll(".opt").forEach(o => { if (o.dataset.ok === "1") o.classList.add("right"); });
    const fb = $("fb"), rv = $("ls-reveal");
    if (rv) rv.hidden = false;
    if (ok) { good(); fb.className = "feedback ok"; fb.textContent = "Doğru! Toʻgʻri javob."; }
    else { bad(); b.classList.add("wrong"); fb.className = "feedback no"; fb.innerHTML = `Yanlış. Toʻgʻrisi: <b>${esc(SES.correct.tr)}</b> — ${esc(SES.correct.uz)}`; }
    const nbtn = foot.querySelector("[data-act=next]"); nbtn.disabled = false; nbtn.focus();
  }
  else if (act === "next") nextStep();
  else if (act === "k-lv") { KLV = b.dataset.l; kRerender(); }
  else if (act === "k-tab") { KTAB = b.dataset.t; route(); const t = document.querySelector(".k-tabs"); if (t) window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - 70); }
  else if (act === "k-check") { const inp = $(`ki-${b.dataset.id}-${b.dataset.key}`); kSubmit(b.dataset.id, b.dataset.key, inp.value); kRerender(); }
  else if (act === "k-dy") { kSubmit(b.dataset.id, b.dataset.key, b.dataset.v); kRerender(); }
  else if (act === "k-reveal") {
    const id = b.dataset.id, key = b.dataset.key, u = KU[id], [n, k] = key.split("-");
    const right = n === "r" ? u.reading.ans[k] : u.exercises.find(x => String(x.n) === n).ans[k];
    b.outerHTML = `<span class="muted">Namuna: <b lang="tr">${esc(right)}</b></span> <button class="link" data-act="k-self" data-id="${id}" data-key="${key}">Men ham shunday yozdim ✓</button>`;
  }
  else if (act === "k-self") { const st = kState(b.dataset.id), key = b.dataset.key; if (st.e[key] !== 1) { st.e[key] = 1; st.f = st.f || {}; if (!(key in st.f)) st.f[key] = 1; skillLog("w", true); save(); if (!kBlockAward(b.dataset.id, key)) pamukSay("happy", praise()); } kRerender(); }
  else if (act === "k-tq") { KTEST_ANS[+b.dataset.i] = +b.dataset.o; b.parentElement.querySelectorAll(".opt").forEach(o => o.classList.toggle("picked", o === b)); }
  else if (act === "k-test-done") ktFinish(b.dataset.l);
  else if (act === "kt-l") { KT_ANS.l[+b.dataset.i] = +b.dataset.o; b.parentElement.querySelectorAll(".opt").forEach(o => o.classList.toggle("picked", o === b)); }
  else if (act === "kt-mic") ktMic(b.dataset.l, +b.dataset.i, b);
  else if (act === "pl-r" || act === "pl-l") { plGet().ans[act.slice(3)][+b.dataset.i] = +b.dataset.o; b.parentElement.querySelectorAll(".opt").forEach(o => o.classList.toggle("picked", o === b)); }
  else if (act === "pl-mic") plMic(+b.dataset.i, b);
  else if (act === "pl-done") plFinish();
  else if (act === "pl-again") { PL = null; route(); window.scrollTo(0, 0); }
  else if (act === "pl-apply") plApply(b.dataset.l);
  else if (act === "pl-skip") { S.place = { at: todayKey(), skipped: 1 }; save(); route(); }
  else if (act === "k-test-again") { KTEST_ANS = {}; KTEST_RES = null; KT_GEN[b.dataset.l] = null; KT_ANS = { lv: b.dataset.l, l: {}, w: {}, s: {} }; route(); window.scrollTo(0, 0); }
  else if (act === "say-seq") speakSeq(JSON.parse(b.dataset.lines));
  else if (act === "cel-next") nextCelebrate();
  else if (act === "share") shareSite(b.dataset.text);
  else if (act === "recap") showRecap();
  else if (act === "tg-browser") tgOpenBrowser();
  else if (act === "oq-lv") { OQ_LV = b.dataset.l; route(); }
  else if (act === "oq-ans") { const a = OQ_ANS[b.dataset.id] || (OQ_ANS[b.dataset.id] = {}); if (a.done) return; a[+b.dataset.q] = +b.dataset.o; const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "oq-check") oqCheck(b.dataset.id);
  else if (act === "oq-again") { OQ_ANS[b.dataset.id] = {}; delete OQ_ORDER[b.dataset.id]; const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "fr-add") { b.disabled = true; frAdd(b.dataset.u); }
  else if (act === "fr-share") shareLink(frLink(), "Keling, turk tilini birga oʻrganamiz! Türkçe Yoʻl'da doʻst boʻlaylik:");
  else if (act === "fr-copy") copyText(frLink(), "Havola nusxalandi");
  else if (act === "fr-del") { if (b.dataset.sure) frRemove(b.dataset.u); else { b.dataset.sure = "1"; b.textContent = "Olib tashlansinmi?"; } }
  else if (act === "sheet-done") closeSheet(true);
  else if (act === "install") doInstall();
  else if (act === "install-hide") { try { localStorage.setItem("ty-install-hide", "1"); } catch (err) {} kRerender(); }
  else if (act === "onb-next") { if (ONB_I < ONB.length - 1) { ONB_I++; showOnboard(); } else endOnboard(); }
  else if (act === "onb-skip") endOnboard();
  else if (act === "gx-start") startSession("gx", b.dataset.c);
  else if (act === "gx-ans") {
    if (SES.answered) return;
    const ex = SES.items[SES.i].ex, ok = +b.dataset.o === ex.a;
    document.querySelectorAll(".opt").forEach(o => { o.disabled = true; if (+o.dataset.o === ex.a) o.classList.add("right"); });
    if (!ok) b.classList.add("wrong");
    gxFinish(ok, ex.o[ex.a]);
  }
  else if (act === "gx-check") gxCheckType();
  else if (act === "gx-order") gxCheckOrder();
  else if (act === "gx-skip") { const ex = SES.items[SES.i].ex; if (ex.t === "t") gxCheckType(true); else gxCheckOrder(true); }
  else if (act === "ord-tok") {
    if (SES.answered) return;
    const i = +b.dataset.i, inAns = b.parentElement.id === "ord-ans";
    if (inAns) { SES.ord.splice(SES.ord.indexOf(i), 1); $("ord-pool").appendChild(b); }
    else { SES.ord.push(i); $("ord-ans").appendChild(b); }
    const total = SES.items[SES.i].ex.s.split(" ").length;
    foot.querySelector("[data-act=gx-order]").disabled = SES.ord.length !== total;
  }
  else if (act === "type-check") checkType();
  else if (act === "type-skip") checkType(true);
  else if (act === "bk") { if (SES && SES.answered) return; const i = +b.dataset.i; if (BANK && !BANK.used.includes(i)) { BANK.used.push(i); bankWrite(); } }
  else if (act === "bk-del") { if (SES && SES.answered) return; if (BANK && BANK.used.length) { BANK.used.pop(); bankWrite(); } else { const inp = $("type-input"); if (inp) inp.value = inp.value.slice(0, -1); } }
  else if (act === "ibk") ibTap(+b.dataset.i);
  else if (act === "ibk-del") ibDel();
  else if (act === "ibk-kbd") ibKbd();
  else if (act === "bk-kbd") { const inp = $("type-input"), f = $("type-form"); if (!inp) return; f.classList.add("kbd"); f.querySelector(".keys").hidden = false; b.hidden = true; inp.setAttribute("inputmode", "text"); BANK = null; inp.focus(); }
  else if (act === "key") {
    const inp = $("type-input");
    const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? s;
    inp.value = inp.value.slice(0, s) + b.dataset.k + inp.value.slice(en);
    inp.focus(); inp.setSelectionRange(s + 1, s + 1);
  }
}
// A tap that needs the full course before it has arrived waits for it, then runs again
document.addEventListener("click", e => {
  try { onAct(e); }
  catch (err) { if (err !== NEED_COURSE) throw err; toast("Yuklanmoqda…"); loadData().then(() => onAct(e), courseOffline); }
});
document.addEventListener("change", e => {
  if (e.target.dataset && e.target.dataset.act === "k-match") { kSubmit(e.target.dataset.id, e.target.dataset.key, e.target.value); kRerender(); }
  if (e.target.dataset && e.target.dataset.act === "gt-kind") { const r = $("gt-ref"); if (r) r.innerHTML = gtOptions(e.target.value).map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join(""); }
  if (e.target.dataset && e.target.dataset.act === "tts-voice") { S.tts = Object.assign({}, S.tts, { v: e.target.value }); save(); speak("Merhaba! Türkçe öğreniyorum."); }
});
let kWriteT;
// Free writing: get the word analyser ready while the learner types, so the check sees wrong suffixes at once
document.addEventListener("input", e => { if (!MORPH_OK && e.target.tagName === "TEXTAREA") loadMorph().catch(() => {}); });
document.addEventListener("input", e => {
  if (!e.target.dataset || e.target.dataset.act !== "k-write") return;
  const st = kState(e.target.dataset.id), key = e.target.dataset.key; st.v[key] = e.target.value;
  clearTimeout(kWriteT); kWriteT = setTimeout(save, 800);
});
document.addEventListener("input", e => {
  if (e.target.dataset && e.target.dataset.act === "kt-w") KT_ANS.w[+e.target.dataset.i] = e.target.value;
  if (e.target.dataset && e.target.dataset.act === "pl-w") plGet().ans.w[+e.target.dataset.i] = e.target.value;
});
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.classList && e.target.classList.contains("k-input")) { const btn = e.target.parentElement.querySelector("[data-act=k-check]"); if (btn) btn.click(); }
});
document.addEventListener("change", async e => {
  if (e.target.id !== "photo-input" || !e.target.files[0]) return;
  try {
    const data = await processPhoto(e.target.files[0]);
    await setMyPhoto(data);
    toast("Rasm saqlandi");
  } catch (err) { toast("Bu faylni rasm sifatida ochib boʻlmadi"); }
  const y = window.scrollY; route(); window.scrollTo(0, y);
});
document.addEventListener("input", e => {
  if (e.target.id === "tr-src") { TR_TEXT = e.target.value; $("tr-count").textContent = TR_TEXT.length + "/500"; return; }
  if (e.target.id === "gq") { GUIDE_Q = e.target.value; $("guide-hits").innerHTML = guideHits(); return; }
  if (e.target.id !== "q") return;
  Q = e.target.value;
  $("search-results").innerHTML = searchResults();
  $("units-block").hidden = !!Q.trim();
});
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!$("sheet").hidden) { if (!$("sheet").dataset.locked) closeSheet(); } else if (SES) quitAsk();
});
/* The app's Back button (plugin App): first the window on top closes — a celebration, a sheet, the practice window
   (an unfinished one opens the «Ketmang» window, like its ✕), the welcome card, the tour — then the page history goes back;
   on the home page the app goes to the background instead of closing. */
function nativeBack(canGoBack) {
  if (!$("celebrate").hidden) { nextCelebrate(); return "celebrate"; }
  // An open window closes first — over a practice that is the «Ketmang» window: Back there means «stay»
  if (!$("sheet").hidden) { if (!$("sheet").dataset.locked) closeSheet(); return "sheet"; }
  // A practice: the same as its ✕ — an unfinished one asks first (quitAsk), a finished or untouched one closes
  if (SES) { quitAsk(); return SES ? "confirm" : "session"; }
  if (!$("welcome").hidden) { hideWelcome(); return "welcome"; }
  if (!$("onboard").hidden) { endOnboard(); return "onboard"; }
  if (!["", "#", "#home"].includes(location.hash) && $("auth").hidden) {
    if (canGoBack) history.back(); else location.hash = "#home";
    return "history";
  }
  const a = nativePlugin("App"); if (a) try { const r = a.minimizeApp(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
  return "minimize";
}
if (IS_NATIVE) { const a = nativePlugin("App"); if (a && a.addListener) try { a.addListener("backButton", e => nativeBack(!!(e && e.canGoBack))); } catch (e) {} }
