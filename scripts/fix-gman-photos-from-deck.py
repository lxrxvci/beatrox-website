import json
import re
import zipfile
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
PPTX_PATH = ROOT / "assets" / "decks" / "_Beatrox _ Sizzle - Experience Design Build Case Studies -Master Deck.pptx"
PROJECT_PATH = ROOT / "content" / "portfolio" / "g-man-experiential-campaign.json"
OUT_DIR = ROOT / "site" / "public" / "images" / "deck" / "g-man-experiential-campaign"
REPORT_PATH = ROOT / "site" / "reports" / "gman-photo-fix-report.json"

# Toyota C-HR / G-MAN content appears on this deck section.
TARGET_SLIDES = [239, 240, 241, 242]


def resolve_rel_target(base_dir: str, target: str) -> str:
    base = PurePosixPath(base_dir)
    resolved = base.joinpath(target).as_posix()
    out = []
    for part in resolved.split("/"):
        if part == "..":
            if out:
                out.pop()
        elif part and part != ".":
            out.append(part)
    return "/".join(out)


def slide_media_refs(zf: zipfile.ZipFile, slide_number: int):
    slide_xml_path = f"ppt/slides/slide{slide_number}.xml"
    rel_xml_path = f"ppt/slides/_rels/slide{slide_number}.xml.rels"
    if slide_xml_path not in zf.namelist() or rel_xml_path not in zf.namelist():
        return []

    slide_text = zf.read(slide_xml_path).decode("utf-8", errors="ignore")
    rel_ids = []
    for rid in re.findall(r'r:embed="(rId\d+)"', slide_text):
        if rid not in rel_ids:
            rel_ids.append(rid)

    rel_root = ET.fromstring(zf.read(rel_xml_path))
    rel_map = {}
    for rel in rel_root:
        rel_id = rel.attrib.get("Id")
        target = rel.attrib.get("Target", "")
        if rel_id and target:
            rel_map[rel_id] = resolve_rel_target("ppt/slides", target)

    refs = []
    for rid in rel_ids:
        target = rel_map.get(rid)
        if target and target.startswith("ppt/media/") and target in zf.namelist():
            refs.append(target)
    return refs


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(PPTX_PATH) as zf:
        refs = []
        for slide in TARGET_SLIDES:
            refs.extend(slide_media_refs(zf, slide))

        # Unique while preserving order.
        unique_refs = []
        seen = set()
        for ref in refs:
            if ref not in seen:
                seen.add(ref)
                unique_refs.append(ref)

        if not unique_refs:
            raise RuntimeError("No media found for target G-MAN/Toyota slides.")

        # Clear existing generated images for this project to avoid stale/incorrect media.
        for old in OUT_DIR.glob("*"):
            if old.is_file():
                old.unlink()

        imported_urls = []
        for idx, ref in enumerate(unique_refs, start=1):
            src_name = Path(ref).name
            out_name = f"{idx:02d}-{src_name}"
            out_path = OUT_DIR / out_name
            out_path.write_bytes(zf.read(ref))
            imported_urls.append(f"/images/deck/g-man-experiential-campaign/{out_name}")

    data = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
    title = data.get("title", "G-MAN Experiential Campaign")
    images = [{"url": url, "alt": f"{title} deck image {i+1}"} for i, url in enumerate(imported_urls)]
    data["images"] = images
    if data.get("seo", {}).get("og") and images:
        data["seo"]["og"]["image"] = images[0]["url"]
    PROJECT_PATH.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    report = {
        "project": "g-man-experiential-campaign",
        "slidesUsed": TARGET_SLIDES,
        "imagesImported": len(images),
        "heroImage": images[0]["url"] if images else None,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {REPORT_PATH.relative_to(ROOT).as_posix()}")
    print(f"Imported {len(images)} images for G-MAN")


if __name__ == "__main__":
    main()
