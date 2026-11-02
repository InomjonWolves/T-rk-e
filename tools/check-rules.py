# Usage: python3 -I tools/check-rules.py  (needs network to identitytoolkit/firestore; creates and deletes 3 test accounts)
# Confirms the rules DEPLOYED in the console refuse unconfirmed e-mail accounts. If anything is allowed, the console still has older rules.
# Checks the deployed Firestore rules with three throwaway accounts, then deletes everything it created.
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
# These accounts have an UNCONFIRMED e-mail (REST cannot confirm one), so the deployed rules must refuse them everywhere.
# What confirmed accounts may do is covered by tools/rules-emulator.test.js in the official emulator.
try:
    check("unconfirmed: own progress write refused", write(A, f"users/{A['uid']}", {"progress": {"xp": 0}}, ts=False), False)
    check("unconfirmed: own progress read refused", get(A, f"users/{A['uid']}"), False)
    check("unconfirmed: league write refused", write(A, f"league/{A['uid']}", {"name": "A", "week": "2026-11-02", "wxp": 1, "xp": 1, "streak": 0}, ts=False), False)
    check("unconfirmed: league read refused", lst(A, "league"), False)
    check("unconfirmed: avatar write refused", write(A, f"avatars/{A['uid']}", {"photo": "data:image/jpeg;base64,AAAA"}, ts=False), False)
    check("unconfirmed: stats write refused", write(A, f"stats/{A['uid']}", {"v": 1, "d": "2026-11-02", "lv": "A1", "units": 0, "t": {}, "w": {}, "bal": 0, "lvl": {}, "kt": {}, "act": 0}, ts=False), False)
    check("unconfirmed: group create refused", write(T, G, {"name": "Sinov", "owner": T["uid"], "oname": "T"}, exists=False), False)
    check("unconfirmed: group read refused", get(C, G), False)
    check("unconfirmed: member card refused", write(A, f"{G}/members/{A['uid']}", card("A")), False)
finally:
    # Remove everything a run may have written (with older rules the writes succeed)
    for u in (T, A, C):
        for p in (f"{G}/members/{u['uid']}", f"users/{u['uid']}", f"league/{u['uid']}", f"avatars/{u['uid']}", f"stats/{u['uid']}"): delete(u, p)
    print("cleanup group:", delete(T, G))
    for u in (T, A, C):
        s, _ = req("POST", f"https://identitytoolkit.googleapis.com/v1/accounts:delete?key={KEY}", {"idToken": u["tok"]})
        print("delete account", u["email"], s)
print(f"{sum(results)}/{len(results)} passed")
