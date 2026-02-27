import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "site" / "reports"
DECK_CATALOG = REPORT_DIR / "deck-project-catalog.json"
VIDEO_CATALOG = REPORT_DIR / "video-link-catalog.json"
MERGE_MAP = REPORT_DIR / "project-merge-map.json"
ENRICH_REPORT = REPORT_DIR / "deck-video-enrichment-report.json"
NEW_PROJECTS_REPORT = REPORT_DIR / "deck-new-projects-report.json"
OUT_REPORT = REPORT_DIR / "deck-video-merge-audit.json"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def main():
    deck_catalog = read_json(DECK_CATALOG)
    video_catalog = read_json(VIDEO_CATALOG)
    merge_map = read_json(MERGE_MAP)
    enrich_report = read_json(ENRICH_REPORT)
    new_projects = read_json(NEW_PROJECTS_REPORT)

    unresolved_deck = merge_map.get("unresolved", {}).get("deck", [])
    unresolved_video = merge_map.get("unresolved", {}).get("video", [])
    created_rows = new_projects.get("created", [])
    zero_video_new = [row for row in created_rows if row.get("videos", 0) == 0]

    out = {
        "sources": {
            "deckCatalog": str(DECK_CATALOG.relative_to(ROOT)).replace("\\", "/"),
            "videoCatalog": str(VIDEO_CATALOG.relative_to(ROOT)).replace("\\", "/"),
            "mergeMap": str(MERGE_MAP.relative_to(ROOT)).replace("\\", "/"),
            "enrichmentReport": str(ENRICH_REPORT.relative_to(ROOT)).replace("\\", "/"),
            "newProjectsReport": str(NEW_PROJECTS_REPORT.relative_to(ROOT)).replace("\\", "/"),
        },
        "summary": {
            "deckProjectsExtracted": deck_catalog.get("projectCount", 0),
            "deckExternalLinksExtracted": deck_catalog.get("externalLinkCount", 0),
            "videoLinksExtracted": video_catalog.get("totalLinks", 0),
            "existingProjectsUpdated": enrich_report.get("updatedProjects", 0),
            "newProjectsCreated": len(created_rows),
            "manualReviewDeckMappings": len(unresolved_deck),
            "manualReviewVideoMappings": len(unresolved_video),
            "newProjectsWithoutVideos": len(zero_video_new),
        },
        "highlights": {
            "updatedProjectSlugs": [row.get("slug") for row in enrich_report.get("changes", [])],
            "createdProjectSlugs": [row.get("slug") for row in created_rows],
        },
        "unresolvedFollowUps": {
            "deckMappings": unresolved_deck,
            "videoMappings": unresolved_video,
            "newProjectsWithoutVideos": zero_video_new,
        },
    }

    OUT_REPORT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_REPORT.relative_to(ROOT).as_posix()}")
    print(f"Updated existing: {out['summary']['existingProjectsUpdated']}, new projects: {out['summary']['newProjectsCreated']}")
    print(f"Manual-review mappings: deck={out['summary']['manualReviewDeckMappings']}, video={out['summary']['manualReviewVideoMappings']}")


if __name__ == "__main__":
    main()
