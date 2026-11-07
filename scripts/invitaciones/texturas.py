# Texturas de las invitaciones sueltas (se generan una vez y quedan en public/inv/texturas/):
#  · tela.jpg  — satín blanco con pliegues largos y brillo (fondo de la página)
#  · papel.jpg — papel moteado tipo piedra/gamuza, repetible (tarjetas greige)
# python3 scripts/invitaciones/texturas.py
import numpy as np
from PIL import Image
rng = np.random.default_rng(7)
SAL = __import__("os").path.join(__import__("os").path.dirname(__file__), "../../public/inv/texturas")

def ruido(h, w, sigma, semilla):
    """Ruido suave y repetible (borde con borde) filtrando ruido blanco en frecuencia."""
    r = np.random.default_rng(semilla).standard_normal((h, w))
    fy = np.fft.fftfreq(h)[:, None]; fx = np.fft.fftfreq(w)[None, :]
    g = np.exp(-2 * (np.pi * sigma) ** 2 * (fx ** 2 + fy ** 2))
    n = np.real(np.fft.ifft2(np.fft.fft2(r) * g))
    return (n - n.mean()) / (n.std() + 1e-9)

def luz(alto, escala, color, difusa=.85, brillo=.0, exp=20, amb=.32):
    gy, gx = np.gradient(alto * escala)
    n = np.dstack([-gx, -gy, np.ones_like(alto)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    L = np.array([-.45, -.6, .66]); L /= np.linalg.norm(L)
    V = np.array([0, 0, 1.]); Hh = (L + V) / np.linalg.norm(L + V)
    d = np.clip((n * L).sum(2), 0, 1); s = np.clip((n * Hh).sum(2), 0, 1) ** exp
    c = np.array(color, float) / 255
    img = c * (amb + difusa * d)[..., None] + brillo * s[..., None]
    return img

# ── Tela de satín: pliegues diagonales que se doblan suave ──
H, W = 2000, 1200
y, x = np.mgrid[0:H, 0:W].astype(float)
ang = np.deg2rad(28)
torcer = ruido(H, W, 160, 3) * 120 + ruido(H, W, 60, 4) * 25
u = x * np.cos(ang) + y * np.sin(ang) + torcer
alto = (np.sin(u / 95) * 1.0 + np.sin(u / 47 + 1.3) * .35 + np.sin(u / 160 + .4) * .9) * (0.75 + .25 * ruido(H, W, 220, 5))
alto += ruido(H, W, 1.2, 9) * .0025                    # trama fina del tejido (apenas)
img = luz(alto, 9, (246, 244, 240), difusa=.5, brillo=.32, exp=12, amb=.6)
img = np.clip(img / np.percentile(img, 99.5) * .99, 0, 1)
Image.fromarray((img * 255).astype(np.uint8)).save(f"{SAL}/tela.jpg", quality=82, optimize=True, progressive=True)

# ── Papel moteado (repetible) ──
T = 512
m = ruido(T, T, 14, 21) * .55 + ruido(T, T, 5, 22) * .3 + ruido(T, T, 40, 23) * .5
grano = ruido(T, T, .8, 24)
base = np.array([217, 211, 196], float) / 255
tono = 1 + m * .035 + grano * .012
img = base * tono[..., None]
relieve = luz(m * .5 + grano * .06, 1.2, (255, 255, 255), difusa=.35, amb=.75)
img = np.clip(img * (relieve / relieve.mean()), 0, 1)
Image.fromarray((img * 255).astype(np.uint8)).save(f"{SAL}/papel.jpg", quality=86, optimize=True)
print("ok")

# ── Lino / cartulina con trama (gris medio, para mezclar con el color con «soft-light»): fibras finas
#    horizontales y verticales cruzadas, algo irregulares, como el sobre de la referencia ──
T = 768
def fibras(sx, sy, semilla):
    r = np.random.default_rng(semilla).standard_normal((T, T))
    fy = np.fft.fftfreq(T)[:, None]; fx = np.fft.fftfreq(T)[None, :]
    g = np.exp(-2 * np.pi ** 2 * ((fx * sx) ** 2 + (fy * sy) ** 2))
    n = np.real(np.fft.ifft2(np.fft.fft2(r) * g)); return (n - n.mean()) / n.std()
alto = fibras(6, .9, 31) * .6 + fibras(.9, 6, 32) * .6 + fibras(1.2, 1.2, 33) * .35 + ruido(T, T, 30, 34) * .25
relieve = luz(alto, 1.1, (255, 255, 255), difusa=.55, amb=.55)[..., 0]
g = (relieve - relieve.mean()) / relieve.std()
img = np.clip(.5 + g * .11, 0, 1)
Image.fromarray((img * 255).astype(np.uint8), "L").save(f"{SAL}/lino.jpg", quality=86, optimize=True)
print("lino ok")
