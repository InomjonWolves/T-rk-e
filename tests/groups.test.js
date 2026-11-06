// Teacher and class groups: create, join by link, member cards, teacher view, removal, deletion.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ROOT, launch, openApp } = require("./helpers");
const { openFb } = require("./fakefb");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

const T = { uid: "t1", displayName: "Malika Karimova", email: "t@x.uz" };
const A = { uid: "s1", displayName: "Aziz Rahimov", email: "a@x.uz" };
const B = { uid: "s2", displayName: "Dilnoza", email: "d@x.uz" };
const prof = name => ({ name, gender: "f", birth: "2000-01-01", progress: { onb: 1 } });
const SEED = { "users/t1": prof("Malika Karimova"), "users/s1": prof("Aziz Rahimov"), "users/s2": prof("Dilnoza") };
const as = async (page, u) => {
  await page.evaluate(u => { __fbUser(null); __fbUser(u); }, u);
  await page.waitForFunction(uid => USER && USER.uid === uid && document.getElementById("auth").hidden, u.uid);
};
const hash = async (page, h) => { await page.evaluate(h => { location.hash = h; }, h); await page.waitForTimeout(120); };

test("teacher creates a group, learners join by link, the teacher sees their skills", async () => {
  const { page, errors } = await openFb(browser, "#groups", { user: T, seed: SEED });
  await hash(page, "#groups");
  await page.fill("#grp-name", "A1 kechki guruh");
  await page.click("[data-form=grp-create] button[type=submit]");
  await page.waitForFunction(() => /^#group-[A-Z0-9]{6}$/.test(location.hash) && document.querySelector(".grp-share"));
  const code = await page.evaluate(() => location.hash.slice(7));
  assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.deepEqual(await page.evaluate(c => __db["groups/" + c], code), { name: "A1 kechki guruh", owner: "t1", oname: "Malika Karimova", at: "TS" });
  assert.ok((await page.textContent(".grp-share code")).endsWith("#join-" + code));

  // Learner 1 opens the invite link (lower-case code also works) and joins
  await as(page, A);
  await hash(page, "#join-" + code.toLowerCase());
  await page.waitForSelector("[data-act=grp-join]");
  assert.match(await page.textContent("#grp-join"), /A1 kechki guruh[\s\S]*Malika Karimova/);
  await page.click("[data-act=grp-join]");
  await page.waitForFunction(c => location.hash === "#group-" + c && document.querySelector(".grp-list"), code);
  assert.deepEqual(await page.evaluate(() => S.grp), [code]);
  // Practice: XP and a listening answer reach the card on the next sync
  await page.evaluate(() => { addXP(30); skillLog("l", true); skillLog("l", false); save(); grpSync(true); });
  await page.waitForTimeout(50);
  const card = await page.evaluate(c => __db[`groups/${c}/members/s1`], code);
  assert.equal(card.name, "Aziz Rahimov");
  assert.ok(card.wxp >= 30);
  assert.deepEqual(card.sk.l.slice(0, 2), [1, 2]);
  assert.deepEqual(Object.keys(card).sort(), ["act", "at", "last", "lv", "name", "sk", "streak", "tk", "units", "week", "wxp", "xp"]);
  // A learner sees the group ranking, not the skill details
  assert.equal(await page.evaluate(() => !!document.querySelector(".grp-m, [data-act=grp-kick]")), false);
  assert.match(await page.textContent(".grp-list"), /Aziz Rahimov \(siz\)/);

  // Learner 2 joins with the code typed on the Groups page
  await as(page, B);
  await hash(page, "#groups");
  await page.fill("#grp-code", code.slice(0, 3) + "-" + code.slice(3));
  await page.click("[data-form=grp-join] button[type=submit]");
  await page.waitForFunction(c => location.hash === "#group-" + c, code);

  // The teacher: both learners, skill bars, weakest skill of the group
  await as(page, T);
  await hash(page, "#groups");
  await page.waitForFunction(() => document.querySelector("#grp-list .unit"));
  assert.match(await page.textContent("#grp-list"), /A1 kechki guruh[\s\S]*Siz — oʻqituvchi/);
  await hash(page, "#group-" + code);
  await page.waitForSelector(".grp-m");
  assert.equal(await page.locator(".grp-m").count(), 2);
  assert.match(await page.textContent(".grp-list .grp-m:first-child summary"), /Aziz Rahimov[\s\S]*\d+ XP/);
  assert.match(await page.textContent("#grp-body"), /2\/2 bu hafta faol|1\/2 bu hafta faol/);
  assert.match(await page.textContent("#grp-body"), /eng zaif koʻnikmasi/);
  // Remove learner 2 (two taps)
  await page.click(".grp-list .grp-m:nth-child(2) summary");
  await page.click(".grp-list .grp-m:nth-child(2) [data-act=grp-kick]");
  await page.click(".grp-list .grp-m:nth-child(2) [data-act=grp-kick]");
  await page.waitForFunction(c => !__db[`groups/${c}/members/s2`] && document.querySelectorAll(".grp-m").length === 1, code);

  // Learner 2's next sync finds the card gone and forgets the group
  await as(page, B);
  await page.evaluate(() => { GRP_SYNC_AT = 0; grpSync(true); });
  await page.waitForFunction(() => !S.grp.length);
  assert.match(await page.textContent("#toast"), /guruhdan chiqarilgansiz/);

  // Learner 1 leaves on their own
  await as(page, A);
  await hash(page, "#group-" + code);
  await page.waitForSelector("[data-act=grp-leave]");
  await page.evaluate(() => document.querySelector("[data-act=grp-leave]").click());
  await page.waitForFunction(c => !__db[`groups/${c}/members/s1`] && location.hash === "#groups" && !S.grp.length, code);

  // The teacher deletes the group: its member cards go too
  await as(page, A); await page.evaluate(c => grpJoin(c), code);
  await page.waitForFunction(c => !!__db[`groups/${c}/members/s1`], code, { timeout: 4000 }).catch(async e => { throw new Error("rejoin: " + JSON.stringify(await page.evaluate(() => [location.hash, S.grp, USER && USER.uid, document.getElementById("toast").innerText, Object.keys(__db).filter(k => k.includes("members")), __log.slice(-14)]))); });
  await as(page, T);
  await hash(page, "#group-" + code);
  await page.waitForSelector("[data-act=grp-del-ask]");
  await page.click("[data-act=grp-del-ask]");
  await page.click("[data-act=grp-del-yes]");
  await page.waitForFunction(c => !Object.keys(__db).some(k => k.startsWith("groups/" + c)) && location.hash === "#groups", code);
  assert.deepEqual(errors, []);
  await page.close();
});

test("groups: wrong codes, own group, the five-group limit and account deletion", async () => {
  const seed = Object.assign({}, SEED);
  for (let i = 0; i < 6; i++) { seed[`groups/GRP00${i}`] = { name: "G" + i, owner: "t1", oname: "M", at: "TS" }; }
  seed["groups/MYOWN1"] = { name: "Mine", owner: "s1", oname: "Aziz", at: "TS" };
  const { page, errors } = await openFb(browser, "#groups", { user: A, seed });
  await page.evaluate(() => grpJoin("NOPE22"));
  await page.waitForTimeout(50);
  assert.match(await page.textContent("#toast"), /topilmadi/);
  await page.evaluate(() => grpJoin("abc"));
  assert.match(await page.textContent("#toast"), /6 ta belgi/);
  // Own group opens as teacher instead of joining
  await page.evaluate(() => grpJoin("MYOWN1"));
  await page.waitForFunction(() => location.hash === "#group-MYOWN1");
  assert.equal(await page.evaluate(() => !__db["groups/MYOWN1/members/s1"]), true);
  for (let i = 0; i < 5; i++) await page.evaluate(c => grpJoin(c), `GRP00${i}`);
  await page.waitForFunction(() => S.grp.length === 5);
  await page.evaluate(() => grpJoin("GRP005"));
  await page.waitForTimeout(50);
  assert.match(await page.textContent("#toast"), /5 ta guruhga/);
  // Deleting the account removes the member cards and the groups the learner owns
  await page.evaluate(() => grpWipe("s1"));
  const left = await page.evaluate(() => Object.keys(__db).filter(k => k.includes("/members/s1") || k === "groups/MYOWN1"));
  assert.deepEqual(left, []);
  assert.deepEqual(errors, []);
  await page.close();
});

test("groups need an account; the settings page links to them", async () => {
  const { page, errors } = await openApp(browser, "#groups");
  assert.match(await page.textContent("#app"), /Guruhlar hisob bilan ishlaydi/);
  await page.evaluate(() => { location.hash = "#settings"; });
  await page.waitForTimeout(80);
  assert.ok(await page.evaluate(() => !!document.querySelector('a[href="#groups"]')));
  assert.deepEqual(errors, []);
  await page.close();
});

test("firestore rules: groups are created by their owner, member cards are written only by the member", () => {
  const r = fs.readFileSync(path.join(ROOT, "firestore.rules"), "utf8");
  const g = r.slice(r.indexOf("match /groups/{gid}"), r.indexOf("// Profil rasmlari"));
  assert.match(g, /allow create: if okUser\(\) && gid\.matches\('\^\[A-Z0-9\]\{6\}\$'\)\s*&& request\.resource\.data\.owner == request\.auth\.uid/);
  assert.match(g, /allow update: if okUser\(\) && resource\.data\.owner == request\.auth\.uid\s*&& request\.resource\.data\.owner == resource\.data\.owner/);
  const m = g.slice(g.indexOf("match /members/{uid}"));
  assert.match(m, /allow create, update: if okUser\(\) && request\.auth\.uid == uid/);
  assert.match(m, /hasOnly\(\['name', 'week', 'wxp', 'xp', 'streak', 'last', 'sk', 'units', 'lv', 'act', 'tk', 'at'\]\)/);
  assert.match(m, /allow delete: if okUser\(\) && \(request\.auth\.uid == uid \|\| g\(\)\.owner == request\.auth\.uid\)/);
  // Brace balance
  assert.equal((r.match(/\{/g) || []).length, (r.match(/\}/g) || []).length);
});

test("sync: with equal XP the copy saved last wins; signing out writes a pending save first", async () => {
  const seed = Object.assign({}, SEED, { "users/s1": Object.assign(prof("Aziz Rahimov"), { progress: { onb: 1, xp: 10, savedAt: 1000, grp: ["OLD111"] } }) });
  const { page, errors } = await openFb(browser, "#home", { seed });
  await page.evaluate(() => { localStorage["turkce-yol-v1:s1"] = JSON.stringify({ onb: 1, xp: 10, savedAt: 2000, grp: [] }); });
  await as(page, A);
  assert.deepEqual(await page.evaluate(() => S.grp), []);
  // A change right before "Hisobdan chiqish" still reaches the server
  await page.evaluate(() => { S.goal = 100; save(); });
  await page.evaluate(() => { location.hash = "#settings"; });
  await page.waitForSelector("[data-act=logout]");
  await page.click("[data-act=logout]");
  await page.waitForFunction(() => !USER);
  assert.equal(await page.evaluate(() => __db["users/s1"].progress.goal), 100);
  assert.deepEqual(errors, []);
  await page.close();
});

test("group tasks: the teacher sets a reading text with a deadline, the learner sees it and finishes it, the teacher exports a spreadsheet", async () => {
  const seed = Object.assign({}, SEED, {
    "groups/TSK234": { name: "Kechki guruh", owner: "t1", oname: "Malika Karimova", at: "TS" },
    "groups/TSK234/members/s1": { name: "Aziz Rahimov", week: "", wxp: 0, xp: 10, streak: 0, last: "", sk: {}, units: 0, lv: "A1", act: 0, at: "TS" },
    "users/s1": Object.assign(prof("Aziz Rahimov"), { progress: { onb: 1, grp: ["TSK234"] } })
  });
  const { page, errors } = await openFb(browser, "#home", { user: T, seed });
  await hash(page, "#group-TSK234");
  await page.waitForSelector(".gt-form");
  await page.evaluate(() => { const k = document.getElementById("gt-kind"); k.value = "oq"; k.dispatchEvent(new Event("change", { bubbles: true })); });
  await page.waitForFunction(() => document.querySelector("#gt-ref option[value=aile]"));
  await page.evaluate(() => { document.getElementById("gt-ref").value = "aile"; document.getElementById("gt-due").value = "2030-01-15"; document.querySelector("[data-act=gt-add]").click(); });
  await page.waitForFunction(() => Object.keys(__db).some(k => k.startsWith("groups/TSK234/tasks/")));
  const [path0, task] = await page.evaluate(() => Object.entries(__db).find(([k]) => k.startsWith("groups/TSK234/tasks/")));
  assert.deepEqual(task, { title: "A1 · Benim Ailem", kind: "oq", ref: "aile", due: "2030-01-15", at: "TS" });
  await page.waitForSelector(".gt-row");
  assert.match(await page.textContent(".gt-row"), /Benim Ailem[\s\S]*15\.01\.2030[\s\S]*0\/1/);

  // The learner: the task on the home page and in the group, done after reading the text
  await as(page, A);
  await page.waitForFunction(() => (S.gtk || {}).TSK234 && S.gtk.TSK234.length === 1);
  await hash(page, "#home");
  assert.match(await page.textContent("#app"), /Oʻqituvchi topshiriqlari[\s\S]*Benim Ailem/);
  await page.evaluate(() => { S.oq = { aile: 100 }; save(); grpSync(true); });
  const tid = path0.split("/").pop();
  await page.waitForFunction(id => (__db["groups/TSK234/members/s1"].tk || {})[id] === 1, tid);
  await hash(page, "#group-TSK234");
  await page.waitForSelector(".gt-row");
  assert.match(await page.textContent(".gt-row"), /bajarildi/);

  // The teacher: 1/1 and the spreadsheet
  await as(page, T);
  await hash(page, "#group-TSK234");
  await page.evaluate(() => document.querySelector("[data-act=grp-reload]").click());
  await page.waitForFunction(() => /1\/1/.test((document.querySelector(".gt-row") || {}).textContent || ""));
  await page.evaluate(() => document.querySelector("[data-act=grp-csv]").click());
  const csv = await page.evaluate(() => window.__lastCsv);
  const lines = csv.replace(/^﻿/, "").split("\r\n");
  assert.match(lines[0], /^Ism;Bu hafta XP;Jami XP;Daraja;.*Topshiriq: A1 · Benim Ailem$/);
  assert.match(lines[1], /^Aziz Rahimov;.*;ha$/);
  // A name that looks like a formula stays text in Excel (no formula injection through the spreadsheet)
  const evil = await page.evaluate(() => {
    GRP.XLS234 = { g: { name: "X" }, m: [{ name: "=HYPERLINK(1)", xp: 0, sk: {} }, { name: "@SUM(A1)", xp: 0, sk: {} }, { name: "+1", xp: 0, sk: {} }, { name: "Ali", xp: 0, sk: {} }], tk: [] };
    grpCsv("XLS234"); delete GRP.XLS234;
    return window.__lastCsv.replace(/^\ufeff/, "").split("\r\n").slice(1).map(l => l.split(";")[0]);
  });
  assert.deepEqual(evil, ["'=HYPERLINK(1)", "'@SUM(A1)", "'+1", "Ali"]);
  // Delete (two taps)
  await page.evaluate(() => document.querySelector("[data-act=gt-del]").click());
  await page.evaluate(() => document.querySelector("[data-act=gt-del]").click());
  await page.waitForFunction(() => !Object.keys(__db).some(k => k.startsWith("groups/TSK234/tasks/")));
  assert.deepEqual(errors, []);
});

test("rules published before group tasks: the card is sent without tk and the learner stays in the group", async () => {
  const seed = Object.assign({}, SEED, {
    "groups/OLD234": { name: "Eski", owner: "t1", oname: "Malika", at: "TS" },
    "groups/OLD234/members/s1": { name: "Aziz Rahimov", week: "", wxp: 0, xp: 0, streak: 0, last: "", sk: {}, units: 0, lv: "A1", act: 0, at: "TS" },
    "users/s1": Object.assign(prof("Aziz Rahimov"), { progress: { onb: 1, grp: ["OLD234"] } })
  });
  const { page, errors } = await openFb(browser, "#home", { user: A, seed });
  await page.evaluate(() => { __deny((op, p, d) => d && "tk" in d && p.includes("/members/")); delete __db["groups/OLD234/members/s1"].tk; addXP(40); grpSync(true); });
  await page.waitForFunction(() => __db["groups/OLD234/members/s1"].xp >= 40);
  assert.deepEqual(await page.evaluate(() => [S.grp, "tk" in __db["groups/OLD234/members/s1"]]), [["OLD234"], false]);
  assert.deepEqual(errors, []);
});
