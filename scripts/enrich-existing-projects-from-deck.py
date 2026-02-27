import json
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO_DIR = ROOT / "content" / "portfolio"
DECK_CATALOG_PATH = ROOT / "site" / "reports" / "deck-project-catalog.json"
VIDEO_CATALOG_PATH = ROOT / "site" / "reports" / "video-link-catalog.json"
MERGE_MAP_PATH = ROOT / "site" / "reports" / "project-merge-map.json"
REPORT_PATH = ROOT / "site" / "reports" / "deck-video-enrichment-report.json"


def provider_for_url(url: str) -> str:
    value = url.lower()
    if "youtube.com" in value or "youtu.be" in value:
        return "youtube"
    if "vimeo.com" in value:
        return "vimeo"
    if "instagram.com" in value:
        return "instagram"
    return "external"


def youtube_embed(url: str):
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if "youtu.be" in host:
        video_id = parsed.path.strip("/")
        return f"https://www.youtube.com/embed/{video_id}" if video_id else None
    if "youtube.com" in host:
        qs = parse_qs(parsed.query)
        video_id = qs.get("v", [None])[0]
        if video_id:
            return f"https://www.youtube.com/embed/{video_id}"
    return None


def vimeo_embed(url: str):
    parsed = urlparse(url)
    match = re.search(r"/(\d+)$", parsed.path)
    if not match:
        return None
    return f"https://player.vimeo.com/video/{match.group(1)}"


def embed_url(url: str):
    provider = provider_for_url(url)
    if provider == "youtube":
        return youtube_embed(url)
    if provider == "vimeo":
        return vimeo_embed(url)
    return None


def normalize_text(value: str) -> str:
    return " ".join((value or "").split()).strip()


def main():
    deck_catalog = json.loads(DECK_CATALOG_PATH.read_text(encoding="utf-8"))
    video_catalog = json.loads(VIDEO_CATALOG_PATH.read_text(encoding="utf-8"))
    merge_map = json.loads(MERGE_MAP_PATH.read_text(encoding="utf-8"))

    deck_projects = {p["projectName"]: p for p in deck_catalog.get("projects", [])}
    deck_by_slug = {}
    for row in merge_map.get("deckMappings", []):
        if row.get("confidence") == "manual_review":
            continue
        slug = row.get("matchedSlug")
        label = row.get("label")
        if not slug or label not in deck_projects:
            continue
        deck_by_slug.setdefault(slug, []).append(deck_projects[label])

    videos_by_slug = {}
    for row in merge_map.get("videoMappings", []):
        if row.get("confidence") == "manual_review":
            continue
        slug = row.get("matchedSlug")
        if not slug:
            continue
        videos_by_slug.setdefault(slug, []).append(
            {
                "label": row.get("label", "Video"),
                "url": row.get("url", ""),
            }
        )

    updated = []
    for file_path in sorted(PORTFOLIO_DIR.glob("*.json")):
        slug = file_path.stem
        data = json.loads(file_path.read_text(encoding="utf-8"))
        changed = {
            "slug": slug,
            "videosAdded": 0,
            "metadataUpdated": [],
            "objectiveAdded": False,
        }

        # Merge videos from both sources
        links = []
        for deck_item in deck_by_slug.get(slug, []):
            for url in deck_item.get("links", []):
                if url:
                    links.append({"label": f"{data.get('title', slug)} Deck Link", "url": url})
        links.extend(videos_by_slug.get(slug, []))

        existing_videos = data.get("videos", [])
        existing_urls = {v.get("url", "") for v in existing_videos if v.get("url")}
        for link in links:
            url = link["url"].replace("http://", "https://")
            if not url or url in existing_urls:
                continue
            provider = provider_for_url(url)
            existing_videos.append(
                {
                    "title": normalize_text(link["label"])[:120] or f"{data.get('title', slug)} Video",
                    "provider": provider,
                    "url": url,
                    **({"embedUrl": embed_url(url)} if embed_url(url) else {}),
                }
            )
            existing_urls.add(url)
            changed["videosAdded"] += 1
        if existing_videos:
            data["videos"] = existing_videos

        # Metadata backfill from first mapped deck entry
        deck_entries = deck_by_slug.get(slug, [])
        if deck_entries:
            source = deck_entries[0]
            metadata = data.setdefault("metadata", {})
            if not metadata.get("client") and source.get("client"):
                metadata["client"] = source["client"]
                changed["metadataUpdated"].append("client")
            if not metadata.get("location") and source.get("location"):
                metadata["location"] = source["location"]
                changed["metadataUpdated"].append("location")
            if not metadata.get("type") and source.get("type"):
                metadata["type"] = source["type"]
                changed["metadataUpdated"].append("type")

            objectives = [normalize_text(x) for x in source.get("designObjectives", []) if normalize_text(x)]
            if objectives:
                body = data.setdefault("body", [])
                has_objective = any(
                    "objective" in normalize_text(block.get("heading", "") + " " + block.get("type", "")).lower()
                    for block in body
                )
                if not has_objective:
                    body.insert(
                        0,
                        {
                            "type": "objective",
                            "heading": "Design Objective",
                            "content": objectives[0],
                        },
                    )
                    changed["objectiveAdded"] = True

        if changed["videosAdded"] or changed["metadataUpdated"] or changed["objectiveAdded"]:
            file_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            updated.append(changed)

    report = {
        "updatedProjects": len(updated),
        "changes": updated,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Updated projects: {len(updated)}")
    print(f"Report: {REPORT_PATH.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main()
