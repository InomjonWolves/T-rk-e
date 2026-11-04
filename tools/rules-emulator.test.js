// Firestore rules in the official emulator, with every kind of account the site has.
// Not part of `npm test` (needs Java and the emulator). Run:
//   cd <scratch> && npm i firebase-tools@15 @firebase/rules-unit-testing@6 firebase@13
//   npx firebase emulators:exec --only firestore --project demo-turkce "node --test <repo>/tools/rules-emulator.test.js"
// (set NODE_PATH=<scratch>/node_modules so the packages resolve)
const { test, before, after } = require("node:test");
const fs = require("fs");
const path = require("path");
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, serverTimestamp } = require("firebase/firestore");

let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-turkce", firestore: { rules: fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8"), host: "127.0.0.1", port: 8080 } });
});
after(async () => { await env.cleanup(); });

// Token claims of each sign-in kind
const KINDS = {
  emailOk: { email: "a@x.uz", email_verified: true, firebase: { sign_in_provider: "password" } },
  emailNo: { email: "b@x.uz", email_verified: false, firebase: { sign_in_provider: "password" } },
  google: { email: "g@gmail.com", email_verified: true, firebase: { sign_in_provider: "google.com" } },
  googleNo: { email: "x@example.com", email_verified: false, firebase: { sign_in_provider: "google.com" } },
  custom: { name: "Aziz", firebase: { sign_in_provider: "custom" } }
};
const as = (uid, kind) => env.authenticatedContext(uid, KINDS[kind]).firestore();
const card = () => ({ name: "A", week: "2026-11-02", wxp: 1, xp: 1, streak: 0, last: "", sk: {}, units: 0, lv: "A1", act: 0, at: serverTimestamp() });

test("own progress: every confirmed kind may write, an unconfirmed e-mail may not", async () => {
  for (const k of ["emailOk", "google"]) await assertSucceeds(setDoc(doc(as("u-" + k, k), "users/u-" + k), { progress: { xp: 1 } }));
  for (const k of ["googleNo", "custom"]) await assertFails(setDoc(doc(as("u-" + k, k), "users/u-" + k), { progress: { xp: 1 } }));
  await assertFails(setDoc(doc(as("u-no", "emailNo"), "users/u-no"), { progress: { xp: 1 } }));
  await assertFails(getDoc(doc(as("u-no", "emailNo"), "users/u-no")));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "users/u-google")));
  await assertFails(getDoc(doc(as("u-emailOk", "emailOk"), "users/u-google")), "someone else's progress");
});

test("league, avatars, stats need a confirmed account", async () => {
  const row = { name: "A", week: "2026-11-02", wxp: 1, xp: 1, streak: 0 };
  await assertSucceeds(setDoc(doc(as("t1", "google"), "league/t1"), row));
  await assertFails(setDoc(doc(as("n1", "emailNo"), "league/n1"), row));
  await assertSucceeds(getDocs(collection(as("t1", "google"), "league")));
  await assertFails(getDocs(collection(as("n1", "emailNo"), "league")));
  await assertSucceeds(setDoc(doc(as("p1", "emailOk"), "avatars/p1"), { photo: "data:image/jpeg;base64,AAAA" }));
  await assertFails(setDoc(doc(as("n1", "emailNo"), "avatars/n1"), { photo: "data:image/jpeg;base64,AAAA" }));
  const st = { v: 1, d: "2026-11-02", lv: "A1", units: 0, t: {}, w: {}, bal: 0, lvl: {}, kt: {}, act: 0 };
  await assertSucceeds(setDoc(doc(as("g1", "google"), "stats/g1"), st));
  await assertFails(setDoc(doc(as("n1", "emailNo"), "stats/n1"), st));
  await assertFails(getDocs(collection(as("g1", "google"), "stats")), "stats are admin-only");
});

test("admins: only a confirmed admin reads the stats", async () => {
  await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), "admins/adm"), { on: true }); });
  await assertSucceeds(getDocs(collection(as("adm", "google"), "stats")));
  await assertSucceeds(getDoc(doc(as("adm", "google"), "admins/adm")));
  await assertFails(getDoc(doc(as("adm", "google"), "admins/other")));
});

test("groups: Google teacher, Google and e-mail learners; unconfirmed accounts stay out", async () => {
  const T = as("tt", "google"), A = as("aa", "google"), E = as("ee", "emailOk"), N = as("nn", "emailNo");
  await assertFails(setDoc(doc(N, "groups/NOPE22"), { name: "G", owner: "nn", oname: "N", at: serverTimestamp() }));
  await assertSucceeds(setDoc(doc(T, "groups/ABC234"), { name: "Guruh", owner: "tt", oname: "Ustoz", at: serverTimestamp() }));
  await assertSucceeds(getDoc(doc(A, "groups/ABC234")));
  await assertFails(getDoc(doc(N, "groups/ABC234")));
  await assertSucceeds(setDoc(doc(A, "groups/ABC234/members/aa"), card()));
  await assertSucceeds(setDoc(doc(E, "groups/ABC234/members/ee"), card()));
  await assertFails(setDoc(doc(N, "groups/ABC234/members/nn"), card()));
  await assertSucceeds(updateDoc(doc(A, "groups/ABC234/members/aa"), { wxp: 5, at: serverTimestamp() }));
  await assertFails(setDoc(doc(A, "groups/ABC234/members/ee"), card()), "a card for someone else");
  await assertSucceeds(getDocs(collection(T, "groups/ABC234/members")));
  await assertSucceeds(getDocs(collection(E, "groups/ABC234/members")));
  await assertFails(getDocs(collection(as("zz", "google"), "groups/ABC234/members")), "outsider");
  await assertFails(updateDoc(doc(A, "groups/ABC234"), { name: "Buzildi" }));
  await assertSucceeds(deleteDoc(doc(T, "groups/ABC234/members/ee")));
  await assertSucceeds(deleteDoc(doc(A, "groups/ABC234/members/aa")));
  await assertSucceeds(deleteDoc(doc(T, "groups/ABC234")));
});

test("league rows: today/week/league fields, limits, a league step once a week, XP growth rate", async () => {
  const U = as("lg1", "google");
  const ref = doc(U, "league/lg1");
  const row = { name: "A", week: "2026-11-02", wxp: 100, xp: 2000, streak: 3, day: "2026-11-02", dxp: 100, lg: 2, lgw: "2026-11-02", pw: "2026-10-26", pwxp: 900, plg: 1, at: serverTimestamp() };
  await assertSucceeds(setDoc(ref, row));
  await assertFails(setDoc(doc(as("lg2", "google"), "league/lg2"), Object.assign({}, row, { hack: 1 })), "unknown field");
  await assertFails(setDoc(doc(as("lg2", "google"), "league/lg2"), Object.assign({}, row, { dxp: 9000 })), "daily ceiling");
  await assertFails(setDoc(doc(as("lg2", "google"), "league/lg2"), Object.assign({}, row, { wxp: 3000 })), "week above all time");
  await assertFails(setDoc(doc(as("lg2", "google"), "league/lg2"), Object.assign({}, row, { lg: 7, xp: 1500 })), "Legend with 1500 XP");
  await assertFails(setDoc(doc(as("lg2", "google"), "league/lg2"), Object.assign({}, row, { at: 5 })), "at must be the server time");
  // Ordinary progress
  await assertSucceeds(setDoc(ref, Object.assign({}, row, { wxp: 160, xp: 2060, dxp: 160 })));
  // League: no change within the same settling week, one step when a new week is settled
  await assertFails(setDoc(ref, Object.assign({}, row, { wxp: 160, xp: 2060, lg: 3 })));
  await assertFails(setDoc(ref, Object.assign({}, row, { week: "2026-11-09", lgw: "2026-11-09", wxp: 0, xp: 2060, lg: 4 })), "two steps");
  await assertSucceeds(setDoc(ref, Object.assign({}, row, { week: "2026-11-09", lgw: "2026-11-09", wxp: 0, xp: 2060, lg: 3 })));
  // XP cannot jump by thousands at once
  await assertFails(setDoc(ref, Object.assign({}, row, { week: "2026-11-09", lgw: "2026-11-09", wxp: 0, xp: 9000, lg: 3 })));
  // Old rows without the new fields still update
  const O = as("lg3", "emailOk");
  await assertSucceeds(setDoc(doc(O, "league/lg3"), { name: "B", week: "2026-11-02", wxp: 1, xp: 1, streak: 0 }));
  await assertSucceeds(setDoc(doc(O, "league/lg3"), { name: "B", week: "2026-11-02", wxp: 40, xp: 41, streak: 1, day: "2026-11-02", dxp: 40, lg: 1, lgw: "", pw: "", pwxp: 0, plg: 1, at: serverTimestamp() }));
});

test("push rows: only the owner writes, reads and deletes; shape is checked", async () => {
  const U = as("pu1", "google"), O = as("pu2", "google");
  const row = { t: "tok", h: 14, z: -300, d: "2026-11-03", s: 3, at: serverTimestamp() };
  await assertSucceeds(setDoc(doc(U, "push/pu1"), row));
  await assertSucceeds(getDoc(doc(U, "push/pu1")));
  await assertFails(getDoc(doc(O, "push/pu1")), "someone else's token");
  await assertFails(setDoc(doc(O, "push/pu1"), row));
  await assertFails(setDoc(doc(U, "push/pu1"), Object.assign({}, row, { h: 24 })));
  await assertFails(setDoc(doc(U, "push/pu1"), Object.assign({}, row, { x: 1 })));
  await assertFails(setDoc(doc(as("pn", "emailNo"), "push/pn"), row));
  await assertFails(getDocs(collection(U, "push")), "no listing");
  await assertSucceeds(deleteDoc(doc(U, "push/pu1")));
});

test("invites: one writes only one's own note to someone else; the owner reads and clears", async () => {
  const A = as("ia", "google"), B = as("ib", "google"), C = as("ic", "emailOk");
  const note = { name: "Bek", at: serverTimestamp() };
  await assertSucceeds(setDoc(doc(B, "invites/ia/from/ib"), note));
  await assertFails(setDoc(doc(B, "invites/ia/from/ic"), note), "in someone else's name");
  await assertFails(setDoc(doc(A, "invites/ia/from/ia"), note), "to oneself");
  await assertFails(setDoc(doc(B, "invites/ia/from/ib"), { name: "Bek", at: serverTimestamp(), xp: 1 }));
  await assertFails(getDocs(collection(C, "invites/ia/from")), "a stranger reads");
  await assertSucceeds(getDocs(collection(A, "invites/ia/from")));
  await assertSucceeds(deleteDoc(doc(A, "invites/ia/from/ib")));
  await assertFails(setDoc(doc(as("in", "emailNo"), "invites/ia/from/in"), note));
});
