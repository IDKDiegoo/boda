# Sello de lacre dorado con relieve real (21-nov-2026, invitación Geraldine & Camilo).
# Se arma un MAPA DE ALTURAS (borde de cera abultado e irregular, escalón, anillo fino, disco interior
# hundido con las iniciales en relieve y textura de cera) y se ilumina como metal satinado desde
# arriba a la izquierda, como el sello de la referencia que mandaron.
#   python3 sello_lacre.py GreatVibes.ttf "G" "C" salida.png
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

fuente, L1, L2, salida = sys.argv[1:5]
N = 1100; c = N / 2
y, x = np.mgrid[0:N, 0:N].astype(np.float32)
dx, dy = x - c, y - c; r = np.hypot(dx, dy); th = np.arctan2(dy, dx)
rng = np.random.default_rng(13)

from scipy.ndimage import gaussian_filter
def suave(arr, s):
    return gaussian_filter(arr.astype(np.float32), s)

# borde exterior irregular (cera derramada)
R0 = N * .455
borde = R0 * (1 + .018 * np.sin(3 * th + .4) + .014 * np.sin(5 * th + 1.7) + .009 * np.sin(8 * th + 2.9) + .006 * np.sin(13 * th + .2))
d_borde = borde - r                                   # >0 adentro
afuera = d_borde < 0
# perfil: sube rápido en el borde (cera abultada), cae suave hacia el escalón
rs = N * .345                                         # radio del disco estampado
h = np.zeros((N, N), np.float32)
rim = np.clip(d_borde / 70, 0, 1); rim = np.sin(rim * np.pi / 2) ** .8
caida = np.clip((r - rs) / (borde - rs + 1e-3), 0, 1)
h = rim * (.55 + .45 * np.clip(np.sin(caida * np.pi), 0, 1) ** .6)
# irregularidad de la cera en el borde
h += suave(rng.normal(0, 1, (N, N)), 22) * 1.6 * rim * (r > rs)
# disco estampado (hundido) con escalón y anillo fino
dentro = r < rs
h = np.where(dentro, .18, h)
anillo = np.exp(-((r - N * .325) / 5.0) ** 2) * .15 + np.exp(-((r - N * .30) / 3.2) ** 2) * .08
h += anillo * dentro
# iniciales en relieve
img = Image.new("L", (N, N), 0); dib = ImageDraw.Draw(img)
f1 = ImageFont.truetype(fuente, int(N * .25)); f2 = ImageFont.truetype(fuente, int(N * .11))
def centro_txt(t, f):
    b = dib.textbbox((0, 0), t, font=f); return b[2] - b[0], b[3] - b[1], b
w1, h1, b1 = centro_txt(L1, f1); w2, h2, b2 = centro_txt(L2, f1); wa, ha, ba = centro_txt("&", f2)
dib.text((c - w1 - wa * .55 - b1[0], c - h1 / 2 - b1[1] - N * .015), L1, font=f1, fill=255)
dib.text((c - wa / 2 - ba[0], c - ha / 2 - ba[1] + N * .03), "&", font=f2, fill=255)
dib.text((c + wa * .55 - b2[0], c - h2 / 2 - b2[1] + N * .015), L2, font=f1, fill=255)
from scipy.ndimage import grey_dilation
letra = suave(grey_dilation(np.asarray(img, np.float32) / 255, size=(5, 5)), 2.6)
h += letra * .14 * dentro
# textura fina de cera y metal
h += suave(rng.normal(0, 1, (N, N)), 2.5) * .006 + suave(rng.normal(0, 1, (N, N)), 8) * .012
h = suave(h, 1.2)

# normales e iluminación
esc_z = 140.0
gy, gx = np.gradient(h * esc_z)
n = np.dstack([-gx, -gy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
luz = np.array([-.55, -.62, .56]); luz /= np.linalg.norm(luz)
vista = np.array([0, 0, 1.0]); med = luz + vista; med /= np.linalg.norm(med)
dif = np.clip((n * luz).sum(2), 0, 1)
esp = np.clip((n * med).sum(2), 0, 1)
base = np.array([168, 138, 86], np.float32) / 255     # dorado medio medido en la foto
sombra = np.array([96, 68, 32], np.float32) / 255
claro = np.array([250, 234, 200], np.float32) / 255
t = np.clip(.25 + .85 * dif, 0, 1)[..., None]
vet = suave(rng.normal(0, 1, (N, N)), 30) * 9 + suave(rng.normal(0, 1, (N, N)), 6) * 2
col = (sombra * (1 - t) + base * t) * (1 + .06 * vet)[..., None]
col += claro * (esp ** 30 * .65 + esp ** 6 * .18)[..., None]
col = np.clip(col, 0, 1)
# alfa con borde suave
alfa = np.clip(d_borde / 2.0 + .5, 0, 1)
out = np.dstack([col * 255, alfa * 255]).astype(np.uint8)
im = Image.fromarray(out, "RGBA").resize((560, 560), Image.LANCZOS)
im.save(salida, optimize=True); print(salida, im.size)
