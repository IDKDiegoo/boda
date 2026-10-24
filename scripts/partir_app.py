#!/usr/bin/env python3
"""Parte src/App.tsx en módulos SIN reescribir el código (24-oct-2026).
Cada pieza de nivel superior va al archivo de su rango; los imports se calculan por los nombres
que usa cada archivo (los de librerías salen de los import de App.tsx; los propios, del archivo
donde quedó cada nombre). Después: `npx tsc --noEmit` tiene que dar limpio."""
import re, os, sys
SRC = "src/App.tsx"
lines = open(SRC).read().split("\n")
# (línea donde EMPIEZA la primera declaración del archivo, archivo destino). En orden.
PLAN = [
  (8,    "src/base/firebase.ts"),
  (46,   "src/base/config.ts"),
  (54,   "src/base/hooks.ts"),
  (107,  "src/tipos.ts"),
  (121,  "src/ui/base.tsx"),
  (172,  "src/pantallas/Login.tsx"),
  (205,  "src/componentes/BannerNotificaciones.tsx"),
  (255,  "src/pantallas/Dashboard.tsx"),
  (328,  "src/pantallas/Proveedores.tsx"),
  (403,  "src/pantallas/Invitados.tsx"),
  (493,  "src/pantallas/Mesas.tsx"),
  (755,  "src/pantallas/Presupuesto.tsx"),
  (840,  "src/pantallas/Programa.tsx"),
  (947,  "src/pantallas/Regalos.tsx"),
  (1011, "src/pantallas/luna/datosViaje.ts"),
  (1151, "src/pantallas/luna/Paquetes.tsx"),
  (1517, "src/pantallas/Departamentos.tsx"),
  (1612, "src/pantallas/luna/LunaMiel.tsx"),
  (1961, "src/pantallas/Decoraciones.tsx"),
  (2242, "src/pantallas/Fotos.tsx"),
  (2381, "src/pantallas/QRInvitados.tsx"),
  (2403, "src/pantallas/CheckList.tsx"),
  (2571, "src/pantallas/civil/datosCivil.ts"),
  (2666, "src/pantallas/civil/BodaCivil.tsx"),
  (3212, "src/pantallas/civil/invitacion.ts"),
  (3248, "src/pantallas/civil/InvitacionCivil.tsx"),
  (3579, "src/pantallas/civil/RespuestasInv.tsx"),
  (3733, "src/pantallas/civil/LunaCivil.tsx"),
  (3902, "src/App.tsx"),
]
coment = lambda l: l.strip()=="" or l.strip().startswith(("//","/*","*","*/"))
# El comentario que precede a una pieza viaja con ella.
starts = []
for ln, f in PLAN:
    i = ln - 1
    while i > 0 and coment(lines[i-1]) and not lines[i-1].startswith("import"): i -= 1
    starts.append((i, f))
imports_txt = "\n".join(l for l in lines[:starts[0][0]] if l.startswith("import"))
lib = {}   # nombre local -> (modulo, texto del specifier, es_default)
for m in re.finditer(r'import\s+(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*"([^"]+)"', imports_txt):
    d, names, mod = m.group(1), m.group(2), m.group(3)
    if d: lib[d] = (mod, d, True)
    for p in (names or "").split(","):
        p = p.strip()
        if p: lib[p.split(" as ")[-1].strip()] = (mod, p, False)
piezas = {}
for k, (i, f) in enumerate(starts):
    fin = starts[k+1][0] if k+1 < len(starts) else len(lines)
    piezas.setdefault(f, []).extend(lines[i:fin])
DECL = re.compile(r"^(export\s+)?(default\s+)?(const|let|var|function|async function|class|type|interface)\s+([A-Za-z_$][\w$]*)")
defs = {}
for f, ls in piezas.items():
    for j, l in enumerate(ls):
        m = DECL.match(l)
        if m and not m.group(2):
            defs[m.group(4)] = f
            if not m.group(1): ls[j] = "export " + l
def sin_strings_ni_coment(t):
    t = re.sub(r"//[^\n]*", " ", t)
    return t
def ruta(desde, hacia):
    r = os.path.relpath(re.sub(r"\.(tsx|ts)$","",hacia), os.path.dirname(desde))
    return r if r.startswith(".") else "./" + r
for f, ls in piezas.items():
    cuerpo = "\n".join(ls)
    usados = set(re.findall(r"[A-Za-z_$][\w$]*", sin_strings_ni_coment(cuerpo)))
    propios = {n for n, ff in defs.items() if ff == f}
    out = []
    porlib = {}
    for n, (mod, spec, dflt) in lib.items():
        if n in usados and n not in propios: porlib.setdefault(mod, [None, []]); 
        if n in usados and n not in propios:
            if dflt: porlib[mod][0] = spec
            else: porlib[mod][1].append(spec)
    for mod, (d, ns) in porlib.items():
        partes = ([d] if d else []) + (["{ " + ", ".join(ns) + " }"] if ns else [])
        out.append(f'import {", ".join(partes)} from "{mod}";')
    porarch = {}
    for n in sorted(usados):
        ff = defs.get(n)
        if ff and ff != f: porarch.setdefault(ff, []).append(n)
    for ff, ns in sorted(porarch.items()):
        out.append(f'import {{ {", ".join(ns)} }} from "{ruta(f, ff)}";')
    os.makedirs(os.path.dirname(f), exist_ok=True)
    texto = "\n".join(out) + "\n\n" + cuerpo.strip("\n") + "\n"
    open(f, "w").write(texto)
    print(f"{f}: {len(texto.splitlines())} líneas")
