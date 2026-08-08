#!/usr/bin/env python3
"""Brand mark asset prep for the swarm truss logo.

- Full mark (black-on-white, repo root) -> site/public/brand/beatrox-mark-full-white.png
  Converted to white-on-transparent: RGB=white, A = (1-luminance) * source_alpha.
  (The source has dark-RGB junk in its transparent zones, so a plain 1-lum
  inversion would ghost-fill them; multiplying by the source alpha kills it.)
- Horizontal lockup (Artboard 1.png, already white-on-transparent) -> copied
  to site/public/brand/beatrox-mark-horizontal.png.

Both outputs are trimmed to their content bbox (+8px padding) and verified:
NO lit pixel may touch any output edge (the completeness test that would
have caught the cropped beatrox-symbol.png).
"""
from PIL import Image
import numpy as np
import sys

ROOT = "/Users/lxrxcvi/Library/Mobile Documents/com~apple~CloudDocs/beatrox-website"
FULL_SRC = f"{ROOT}/Beatrox LOGO New text - Outlines-Artboard 1 - Black on White-Laser@4x.png"
HORIZ_SRC = f"{ROOT}/Artboard 1.png"
OUT_DIR = f"{ROOT}/site/public/brand"
PAD = 8
LIT = 0.08  # alpha threshold for "lit" pixel checks


def lum_of(a):
    return (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]) / 255.0


def trim_to_content(alpha, pad=PAD):
    ys, xs = np.where(alpha > LIT)
    if len(xs) == 0:
        raise SystemExit("no lit pixels found")
    y0, y1 = max(0, ys.min() - pad), min(alpha.shape[0], ys.max() + pad + 1)
    x0, x1 = max(0, xs.min() - pad), min(alpha.shape[1], xs.max() + pad + 1)
    return y0, y1, x0, x1


def edge_check(alpha, name):
    for label, band in (
        ("top", alpha[0]), ("bottom", alpha[-1]),
        ("left", alpha[:, 0]), ("right", alpha[:, -1]),
    ):
        lit = int((band > LIT).sum())
        if lit:
            raise SystemExit(f"FAIL {name}: {lit} lit pixels touch the {label} edge")
    print(f"  {name}: edges clean (no lit pixels touch any border)")


def process_full():
    img = Image.open(FULL_SRC).convert("RGBA")
    a = np.array(img, dtype=np.float32)
    lum = lum_of(a)
    src_alpha = a[..., 3] / 255.0
    out_alpha = np.clip((1.0 - lum) * src_alpha, 0, 1)
    y0, y1, x0, x1 = trim_to_content(out_alpha)
    h, w = y1 - y0, x1 - x0
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[..., 0] = out[..., 1] = out[..., 2] = 255
    out[..., 3] = (out_alpha[y0:y1, x0:x1] * 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(f"{OUT_DIR}/beatrox-mark-full-white.png")
    print(f"full: {w}x{h} (aspect {w / h:.4f})")
    edge_check(out[..., 3] / 255.0, "beatrox-mark-full-white.png")


def process_horizontal():
    img = Image.open(HORIZ_SRC).convert("RGBA")
    a = np.array(img, dtype=np.float32)
    alpha = a[..., 3] / 255.0
    lum = lum_of(a)
    # Verify it's truly white-on-transparent (white RGB where lit).
    lit = alpha > LIT
    if lum[lit].mean() < 0.9:
        # Not white-on-transparent: process like the full mark.
        print("  horizontal: not white-on-transparent, converting")
        alpha = np.clip((1.0 - lum) * alpha, 0, 1)
    y0, y1, x0, x1 = trim_to_content(alpha)
    h, w = y1 - y0, x1 - x0
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[..., 0] = out[..., 1] = out[..., 2] = 255
    out[..., 3] = (alpha[y0:y1, x0:x1] * 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(f"{OUT_DIR}/beatrox-mark-horizontal.png")
    print(f"horizontal: {w}x{h} (aspect {w / h:.4f})")
    edge_check(out[..., 3] / 255.0, "beatrox-mark-horizontal.png")


if __name__ == "__main__":
    process_full()
    process_horizontal()
    print("OK")
