#!/usr/bin/env python3
"""Carga FIREBASE_SA_JSON (cuenta de servicio de arain-database) en los dos proyectos de Vercel de
la boda, para que funcione api/admin.js (crear parejas, claves, suspender). Se corre una vez."""
import json, urllib.request
T = open("/Users/idk/.arain-credenciales/vercel.txt").read().strip()
SA = open("/Users/idk/ARAINv3/bot/firebase-service-account.json").read()
def req(m, u, d=None):
    r = urllib.request.Request(u, method=m, headers={"Authorization": "Bearer " + T, "Content-Type": "application/json"}, data=json.dumps(d).encode() if d else None)
    try: return json.load(urllib.request.urlopen(r))
    except urllib.error.HTTPError as e: return {"error": json.load(e)}
for p in ("boda", "boda-4ype"):
    q = "?teamId=idkdiegoos-projects"
    for e in [e for e in req("GET", f"https://api.vercel.com/v9/projects/{p}/env{q}").get("envs", []) if e["key"] == "FIREBASE_SA_JSON"]:
        req("DELETE", f"https://api.vercel.com/v9/projects/{p}/env/{e['id']}{q}")
    r = req("POST", f"https://api.vercel.com/v10/projects/{p}/env{q}", {"key": "FIREBASE_SA_JSON", "value": SA, "type": "encrypted", "target": ["production", "preview"]})
    print(p, "ok" if "error" not in r else r["error"])
