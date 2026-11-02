# Usage: python3 -I tools/check-rules.py  (needs network to identitytoolkit/firestore; creates and deletes 3 test accounts)
# Checks the deployed Firestore rules for groups with three throwaway accounts, then deletes everything it created.
import json, os, random, re, ssl, string, urllib.request, urllib.error
CFG = open("/home/user/T-rk-e/firebase-config.js").read()
KEY = re.search(r'apiKey: "([^"]+)"', CFG).group(1)
PROJ = "t-rk-e"
CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJ}/databases/(default)/documents"
def req(method, url, body=None, tok=None):
    h = {"Content-Type": "application/json"}
    if tok: h["Authorization"] = "Bearer " + tok
    r = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, context=CTX, timeout=30) as f: return f.status, json.loads(f.read() or b"{}")
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read() or b"{}")
        except Exception: return e.code, {}
def signup():
    em = "rules-test-" + "".join(random.choices(string.ascii_lowercase + string.digits, k=10)) + "@example.com"
    s, d = req("POST", f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={KEY}", {"email": em, "password": "Test-" + "".join(random.choices(string.ascii_letters, k=14)), "returnSecureToken": True})
    assert s == 200, (s, d)
    return {"uid": d["localId"], "tok": d["idToken"], "email": em}
def val(v):
    if isinstance(v, bool): return {"booleanValue": v}
    if isinstance(v, int): return {"integerValue": str(v)}
    if isinstance(v, str): return {"stringValue": v}
    if isinstance(v, list): return {"arrayValue": {"values": [val(x) for x in v]}}
    if isinstance(v, dict): return {"mapValue": {"fields": {k: val(x) for k, x in v.items()}}}
def write(u, path, data, exists=None, ts=True):
    w = {"update": {"name": f"projects/{PROJ}/databases/(default)/documents/{path}", "fields": {k: val(x) for k, x in data.items()}}}
    if ts: w["updateTransforms"] = [{"fieldPath": "at", "setToServerValue": "REQUEST_TIME"}]
    if exists is not None: w["currentDocument"] = {"exists": exists}
    return req("POST", f"{BASE}:commit", {"writes": [w]}, u["tok"])[0]
def delete(u, path): return req("DELETE", f"{BASE}/{path}", None, u["tok"])[0]
def get(u, path): return req("GET", f"{BASE}/{path}", None, u["tok"])[0]
def lst(u, path): return req("GET", f"{BASE}/{path}?pageSize=50", None, u["tok"])[0]

T, A, C = signup(), signup(), signup()
code = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", k=6))
card = lambda n: {"name": n, "week": "2026-11-02", "wxp": 10, "xp": 50, "streak": 2, "last": "2026-11-02", "sk": {"r": [1, 2, 1]}, "units": 1, "lv": "A1", "act": 3}
results = []
def check(name, got, want):
    ok = (got == 200) == want
    results.append(ok); print(("OK  " if ok else "FAIL"), name, "->", got)
G = f"groups/{code}"
try:
    check("teacher: group with someone else as owner is refused", write(T, G, {"name": "X", "owner": A["uid"], "oname": "T"}, exists=False), False)
    check("teacher: lower-case code is refused", write(T, f"groups/{code.lower()}", {"name": "X", "owner": T["uid"], "oname": "T"}, exists=False), False)
    check("teacher: extra field is refused", write(T, G, {"name": "X", "owner": T["uid"], "oname": "T", "hack": 1}, exists=False), False)
    check("teacher: creates the group", write(T, G, {"name": "Sinov guruhi", "owner": T["uid"], "oname": "Sinov oʻqituvchi"}, exists=False), True)
    check("learner: reads the group by code", get(A, G), True)
    check("learner: cannot rename the group", write(A, G, {"name": "Buzildi", "owner": T["uid"], "oname": "T"}), False)
    check("learner: cannot take the group over", write(A, G, {"name": "X", "owner": A["uid"], "oname": "T"}), False)
    check("outsider: cannot list members before joining", lst(C, G + "/members"), False)
    check("learner: writes a card for someone else — refused", write(A, f"{G}/members/{C['uid']}", card("Soxta")), False)
    check("learner: card with an extra field — refused", write(A, f"{G}/members/{A['uid']}", dict(card("A"), email="x@y.z")), False)
    check("learner: card with a client time — refused", write(A, f"{G}/members/{A['uid']}", dict(card("A"), at="2020"), ts=False), False)
    check("learner: joins (own card)", write(A, f"{G}/members/{A['uid']}", card("Sinov oʻquvchi")), True)
    check("learner: updates own card", write(A, f"{G}/members/{A['uid']}", dict(card("Sinov oʻquvchi"), wxp=40), exists=True), True)
    check("teacher: cannot add a card for themselves", write(T, f"{G}/members/{T['uid']}", card("T")), False)
    check("teacher: lists members", lst(T, G + "/members"), True)
    check("learner: lists group members", lst(A, G + "/members"), True)
    check("outsider: still cannot list members", lst(C, G + "/members"), False)
    check("outsider: cannot read a learner's card", get(C, f"{G}/members/{A['uid']}"), False)
    check("outsider: cannot remove a learner", delete(C, f"{G}/members/{A['uid']}"), False)
    check("teacher: removes the learner", delete(T, f"{G}/members/{A['uid']}"), True)
    check("learner: update after removal fails (app then forgets the group)", write(A, f"{G}/members/{A['uid']}", card("A"), exists=True), False)
    check("learner: joins again and leaves", write(A, f"{G}/members/{A['uid']}", card("A")) == 200 and delete(A, f"{G}/members/{A['uid']}") or 0, True)
    check("outsider: cannot delete the group", delete(C, G), False)
    check("existing rules still work: own users doc", write(A, f"users/{A['uid']}", {"progress": {"xp": 0}}, ts=False), True)
    check("existing rules still work: someone else's users doc refused", get(C, f"users/{A['uid']}"), False)
finally:
    for u in (A, C): delete(u, f"{G}/members/{u['uid']}"); delete(u, f"users/{u['uid']}")
    print("cleanup group:", delete(T, G))
    for u in (T, A, C):
        s, _ = req("POST", f"https://identitytoolkit.googleapis.com/v1/accounts:delete?key={KEY}", {"idToken": u["tok"]})
        print("delete account", u["email"], s)
print(f"{sum(results)}/{len(results)} passed")
