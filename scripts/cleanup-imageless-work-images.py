#!/usr/bin/env python3
"""Clean up deck images for the 7 imageless work slugs.

- Remove tiny thumbnail images (< 25KB or width < 500px) from JSON arrays.
- Remove dubai-360 images that duplicate g-man images (indices 30-41 in dubai
  match indices 1-12 in g-man by filename).
- Update OG image to the verified preview if available.
"""

import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO_DIR = ROOT / "content" / "portfolio"
DECK_DIR = ROOT / "site" / "public" / "images" / "deck"

SLUGS = [
    "disenchantment",
    "cnn-road-to-270",
    "the-great-escape",
    "el-camino",
    "g-man-experiential-campaign",
    "dubai-360-spherical-projection-theatre",
    "projecting-change-racing-extinction",
]

DUBAI_DUPLICATE_FILENAMES = {
    "30-image264.png",
    "31-image262.png",
    "32-image271.png",
    "33-image263.jpg",
    "34-image265.jpg",
    "35-image267.jpg",
    "36-image266.jpg",
    "37-image269.jpg",
    "38-image282.jpg",
    "39-image283.jpg",
    "40-image273.jpg",
    "41-image278.jpg",
}


def is_tiny_image(url: str, slug: str) -> bool:
    if not url.startswith(f"/images/deck/{slug}/"):
        return False
    filename = url.split("/")[-1]
    file_path = DECK_DIR / slug / filename
    if not file_path.exists():
        return False
    size_kb = file_path.stat().st_size / 1024
    if size_kb < 25:
        return True
    try:
        with Image.open(file_path) as img:
            width, _ = img.size
            return width < 500
    except Exception:
        return False


def is_dubai_duplicate(url: str) -> bool:
    if not url.startswith("/images/deck/dubai-360-spherical-projection-theatre/"):
        return False
    filename = url.split("/")[-1]
    return filename in DUBAI_DUPLICATE_FILENAMES


def main():
    for slug in SLUGS:
        json_path = PORTFOLIO_DIR / f"{slug}.json"
        data = json.loads(json_path.read_text(encoding="utf-8"))
        images = data.get("images", [])
        original_count = len(images)

        cleaned = []
        seen_urls = set()
        for image in images:
            url = image.get("url", "")
            if not url or url in seen_urls:
                continue
            if is_tiny_image(url, slug):
                continue
            if is_dubai_duplicate(url):
                continue
            seen_urls.add(url)
            cleaned.append(image)

        if len(cleaned) != original_count:
            data["images"] = cleaned
            print(f"{slug}: {original_count} -> {len(cleaned)} images")

        # Update OG image to verified preview if available
        verified_urls = [img["url"] for img in cleaned if "verified" in img.get("url", "")]
        og = data.get("seo", {}).get("og", {})
        if verified_urls and og.get("image", "").startswith("/images/deck/"):
            og["image"] = verified_urls[0]
            print(f"{slug}: OG image -> {verified_urls[0]}")

        json_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
