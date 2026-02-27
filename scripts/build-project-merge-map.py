import json
import re
from difflib import SequenceMatcher
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO_DIR = ROOT / "content" / "portfolio"
DECK_CATALOG_PATH = ROOT / "site" / "reports" / "deck-project-catalog.json"
VIDEO_CATALOG_PATH = ROOT / "site" / "reports" / "video-link-catalog.json"
OUT_PATH = ROOT / "site" / "reports" / "project-merge-map.json"

MANUAL_HINTS = {
    "aku world": "aku-world",
    "projekt x": "projekt-x",
    "run for the oceans": "run-for-the-oceans",
    "rtfo": "run-for-the-oceans",
    "buzzfeed": "buzzfeed",
    "create our future": "create-our-future",
    "destination": "destination",
    "super bowl 2020": "super-bowl-2020",
    "infinite playlist": "infinite-playlist",
    "my shelter": "myshelter",
    "myshelter": "myshelter",
    "flir": "flir",
    "new fronts": "buzzfeed",
    "disenchantment": "disenchantment",
    "the great escape": "the-great-escape",
    "el camino": "el-camino",
    "g-man": "g-man-experiential-campaign",
    "road to 270": "cnn-road-to-270",
    "projecting change": "projecting-change-racing-extinction",
    "racing extinction": "projecting-change-racing-extinction",
    "dubai 360": "dubai-360-spherical-projection-theatre",
    "toyota c-hr": "g-man-experiential-campaign",
    "parley ocean school": "run-for-the-oceans",
    "vip lounge": "super-bowl-2020",
    "cyc projection concepts": "super-bowl-2020",
    "ikon lounge": "myshelter",
    "niagra falls": "run-for-the-oceans",
    "amazon music live outside lands": "infinite-playlist",
    "lighting and environmental design for amazon music live at stagecoach 2023": "infinite-playlist",
    "merchandise created and presented for amazon music at the stagecoach 2023 music festival": "infinite-playlist",
}


def norm(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[’'`]", "", text)
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return " ".join(text.split())


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, norm(a), norm(b)).ratio()


def load_portfolio():
    rows = []
    for path in sorted(PORTFOLIO_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        rows.append(
            {
                "slug": path.stem,
                "title": data.get("title", path.stem),
                "aliases": [data.get("title", ""), data.get("slug", ""), path.stem],
            }
        )
    return rows


def choose_best_match(label: str, portfolio_rows):
    label_norm = norm(label)
    for key, slug in MANUAL_HINTS.items():
        if norm(key) in label_norm:
            matched = next((row for row in portfolio_rows if row["slug"] == slug), None)
            if matched:
                return {"slug": matched["slug"], "title": matched["title"], "score": 0.999}

    best = None
    for row in portfolio_rows:
        score = max(similarity(label, alias) for alias in row["aliases"] if alias)
        if best is None or score > best["score"]:
            best = {"slug": row["slug"], "title": row["title"], "score": score}
    return best


def confidence_from_score(score: float) -> str:
    if score >= 0.93:
        return "exact"
    if score >= 0.78:
        return "fuzzy"
    return "manual_review"


def main():
    deck_catalog = json.loads(DECK_CATALOG_PATH.read_text(encoding="utf-8"))
    video_catalog = json.loads(VIDEO_CATALOG_PATH.read_text(encoding="utf-8"))
    portfolio_rows = load_portfolio()

    deck_map = []
    unresolved_deck = []
    for project in deck_catalog.get("projects", []):
        best = choose_best_match(project.get("projectName", ""), portfolio_rows)
        confidence = confidence_from_score(best["score"]) if best else "manual_review"
        row = {
            "source": "deck",
            "label": project.get("projectName", ""),
            "slugCandidate": project.get("slugCandidate", ""),
            "matchedSlug": best["slug"] if best else None,
            "matchedTitle": best["title"] if best else None,
            "score": round(best["score"], 4) if best else 0.0,
            "confidence": confidence,
        }
        deck_map.append(row)
        if confidence == "manual_review":
            unresolved_deck.append(row)

    video_map = []
    unresolved_video = []
    for entry in video_catalog.get("entries", []):
        best = choose_best_match(entry.get("label", ""), portfolio_rows)
        confidence = confidence_from_score(best["score"]) if best else "manual_review"
        row = {
            "source": "video_md",
            "label": entry.get("label", ""),
            "url": entry.get("url", ""),
            "slugCandidate": entry.get("slugCandidate", ""),
            "matchedSlug": best["slug"] if best else None,
            "matchedTitle": best["title"] if best else None,
            "score": round(best["score"], 4) if best else 0.0,
            "confidence": confidence,
        }
        video_map.append(row)
        if confidence == "manual_review":
            unresolved_video.append(row)

    out = {
        "sources": {
            "deckCatalog": str(DECK_CATALOG_PATH.relative_to(ROOT)).replace("\\", "/"),
            "videoCatalog": str(VIDEO_CATALOG_PATH.relative_to(ROOT)).replace("\\", "/"),
        },
        "portfolioCount": len(portfolio_rows),
        "deckMappings": deck_map,
        "videoMappings": video_map,
        "unresolved": {
            "deck": unresolved_deck,
            "video": unresolved_video,
        },
    }

    OUT_PATH.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH.relative_to(ROOT).as_posix()}")
    print(f"Deck mappings: {len(deck_map)} (manual_review={len(unresolved_deck)})")
    print(f"Video mappings: {len(video_map)} (manual_review={len(unresolved_video)})")


if __name__ == "__main__":
    main()
