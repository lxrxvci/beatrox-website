import json
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO_DIR = ROOT / "content" / "portfolio"
DECK_CATALOG_PATH = ROOT / "site" / "reports" / "deck-project-catalog.json"
OUT_REPORT = ROOT / "site" / "reports" / "deck-new-projects-report.json"

SELECTED_NEW_PROJECTS = [
    "disenchantment",
    "the-great-escape",
    "el-camino",
    "g-man-experiential-campaign",
    "cnn-road-to-270",
    "projecting-change-racing-extinction",
    "dubai-360-spherical-projection-theatre",
]


def clean_title(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    if value.isupper():
        return value.title()
    return value


def provider_for_url(url: str) -> str:
    if "youtube.com" in url or "youtu.be" in url:
        return "youtube"
    if "vimeo.com" in url:
        return "vimeo"
    if "instagram.com" in url:
        return "instagram"
    return "external"


def to_embed(url: str):
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if "youtu.be" in host:
        video_id = parsed.path.strip("/")
        return f"https://www.youtube.com/embed/{video_id}" if video_id else None
    if "youtube.com" in host:
        video_id = parse_qs(parsed.query).get("v", [None])[0]
        return f"https://www.youtube.com/embed/{video_id}" if video_id else None
    if "vimeo.com" in host:
        match = re.search(r"/(\d+)$", parsed.path)
        if match:
            return f"https://player.vimeo.com/video/{match.group(1)}"
    return None


def make_tags(type_value: str):
    raw = [x.strip() for x in re.split(r"[,/]", type_value or "") if x.strip()]
    tags = []
    for item in raw:
        if item not in tags:
            tags.append(item)
    if "Case Study" not in tags:
        tags.append("Case Study")
    return tags[:4]


def main():
    deck_catalog = json.loads(DECK_CATALOG_PATH.read_text(encoding="utf-8"))
    by_slug = {p.get("slugCandidate"): p for p in deck_catalog.get("projects", [])}
    created = []
    skipped = []

    for slug in SELECTED_NEW_PROJECTS:
        target_path = PORTFOLIO_DIR / f"{slug}.json"
        if target_path.exists():
            skipped.append({"slug": slug, "reason": "already_exists"})
            continue

        source = by_slug.get(slug)
        if not source:
            skipped.append({"slug": slug, "reason": "missing_in_deck_catalog"})
            continue

        title = clean_title(source.get("projectName", slug.replace("-", " ")))
        type_value = source.get("type", "Experiential Project")
        description = f"{title} by Beatrox for {source.get('client', 'a featured client')} in {source.get('location', 'a live environment')}."
        objective = source.get("designObjectives", [])
        objective_text = objective[0] if objective else (
            f"This project delivers {type_value.lower()} outcomes through integrated creative technology and production workflows."
        )

        videos = []
        for link in sorted(set(source.get("links", []))):
            url = link.replace("http://", "https://")
            provider = provider_for_url(url)
            videos.append(
                {
                    "title": f"{title} Video",
                    "provider": provider,
                    "url": url,
                    **({"embedUrl": to_embed(url)} if to_embed(url) else {}),
                }
            )

        out = {
            "title": title,
            "slug": f"/work/{slug}",
            "seo": {
                "title": f"{title} — BEATROX Case Study",
                "description": description,
                "og": {
                    "title": f"{title} — BEATROX",
                    "description": description,
                    "image": "/og-default.jpg",
                },
            },
            "hero": {
                "headline": title,
                "subheadline": description,
                "tags": make_tags(type_value),
            },
            "metadata": {
                "client": source.get("client", "Confidential"),
                "location": source.get("location", "Various"),
                "type": type_value,
                "tech": [],
                "partners": [],
            },
            "body": [
                {
                    "type": "objective",
                    "heading": "Design Objective",
                    "content": objective_text,
                }
            ],
            "images": [
                {
                    "url": "/og-default.jpg",
                    "alt": f"{title} key visual placeholder",
                    "note": "Deck-derived project pending localized image assets.",
                }
            ],
            "videos": videos,
        }

        target_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
        created.append({"slug": slug, "title": title, "videos": len(videos)})

    report = {"created": created, "skipped": skipped}
    OUT_REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Created: {len(created)}, skipped: {len(skipped)}")
    print(f"Report: {OUT_REPORT.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main()
