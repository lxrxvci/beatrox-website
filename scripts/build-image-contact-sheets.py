#!/usr/bin/env python3
"""Build labeled 3x3 contact sheets for every portfolio project's images.

Each cell is labeled with the CMS image index (images.N) and filename so the
vision pass can reference rows unambiguously. Also emits a manifest JSON
mapping slug -> [{index, url, file}] for downstream tooling.

Usage: .venv/bin/python scripts/build-image-contact-sheets.py
Outputs: reports/image-tags/sheets/<slug>-<n>.jpg, reports/image-tags/manifest.json
"""
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "site" / "content" / "portfolio"
PUBLIC = ROOT / "site" / "public"
OUT = ROOT / "reports" / "image-tags" / "sheets"
MANIFEST = ROOT / "reports" / "image-tags" / "manifest.json"

COLS, ROWS = 3, 3
CELL_W, CELL_H = 520, 330  # includes 30px label strip
SHEET_W, SHEET_H = COLS * CELL_W, ROWS * CELL_H

try:
    FONT = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 18)
except OSError:
    FONT = ImageFont.load_default()


def cell_for(img_path: Path, index: int, url: str) -> Image.Image:
    cell = Image.new("RGB", (CELL_W, CELL_H), (10, 10, 10))
    try:
        with Image.open(img_path) as im:
            im = im.convert("RGB")
            im.thumbnail((CELL_W, CELL_H - 30))
            x = (CELL_W - im.width) // 2
            y = (CELL_H - 30 - im.height) // 2
            cell.paste(im, (x, y))
    except Exception as exc:  # missing/unreadable file — render a placeholder
        d = ImageDraw.Draw(cell)
        d.text((10, 10), f"MISSING: {exc.__class__.__name__}", fill=(255, 80, 80), font=FONT)
    d = ImageDraw.Draw(cell)
    label = f"images.{index}  {Path(url).name}"
    d.rectangle([0, CELL_H - 30, CELL_W, CELL_H], fill=(0, 0, 0))
    d.text((8, CELL_H - 25), label, fill=(200, 255, 0), font=FONT)
    return cell


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, list[dict]] = {}
    for json_path in sorted(CONTENT.glob("*.json")):
        slug = json_path.stem
        data = json.loads(json_path.read_text())
        images = [img for img in data.get("images", []) if img.get("url", "").strip()]
        entries = []
        cells = []
        for i, img in enumerate(images):
            url = img["url"]
            file_path = PUBLIC / url.lstrip("/")
            entries.append({"index": i, "url": url, "file": str(file_path), "exists": file_path.exists()})
            cells.append(cell_for(file_path, i, url))
        manifest[slug] = entries
        n_sheets = max(1, math.ceil(len(cells) / (COLS * ROWS)))
        for s in range(n_sheets):
            sheet = Image.new("RGB", (SHEET_W, SHEET_H), (10, 10, 10))
            for j, cell in enumerate(cells[s * COLS * ROWS : (s + 1) * COLS * ROWS]):
                x = (j % COLS) * CELL_W
                y = (j // COLS) * CELL_H
                sheet.paste(cell, (x, y))
            out_path = OUT / f"{slug}-{s}.jpg"
            sheet.save(out_path, quality=88)
        print(f"{slug}: {len(images)} images, {n_sheets} sheet(s)")
    MANIFEST.write_text(json.dumps(manifest, indent=2))
    total = sum(len(v) for v in manifest.values())
    missing = sum(1 for v in manifest.values() for e in v if not e["exists"])
    print(f"\n{total} images across {len(manifest)} projects; {missing} missing files")
    print(f"manifest -> {MANIFEST}")


if __name__ == "__main__":
    main()
