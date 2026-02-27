import json
import re
import zipfile
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
PPTX_PATH = ROOT / "assets" / "decks" / "_Beatrox _ Sizzle - Experience Design Build Case Studies -Master Deck.pptx"
DECK_CATALOG_PATH = ROOT / "site" / "reports" / "deck-project-catalog.json"
MERGE_MAP_PATH = ROOT / "site" / "reports" / "project-merge-map.json"
PORTFOLIO_DIR = ROOT / "content" / "portfolio"
OUT_IMAGES_ROOT = ROOT / "site" / "public" / "images" / "deck"
REPORT_PATH = ROOT / "site" / "reports" / "deck-image-import-report.json"


def resolve_rel_target(base_dir: str, target: str) -> str:
    base = PurePosixPath(base_dir)
    resolved = base.joinpath(target).as_posix()
    parts = []
    for part in resolved.split("/"):
        if part == "..":
            if parts:
                parts.pop()
        elif part and part != ".":
            parts.append(part)
    return "/".join(parts)


def slide_image_targets(zf: zipfile.ZipFile, slide_number: int):
    slide_xml_path = f"ppt/slides/slide{slide_number}.xml"
    rel_xml_path = f"ppt/slides/_rels/slide{slide_number}.xml.rels"
    if slide_xml_path not in zf.namelist() or rel_xml_path not in zf.namelist():
        return []

    slide_text = zf.read(slide_xml_path).decode("utf-8", errors="ignore")
    rel_ids = re.findall(r'r:embed="(rId\d+)"', slide_text)
    ordered_rel_ids = []
    seen_ids = set()
    for rid in rel_ids:
        if rid not in seen_ids:
            seen_ids.add(rid)
            ordered_rel_ids.append(rid)

    rel_root = ET.fromstring(zf.read(rel_xml_path))
    rel_map = {}
    for rel in rel_root:
        rid = rel.attrib.get("Id")
        target = rel.attrib.get("Target", "")
        if rid and target:
            rel_map[rid] = resolve_rel_target("ppt/slides", target)

    out = []
    for rid in ordered_rel_ids:
        target = rel_map.get(rid)
        if target and target.startswith("ppt/media/") and target in zf.namelist():
            out.append(target)
    return out


def load_project_groupings(deck_catalog: dict, merge_map: dict):
    deck_by_name = {p.get("projectName"): p for p in deck_catalog.get("projects", [])}
    grouped = {}
    for row in merge_map.get("deckMappings", []):
        if row.get("confidence") == "manual_review":
            continue
        slug = row.get("matchedSlug")
        label = row.get("label")
        if not slug or label not in deck_by_name:
            continue
        grouped.setdefault(slug, []).append(deck_by_name[label])
    return grouped


def main():
    deck_catalog = json.loads(DECK_CATALOG_PATH.read_text(encoding="utf-8"))
    merge_map = json.loads(MERGE_MAP_PATH.read_text(encoding="utf-8"))
    grouped = load_project_groupings(deck_catalog, merge_map)
    OUT_IMAGES_ROOT.mkdir(parents=True, exist_ok=True)

    report_rows = []
    with zipfile.ZipFile(PPTX_PATH) as zf:
        for slug, deck_projects in sorted(grouped.items()):
            project_file = PORTFOLIO_DIR / f"{slug}.json"
            if not project_file.exists():
                continue

            all_slides = sorted(
                set(
                    slide
                    for proj in deck_projects
                    for slide in proj.get("slideNumbers", [])
                    if isinstance(slide, int)
                )
            )
            if not all_slides:
                continue

            title_slide = all_slides[0]
            refs_after_title = []
            refs_all = []
            for slide in all_slides:
                refs = slide_image_targets(zf, slide)
                refs_all.extend(refs)
                if slide > title_slide:
                    refs_after_title.extend(refs)

            # Unique while preserving order
            unique_refs = []
            seen = set()
            for ref in refs_all:
                if ref not in seen:
                    seen.add(ref)
                    unique_refs.append(ref)

            if not unique_refs:
                continue

            hero_ref = refs_after_title[0] if refs_after_title else unique_refs[0]
            slug_dir = OUT_IMAGES_ROOT / slug
            slug_dir.mkdir(parents=True, exist_ok=True)

            ref_to_url = {}
            for idx, ref in enumerate(unique_refs, start=1):
                src_name = Path(ref).name
                out_name = f"{idx:02d}-{src_name}"
                out_path = slug_dir / out_name
                out_path.write_bytes(zf.read(ref))
                ref_to_url[ref] = f"/images/deck/{slug}/{out_name}"

            hero_url = ref_to_url.get(hero_ref, next(iter(ref_to_url.values())))
            deck_image_entries = [
                {"url": ref_to_url[ref], "alt": f"{slug.replace('-', ' ').title()} deck image {i+1}"}
                for i, ref in enumerate(unique_refs)
            ]

            # Put selected hero first, then all other deck images, then prior non-deck images.
            hero_entry = next((img for img in deck_image_entries if img["url"] == hero_url), deck_image_entries[0])
            other_deck = [img for img in deck_image_entries if img["url"] != hero_entry["url"]]

            data = json.loads(project_file.read_text(encoding="utf-8"))
            existing_images = data.get("images", [])
            non_deck_existing = [img for img in existing_images if not str(img.get("url", "")).startswith(f"/images/deck/{slug}/")]

            data["images"] = [hero_entry] + other_deck + non_deck_existing
            if data.get("seo", {}).get("og"):
                data["seo"]["og"]["image"] = hero_entry["url"]

            project_file.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            report_rows.append(
                {
                    "slug": slug,
                    "slidesUsed": all_slides,
                    "titleSlide": title_slide,
                    "heroImage": hero_entry["url"],
                    "deckImagesImported": len(deck_image_entries),
                }
            )

    report = {
        "projectsUpdated": len(report_rows),
        "changes": report_rows,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {REPORT_PATH.relative_to(ROOT).as_posix()}")
    print(f"Projects updated: {len(report_rows)}")


if __name__ == "__main__":
    main()
