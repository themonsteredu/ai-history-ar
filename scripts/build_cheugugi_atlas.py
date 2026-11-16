"""Cut the 측우기 card photo into the flat pieces the 3D model is painted with.

The card photo (public/images/heritage/joseon-science/cheugugi.jpg) shows only the front. This writes
cheugugi-atlas.jpg next to it:
- front: the stone's front face, straightened, with its carved letters;
- plain: the same face with the letters filled in by the surrounding stone, for the sides, back and top;
- gauge: the front quarter of the bronze cylinder, with the downward curve of its bands straightened,
  made left-right symmetric so four quarters join without a seam;
- small swatches of the rim and of the dark inside.
Positions are in src/lib/ar/joseon/cheugugi.ts (ATLAS).
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / 'public/images/heritage/joseon-science'
photo = np.asarray(Image.open(DIR / 'cheugugi.jpg').convert('RGB')).astype(np.float32)
H, W, _ = photo.shape


def sample(xs, ys):
    """Bilinear samples of the photo at float pixel positions."""
    out = np.stack([nd.map_coordinates(photo[..., c], [ys, xs], order=1, mode='nearest') for c in range(3)], -1)
    return out


# ---- stone front face: corners in the photo (top-left, top-right, bottom-right, bottom-left), a little inside the edge
QUAD = np.array([[48, 592], [686, 628], [685, 1416], [60, 1346]], np.float32)
FW, FH = 592, 736  # 37 : 46, the block's width : height


def homography(dst, src):
    rows = []
    for (x, y), (u, v) in zip(dst, src):
        rows.append([x, y, 1, 0, 0, 0, -u * x, -u * y, -u]); rows.append([0, 0, 0, x, y, 1, -v * x, -v * y, -v])
    return np.linalg.svd(np.array(rows, np.float64))[2][-1].reshape(3, 3)


Hm = homography([[0, 0], [FW, 0], [FW, FH], [0, FH]], QUAD)
gx, gy = np.meshgrid(np.arange(FW) + .5, np.arange(FH) + .5)
den = Hm[2, 0] * gx + Hm[2, 1] * gy + Hm[2, 2]
front = sample((Hm[0, 0] * gx + Hm[0, 1] * gy + Hm[0, 2]) / den, (Hm[1, 0] * gx + Hm[1, 1] * gy + Hm[1, 2]) / den)

# ---- the same face without letters
lum = front.mean(-1)
smooth = nd.median_filter(lum, size=61)
letters = nd.binary_opening(lum < smooth * .62, iterations=1)
# keep only real strokes (large dark shapes), then cover their shaded edges
labels, count = nd.label(letters)
sizes = nd.sum(letters, labels, range(1, count + 1))
letters = np.isin(labels, 1 + np.flatnonzero(sizes > 60))
mask = nd.binary_dilation(letters, iterations=11)
keep = (~mask).astype(np.float32)
blur = lambda a, s: nd.gaussian_filter(a, s)
weight = np.maximum(blur(keep, 22), 1e-4)
low = np.stack([blur(front[..., c] * keep, 22) / weight for c in range(3)], -1)
grain = front - np.stack([blur(front[..., c], 6) for c in range(3)], -1)
mid = np.stack([blur(front[..., c], 6) for c in range(3)], -1) - np.stack([blur(front[..., c], 22) for c in range(3)], -1)
texture = grain + mid
filled, todo = texture.copy(), mask.copy()
for dx, dy in [(150, 0), (-150, 0), (0, 170), (0, -170), (95, 120), (-95, -120), (-95, 120), (95, -120), (230, 40), (-230, -40), (40, 260), (-40, -260)]:
    ys, xs = np.nonzero(todo)
    sy, sx = ys + dy, xs + dx
    ok = (sy >= 0) & (sy < FH) & (sx >= 0) & (sx < FW)
    ok[ok] &= ~mask[sy[ok], sx[ok]]
    filled[ys[ok], xs[ok]] = texture[sy[ok], sx[ok]]
    todo[ys[ok], xs[ok]] = False
filled[todo] = 0
soft = blur(mask.astype(np.float32), 3)[..., None]
plain = front * (1 - soft) + (low + filled) * soft

# ---- bronze cylinder: front quarter (±45°), bands straightened
CX, PX = 436.5, 134.5 / 7.38      # axis x in the photo, pixels per cm across the gauge
RB, RW = 7.65, 7.38               # band and wall radius (cm), as in the model
# height above the gauge's foot (cm) -> photo y at the front centre, and how far the bands rise toward the sides
MARKS = [(4.3, 548), (10.5, 432), (21, 248), (29.95, 63), (31.32, 50)]
GW, GH = 256, 640
u = (np.arange(GW) + .5) / GW * 2 - 1
x_cm = u * RB * np.sin(np.pi / 4)
hs = 31.32 - (np.arange(GH) + .5) / GH * (31.32 - 4.3)
yc = np.interp(hs, [m[0] for m in MARKS], [m[1] for m in MARKS])
rise = 18 + (yc - 56) * (12 / 490)
cos = np.sqrt(1 - np.clip(x_cm / RW, -1, 1) ** 2)
gauge = sample(np.broadcast_to(CX + x_cm * PX, (GH, GW)), yc[:, None] - rise[:, None] * (1 - cos[None, :]))
# Left-right symmetric: fade each side into the mirrored other side at the edges only, so the quarters meet evenly.
edge = np.clip((np.abs(u) - .7) / .3, 0, 1)[None, :, None] * .5
gauge = gauge * (1 - edge) + gauge[:, ::-1] * edge

rim = sample(*np.meshgrid(np.linspace(318, 378, 96), np.linspace(40, 47, 32)))
inside = sample(*np.meshgrid(np.linspace(380, 500, 96), np.linspace(22, 30, 32)))

PAD = 8
atlas = np.full((FH + GH + PAD * 3, FW * 2 + PAD * 3, 3), 120, np.float32)
def put(img, x, y):
    h, w, _ = img.shape
    # repeat the piece's edge pixels into the gap so smaller copies of the picture do not pick up grey
    atlas[y - PAD // 2:y + h + PAD // 2, x - PAD // 2:x + w + PAD // 2] = np.pad(img, ((PAD // 2,) * 2, (PAD // 2,) * 2, (0, 0)), mode='edge')
    return [x, y, x + w, y + h]
boxes = {
    'front': put(front, PAD, PAD), 'plain': put(plain, FW + PAD * 2, PAD),
    'gauge': put(gauge, PAD, FH + PAD * 2), 'rim': put(rim, GW + PAD * 2, FH + PAD * 2), 'inside': put(inside, GW + PAD * 2, FH + PAD * 3 + 32),
}
Image.fromarray(np.clip(atlas, 0, 255).astype(np.uint8)).save(DIR / 'cheugugi-atlas.jpg', quality=88, optimize=True)
print('atlas', atlas.shape[1], 'x', atlas.shape[0], boxes)
